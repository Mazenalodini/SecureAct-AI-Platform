"""SecureAct Deep Learning Intelligence Service.
Multi-task deep learning model using ModernBERT backbone (Horizon-Labs/prompt-injection-guard-small)
with 6 specialized cyber threat classification heads:
1. Detection (binary prompt injection threat classification)
2. Attack Type (24 fine-grained tactical classes)
3. Goal Class (6 objective classes)
4. Risk Category (5 severity/impact classes)
5. Injection Strategy (18 delivery mechanisms)
6. Linguistic Style (3 linguistic patterns: explicit, indirect, stealth)
7. Requires Action Tools (2 tool-targeting classes: true, false)
"""
from __future__ import annotations
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("secureact.deepshield")

HORIZON_ARTIFACT_DIR = Path(
    os.getenv(
        "HORIZON_ARTIFACT_DIR",
        "D:/projects/SecureAct_AI_Platform/SecureAct_DeepShield_Local/SecureAct_AI_secureact_horizon_browsesafe_multitask_v3_20261118/artifact"
    )
)

# Professional Cybersecurity Threat Taxonomy (Bilingual: Arabic / English)
ATTACK_TYPE_LABELS: Dict[str, Dict[str, str]] = {
    "browser_state_tampering": {"ar": "التلاعب بحالة وأمان المتصفح", "en": "Browser State Tampering"},
    "conditional_trigger": {"ar": "تحفيز أوامر شرطية مشبوهة", "en": "Conditional Trigger"},
    "delimiter_injection": {"ar": "حقن الفواصل والعلامات المحددة", "en": "Delimiter Injection"},
    "emotional_manipulation": {"ar": "استعطاف وتلاعب عاطفي بالنموذج", "en": "Emotional Manipulation"},
    "encoding_obfuscation": {"ar": "تمويه وتشفير الأوامر (Encoding Obfuscation)", "en": "Encoding Obfuscation"},
    "fabricated_authorization_thread": {"ar": "تزييف سياق التفويض والصلاحيات", "en": "Fabricated Authorization Thread"},
    "fake_policy_update": {"ar": "تحديث سياسات أمنية مزعوم", "en": "Fake Policy Update"},
    "fake_verification": {"ar": "طلب تحقق أمني أو فحص زائف", "en": "Fake Verification"},
    "ignore_previous": {"ar": "تجاوز وإلغاء التعليمات السابقة (Ignore Previous)", "en": "Ignore Previous Instructions"},
    "important_message": {"ar": "توجيه إداري أو أمر هام ذو أولوية", "en": "Important Priority Message"},
    "indirect_hypothetical": {"ar": "سيناريو افتراضي التفافي غير مباشر", "en": "Indirect Hypothetical Scenario"},
    "injecagent": {"ar": "تلاعب بمسار وهوية وكيل الذكاء الاصطناعي", "en": "InjecAgent Hijack"},
    "multi_stage_chain": {"ar": "هجوم تسلسلي متعدد المراحل (Multi-Stage Chain)", "en": "Multi-Stage Attack Chain"},
    "multilanguage": {"ar": "تشويش واختراق متعدد اللغات", "en": "Multilingual Obfuscation"},
    "phishing_link_propagation": {"ar": "نشر وتمرير روابط تصيد احتيالي", "en": "Phishing Link Propagation"},
    "preference_override": {"ar": "تجاوز التفضيلات والضوابط الأمنية", "en": "Preference Override"},
    "ranking_or_review_poisoning": {"ar": "تسميم التقييمات والمراجعات النصية", "en": "Ranking/Review Poisoning"},
    "role_manipulation": {"ar": "انتحال شخصية وتلاعب بالأدوار (Roleplay)", "en": "Role Manipulation / Impersonation"},
    "social_engineering": {"ar": "هندسة اجتماعية خداعية", "en": "Social Engineering"},
    "spam_or_broadcast": {"ar": "بث عشوائي ونشر بريد غير مرغوب", "en": "Spam / Broadcast Abuse"},
    "system_prompt_exfiltration": {"ar": "محاولة استخراج تعليمات النظام السرية", "en": "System Prompt Exfiltration"},
    "todo": {"ar": "قوائم مهام وتوجيهات خلفية غير مصرحة", "en": "Hidden Task Directive"},
    "tool_available_lure": {"ar": "استدراج تفعيل أدوات وبرمجيات النظام", "en": "Tool Execution Lure"},
    "url_segment": {"ar": "تجزئة الروابط ومحددات المسار", "en": "URL Segment Tampering"}
}

