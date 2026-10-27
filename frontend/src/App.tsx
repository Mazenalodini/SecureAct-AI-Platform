import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScanWorkspace } from './pages/ScanWorkspace';
import { HistoryPage } from './pages/HistoryPage';
import { DemoCases } from './pages/DemoCases';
import { Methodology } from './pages/Methodology';
import { checkHealth, getModelInfo, getMetrics } from './services/api';
import { HealthStatus, ModelInfo, MetricsData, ScanHistoryItem } from './types';

const HISTORY_STORAGE_KEY = 'secureact_history_v2';
const MAX_HISTORY_ITEMS = 50;

export const AppContent: React.FC = () => {
  // Default landing tab is the security scanner workspace
  const [activeTab, setActiveTab] = useState<string>('scanner');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  // Scan History in localStorage
  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-scan target requested from history
  const [rescanTarget, setRescanTarget] = useState<{ type: 'url' | 'text'; value: string } | null>(null);

  useEffect(() => {
    // Initial health and metadata load
    checkHealth()
      .then(setHealth)
      .catch((err) => console.error('Health check failed', err));

    getModelInfo()
      .then(setModelInfo)
      .catch((err) => console.error('Model info load failed', err));

    getMetrics()
      .then(setMetrics)
      .catch((err) => console.error('Metrics load failed', err));
  }, []);

  // Save history to localStorage
  const handleScanCompleted = (item: ScanHistoryItem) => {
    setHistory(prev => {
      // Prepend newest scan, cap at MAX_HISTORY_ITEMS
      const updated = [item, ...prev].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history to localStorage', e);
      }
      return updated;
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update history', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear history', e);
    }
  };

  const handleRescanFromHistory = (target: { type: 'url' | 'text'; value: string }) => {
    setRescanTarget(target);
    setActiveTab('scanner');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab !== 'scanner') setRescanTarget(null);
          setActiveTab(tab);
        }} 
        health={health}
        historyCount={history.length}
      />

      <main style={{ flex: 1, padding: '24px 0' }}>
        {activeTab === 'scanner' && (
          <ScanWorkspace 
            onScanCompleted={handleScanCompleted}
            initialScanTarget={rescanTarget}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage 
            history={history}
            onDeleteItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onRescanTarget={handleRescanFromHistory}
          />
        )}

        {activeTab === 'demo' && (
          <div className="container">
            <DemoCases />
          </div>
        )}

        {activeTab === 'methodology' && (
          <div className="container">
            <Methodology modelInfo={modelInfo} metrics={metrics} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