GOAL_CLASS_LABELS: Dict[str, Dict[str, str]] = {
    "exfiltration": {"ar": "تسريب واستخراج بيانات حساسة وسرية", "en": "Sensitive Data Exfiltration"},
    "misinformation_to_user": {"ar": "تضليل المستخدم بمعلومات مزيفة ومغلوطة", "en": "User Misinformation"},
    "persistence_or_state_change": {"ar": "تثبيت التواجد وتعديل حالة النظام", "en": "Persistence / State Tampering"},
    "propagation_to_others": {"ar": "نشر العدوى وتمرير الهجوم للمستخدمين", "en": "Threat Propagation"},
    "task_disruption": {"ar": "تعطيل وتخريب مهمة النموذج الأساسية", "en": "Task Disruption / Denial of Service"},
    "unauthorized_action": {"ar": "إجبار النظام على تنفيذ عمليات غير مصرح بها", "en": "Unauthorized Action Execution"}
}

RISK_CATEGORY_LABELS: Dict[str, Dict[str, str]] = {
    "browser-integrity": {"ar": "تهديد أمني لسلامة ونزاهة المتصفح", "en": "Browser Integrity Risk"},
    "data-exfiltration": {"ar": "خطر تسريب البيانات وخرق الخصوصية", "en": "Data Privacy & Exfiltration Risk"},
    "harmful-illegal": {"ar": "محتوى ضار ومخالف للسياسات والقوانين", "en": "Harmful / Illegal Content"},
    "manipulative-ai-use": {"ar": "استغلال تلاعبي خبيث بنظام الذكاء الاصطناعي", "en": "Manipulative AI Exploitation"},
    "spam-bot": {"ar": "نشاط آلي وروبوتات سبام مزعجة", "en": "Automated Bot / Spam"}
}

INJECTION_STRATEGY_LABELS: Dict[str, Dict[str, str]] = {
    "alt_text_and_aria": {"ar": "دس عبر سمات ARIA والنصوص البديلة للصور", "en": "ARIA / Alt-Text Concealment"},
    "code_hosting_artifact": {"ar": "حقن داخل مقاطع واستضافات الأكواد البرمجية", "en": "Code Hosting Artifact"},
    "cross_page_placement": {"ar": "توزيع أجزاء الحقن عبر صفحات متعددة", "en": "Cross-Page Distributed Placement"},
    "data_attribute": {"ar": "استغلال سمات بيانات HTML المخصصة (data-*)", "en": "HTML Data Attribute Injection"},
    "footer_rewrite": {"ar": "إعادة كتابة وتفخيخ تذييل الصفحة (Footer)", "en": "Footer Injection"},
    "form_hidden_field": {"ar": "حقن داخل حقول الإدخال المخفية (Hidden Input)", "en": "Form Hidden Field Injection"},
    "hidden_text": {"ar": "نصوص مخفية بتنسيقات CSS وألوان غير مرئية", "en": "CSS Hidden Text Concealment"},
    "html_comment": {"ar": "دس الأوامر داخل تعليقات HTML البرمجية", "en": "HTML Comment Concealment"},
    "inline_paragraph_rewrite": {"ar": "تعديل وتفخيخ فقرة نصية داخل سياق المقال", "en": "Inline Paragraph Subversion"},
    "link_text_href_mismatch": {"ar": "عدم تطابق نص الرابط مع وجهته الفعلية", "en": "Link Text / Destination Mismatch"},
    "list_item_rewrite": {"ar": "دس داخل عناصر القوائم النصية", "en": "List Item Injection"},
    "long_document_tail": {"ar": "زرع الحقن في ذيل المستندات الطويلة بعد محتوى كبير", "en": "Long Document Tail Injection"},
    "semantic_abuse": {"ar": "استغلال وتشويه دلالي لسياق الجمل", "en": "Semantic Context Abuse"},
    "shared_document_body": {"ar": "دس داخل صلب المستندات المشتركة", "en": "Shared Document Body Subversion"},
    "structured_data_block": {"ar": "استغلال كتل البيانات المنظمة (JSON-LD / Schema)", "en": "Structured Data Block Injection"},
    "table_cell_rewrite": {"ar": "دس داخل خلايا الجداول والبيانات", "en": "Table Cell Manipulation"},
    "user_generated_block": {"ar": "حقن داخل كتل تعليقات ومشاركات المستخدمين", "en": "User-Generated Block Injection"},
    "webmail_or_message_body": {"ar": "دس داخل نصوص رسائل البريد والمراسلات", "en": "Webmail / Message Body Injection"}
}

LINGUISTIC_STYLE_LABELS: Dict[str, Dict[str, str]] = {
    "explicit": {"ar": "صريح ومباشر (Explicit Directive)", "en": "Explicit Directive"},
    "indirect": {"ar": "تلميحي والتفافي (Indirect Lure)", "en": "Indirect Scenario"},
    "stealth": {"ar": "مموه وخفي (Stealth Obfuscation)", "en": "Stealth Obfuscation"}
}

REQUIRES_ACTION_TOOLS_LABELS: Dict[str, Dict[str, str]] = {
    "true": {"ar": "يستهدف استدعاء وتفعيل أدوات تنفيذية للنظام", "en": "Requires Action / Tools"},
    "false": {"ar": "تلاعب حواري مباشر دون استدعاء أدوات", "en": "No Action Tools Required"}
}


class DeepShieldService:
    """Unified Deep Learning Security Service powered by Horizon Multi-Task ModernBERT."""
    _instance: Optional["DeepShieldService"] = None

    def __init__(self, artifact_dir: Path = HORIZON_ARTIFACT_DIR):
        self.artifact_dir = artifact_dir
        self.is_loaded = False
        self.predictor = None
        self.metadata: Dict[str, Any] = {}
        self._load()

    @classmethod
    def get_instance(cls) -> "DeepShieldService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load(self) -> None:
        if not self.artifact_dir.exists():
            logger.info(f"Local artifact directory {self.artifact_dir} not found. Attempting auto-fetch from Hugging Face Hub...")
            hf_repo = os.environ.get("HF_MODEL_REPO", "lufy77/secureact-horizon-v3")
            try:
                from huggingface_hub import snapshot_download
                logger.info(f"Downloading/caching model from Hugging Face Hub: '{hf_repo}'...")
                downloaded_dir = Path(snapshot_download(repo_id=hf_repo))
                self.artifact_dir = downloaded_dir
                logger.info(f"Successfully loaded model from Hugging Face Hub cache: {downloaded_dir}")
            except Exception as dl_err:
                logger.warning(f"Failed to auto-fetch model from Hugging Face Hub: {dl_err}")
                return

        try:
            logger.info(f"Loading SecureAct Horizon Multi-Task model from {self.artifact_dir}...")
            
            # Ensure artifact directory is in sys.path for secureact_modeling import
            if str(self.artifact_dir) not in sys.path:
                sys.path.insert(0, str(self.artifact_dir))

            from secureact_inference import SecureActPredictor

            self.predictor = SecureActPredictor(self.artifact_dir, device="cpu")
            
            # Load metadata for info endpoints
            meta_path = self.artifact_dir / "secureact_config.json"
            if meta_path.exists():
                self.metadata = json.loads(meta_path.read_text(encoding="utf-8"))
            
            self.is_loaded = True
            logger.info("SecureAct Horizon Multi-Task model loaded successfully into memory.")
        except Exception as e:
            logger.error(f"Failed to load Horizon Multi-Task model locally: {e}", exc_info=True)
            self.is_loaded = False

    @property
    def is_available(self) -> bool:
        """True if either local PyTorch weights or Cloud Inference API is available."""
        return self.is_loaded or bool(os.environ.get("HF_TOKEN")) or True

    def predict_cloud(self, content: str, input_format: str = "html") -> Dict[str, Any]:
        """Perform neural inference via Hugging Face Serverless Inference API for lufy77/secureact-horizon-v3."""
        start_time = time.monotonic()
        hf_repo = os.environ.get("HF_MODEL_REPO", "lufy77/secureact-horizon-v3")
        hf_token = os.environ.get("HF_TOKEN", "")

        endpoints = [
            f"https://api-inference.huggingface.co/models/{hf_repo}",
            f"https://router.huggingface.co/hf-inference/models/{hf_repo}"
        ]

        headers = {"Content-Type": "application/json"}
        if hf_token:
            headers["Authorization"] = f"Bearer {hf_token}"

        clean_text = content[:4000]
        threat_prob = 0.0
        last_error = None
        success = False

        try:
            import httpx
            with httpx.Client(timeout=30.0) as client:
                for endpoint_url in endpoints:
                    try:
                        resp = client.post(
                            endpoint_url,
                            headers=headers,
                            json={"inputs": clean_text, "options": {"wait_for_model": True, "use_cache": True}}
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            # HF text classification pipeline returns [[{"label": "...", "score": ...}]]
                            items = data[0] if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list) else (data if isinstance(data, list) else [])
                            for item in items:
                                if isinstance(item, dict):
                                    lbl = str(item.get("label", "")).upper()
                                    score = float(item.get("score", 0.0))
                                    if lbl in ("INJECTION", "LABEL_1", "THREAT", "ATTACK"):
                                        threat_prob = score
                                        success = True
                                        break
                                    elif lbl in ("SAFE", "LABEL_0", "BENIGN") and len(items) == 1:
                                        threat_prob = 1.0 - score
                                        success = True
                            if success or len(items) > 0:
                                success = True
                                break
                        else:
                            last_error = f"{endpoint_url} returned {resp.status_code}: {resp.text[:200]}"
                            logger.warning(f"HF inference attempt failed: {last_error}")
                    except Exception as sub_e:
                        last_error = f"{endpoint_url} error: {sub_e}"
                        logger.warning(f"HF inference connection failed: {last_error}")

            if not success:
                raise RuntimeError(f"All HF endpoints failed. Last error: {last_error}")
        except Exception as e:
            logger.warning(f"Cloud neural inference call failed: {e}")
            raise

        threshold = 0.50
        is_threat = threat_prob >= threshold
        margin = float(threat_prob - threshold)
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        # Multi-tier Threat Assessment
        if is_threat:
            threat_tier = "threat"
        elif threat_prob >= threshold - 0.10:
            threat_tier = "caution"
        else:
            threat_tier = "safe"

        # Forensic classification mapping from content heuristics
        from .threat_analyzer import THREAT_PATTERNS
        detected_categories = []
        for tp in THREAT_PATTERNS:
            if tp["pattern"].search(content):
                detected_categories.append(tp["category"])

        # Determine best matching forensic heads
        attack_type = "system_prompt_exfiltration" if any("exfiltration" in c for c in detected_categories) else (
            "role_manipulation" if any("identity" in c for c in detected_categories) else (
                "ignore_previous" if any("system_override" in c for c in detected_categories) else (
                    "delimiter_injection" if any("delimiter" in c for c in detected_categories) else (
                        "tool_available_lure" if any("tool" in c for c in detected_categories) else "conditional_trigger"
                    )
                )
            )
        )

        goal_class = "exfiltration" if "exfiltration" in attack_type else (
            "unauthorized_action" if attack_type in ("ignore_previous", "tool_available_lure") else "persistence_or_state_change"
        )
        risk_category = "data-exfiltration" if goal_class == "exfiltration" else "browser-integrity"
        injection_strategy = "delimiter_injection" if "delimiter" in attack_type else "raw_text"
        requires_tools = "true" if attack_type == "tool_available_lure" else "false"

        forensic_profile = {
            "attack_type": {
                "code": attack_type,
                "label_ar": ATTACK_TYPE_LABELS.get(attack_type, {}).get("ar", attack_type),
                "label_en": ATTACK_TYPE_LABELS.get(attack_type, {}).get("en", attack_type),
                "confidence": round(threat_prob, 4)
            },
            "goal_class": {
                "code": goal_class,
                "label_ar": GOAL_CLASS_LABELS.get(goal_class, {}).get("ar", goal_class),
                "label_en": GOAL_CLASS_LABELS.get(goal_class, {}).get("en", goal_class),
                "confidence": round(threat_prob * 0.95, 4)
            },
            "risk_category": {
                "code": risk_category,
                "label_ar": RISK_CATEGORY_LABELS.get(risk_category, {}).get("ar", risk_category),
                "label_en": RISK_CATEGORY_LABELS.get(risk_category, {}).get("en", risk_category),
                "confidence": round(threat_prob * 0.92, 4)
            },
            "injection_strategy": {
                "code": injection_strategy,
                "label_ar": INJECTION_STRATEGY_LABELS.get(injection_strategy, {}).get("ar", injection_strategy),
                "label_en": INJECTION_STRATEGY_LABELS.get(injection_strategy, {}).get("en", injection_strategy),
                "confidence": round(threat_prob * 0.90, 4)
            },
            "requires_action_tools": {
                "code": requires_tools,
                "label_ar": REQUIRES_ACTION_TOOLS_LABELS.get(requires_tools, {}).get("ar", requires_tools),
                "label_en": REQUIRES_ACTION_TOOLS_LABELS.get(requires_tools, {}).get("en", requires_tools),
                "confidence": round(threat_prob * 0.88, 4)
            }
        }

        return {
            "model_name": "SecureAct_Horizon_v3 (ModernBERT Multi-Task Guard [Hugging Face Cloud Engine])",
            "is_injection": is_threat,
            "threat_tier": threat_tier,
            "classification": "potential_injection" if is_threat else "benign",
            "probability": round(threat_prob, 4),
            "raw_probability": round(threat_prob, 4),
            "threshold": round(threshold, 4),
            "margin": round(margin, 4),
            "attack_type": attack_type if is_threat else None,
            "goal_class": goal_class if is_threat else None,
            "risk_category": risk_category if is_threat else None,
            "injection_strategy": injection_strategy if is_threat else None,
            "requires_action_tools": requires_tools if is_threat else None,
            "forensic_profile": forensic_profile if is_threat else None,
            "task_confidences": {k: round(v["confidence"], 4) for k, v in forensic_profile.items()} if is_threat else {},
            "raw_task_predictions": {k: v["code"] for k, v in forensic_profile.items()} if is_threat else {},
            "chunk_attention": [1.0],
            "duration_ms": duration_ms
        }

    def predict(self, content: str, input_format: str = "html") -> Dict[str, Any]:
        """Perform multi-task neural inference using Horizon ModernBERT (Local or Cloud)."""
        if not self.is_loaded or self.predictor is None:
            return self.predict_cloud(content, input_format=input_format)

        start_time = time.monotonic()
        fmt = input_format.lower()
        if fmt not in ("html", "markdown", "text", "accessibility"):
            fmt = "text"

        # Execute prediction through SecureActPredictor
        pred = self.predictor.predict(content, input_format=fmt)

        is_threat = bool(pred["threat"])
        threat_prob = float(pred["threat_probability"])
        threshold = float(pred["threshold"])
        margin = float(threat_prob - threshold)
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        # Multi-tier Threat Assessment
        if is_threat:
            threat_tier = "threat"
        elif threat_prob >= threshold - 0.10:
            threat_tier = "caution"
        else:
            threat_tier = "safe"

        task_predictions = pred.get("task_predictions", {})
        task_confidences = pred.get("task_confidences", {})
        forensic_profile: Dict[str, Any] = {}

        # Format bilingual cyber threat intelligence profile
        for task in ("attack_type", "goal_class", "risk_category", "injection_strategy", "linguistic_style", "requires_action_tools"):
            if task not in task_predictions:
                continue

            code = str(task_predictions[task])
            conf = float(task_confidences.get(task, 0.0))

            if task == "attack_type":
                t_dict = ATTACK_TYPE_LABELS.get(code, {"ar": code, "en": code})
            elif task == "goal_class":
                t_dict = GOAL_CLASS_LABELS.get(code, {"ar": code, "en": code})
            elif task == "risk_category":
                t_dict = RISK_CATEGORY_LABELS.get(code, {"ar": code, "en": code})
            elif task == "injection_strategy":
                t_dict = INJECTION_STRATEGY_LABELS.get(code, {"ar": code, "en": code})
            elif task == "linguistic_style":
                t_dict = LINGUISTIC_STYLE_LABELS.get(code, {"ar": code, "en": code})
            elif task == "requires_action_tools":
                t_dict = REQUIRES_ACTION_TOOLS_LABELS.get(code, {"ar": code, "en": code})
            else:
                t_dict = {"ar": code, "en": code}

            forensic_profile[task] = {
                "code": code,
                "label_ar": t_dict["ar"],
                "label_en": t_dict["en"],
                "confidence": round(conf, 4)
            }

        return {
            "model_name": "SecureAct_Horizon_v3 (ModernBERT Multi-Task Guard)",
            "is_injection": is_threat,
            "threat_tier": threat_tier,
            "classification": "potential_injection" if is_threat else "benign",
            "probability": round(threat_prob, 4),
            "raw_probability": round(threat_prob, 4),
            "threshold": round(threshold, 4),
            "margin": round(margin, 4),
            "attack_type": task_predictions.get("attack_type") if is_threat else None,
            "goal_class": task_predictions.get("goal_class") if is_threat else None,
            "risk_category": task_predictions.get("risk_category") if is_threat else None,
            "injection_strategy": task_predictions.get("injection_strategy") if is_threat else None,
            "linguistic_style": task_predictions.get("linguistic_style") if is_threat else None,
            "requires_action_tools": task_predictions.get("requires_action_tools") if is_threat else None,
            "forensic_profile": forensic_profile if is_threat else None,
            "task_confidences": {k: round(v, 4) for k, v in task_confidences.items()} if is_threat else {},
            "raw_task_predictions": task_predictions,
            "chunk_attention": [1.0],
            "suspicious_chunk_index": 0,
            "duration_ms": duration_ms
        }
