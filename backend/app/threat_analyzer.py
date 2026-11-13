"""Threat Analyzer and Content Inspector for SecureAct AI.
Extracts readable page content, detects suspicious prompt injection snippets,
and provides XAI (Explainable AI) rationales for both Arabic and English.
"""
import re
import html
from typing import List, Dict, Any, Optional, Callable


# Regex patterns for well-known prompt injection strategies
THREAT_PATTERNS = [
    {
        "category": "system_override",
        "pattern": re.compile(
            r"(?i)\b(ignore|disregard|forget|override|neglect|bypass)\s+(all\s+|any\s+)?(previous|prior|above|system|initial)\s+(instructions|directives|prompts|rules|commands)\b"
        ),
        "risk_level": "high",
        "reason_ar": "محاولة صريحة لتجاوز أو إبطال تعليمات النظام الأساسية للذكاء الاصطناعي.",
        "reason_en": "Explicit attempt to override or disregard prior system instructions.",
    },
    {
        "category": "system_override_ar",
        "pattern": re.compile(
            r"(تجاهل|تجاوز|انسى|الغِ|إلغاء)\s+(كافة|جميع)?\s*(التعليمات|الأوامر|التوجيهات)\s*(السابقة|الأولى|المسبقة)"
        ),
        "risk_level": "high",
        "reason_ar": "أمر مباشر باللغة العربية يطلب تجاهل الأوامر والتعليمات التأسيسية السابقة.",
        "reason_en": "Arabic direct command ordering the model to ignore prior system directives.",
    },
    {
        "category": "identity_hijack",
        "pattern": re.compile(
            r"(?i)\b(you are now|pretend to be|act as|roleplay as|you must now act as)\s+([a-zA-Z0-9_\s]{2,30})\b"
        ),
        "risk_level": "high",
        "reason_ar": "محاولة انتحال شخصية أو فرض هوية بديلة لكسر قيود السلامة والأمان.",
        "reason_en": "Persona hijacking attempt to bypass conversational safety guardrails.",
    },
    {
        "category": "identity_hijack_ar",
        "pattern": re.compile(
            r"(أنت الآن|تقمص دور|تظاهر بأنك|تصرف كأنك)\s+([^\n\r\.]{2,40})"
        ),
        "risk_level": "high",
        "reason_ar": "محاولة فرض هوية بديلة أو تقمص دور لتجاوز الضوابط الأمنية.",
        "reason_en": "Arabic persona adoption attempt to bypass security boundaries.",
    },
    {
        "category": "jailbreak_directive",
        "pattern": re.compile(
            r"(?i)\b(DAN\s+mode|jailbreak|developer\s+mode\s+enabled|unrestricted\s+mode|bypass\s+safety\s+filter)\b"
        ),
        "risk_level": "high",
        "reason_ar": "استخدام مصطلحات وأساليب كسر الحماية (Jailbreak) لتعطيل الفلاتر الأمنية.",
        "reason_en": "Known jailbreak keywords aiming to disable safety filters and restrictions.",
    },
    {
        "category": "delimiter_injection",
        "pattern": re.compile(
            r"(<\|im_start\|>|<\|im_end\|>|\[SYSTEM\]|\[INST\]|\[\/INST\]|###\s*(Instruction|System|Human|Assistant)|```system)"
        ),
        "risk_level": "high",
        "reason_ar": "حقن فواصل نظام خاصة (Special Prompt Delimiters) لمحاكاة قنوات تحكم النظام.",
        "reason_en": "Injection of special format delimiters to impersonate internal control channels.",
    },
    {
        "category": "secret_exfiltration",
        "pattern": re.compile(
            r"(?i)\b(reveal|print|output|display|show|leak|repeat)\s+(all\s+)?(your\s+)?(initial|system|hidden|secret|preceding)\s+(prompt|instructions|rules)\b"
        ),
        "risk_level": "medium",
        "reason_ar": "محاولة استخراج التعليمات السرية أو موجهات النظام الأساسية للمساعد.",
        "reason_en": "Attempt to exfiltrate or display secret system prompts and instructions.",
    },
    {
        "category": "secret_exfiltration_ar",
        "pattern": re.compile(
            r"(اطبع|اكشف|اعرض|أظهر|كرر)\s+(كافة|جميع)?\s*(التعليمات|التوجيهات|الموجهات)\s*(السرية|المخفية|الأصلية)"
        ),
        "risk_level": "medium",
        "reason_ar": "طلب استخراج وطباعة الموجهات والتعليمات المخفية للنموذج.",
        "reason_en": "Arabic command demanding extraction of hidden system guidelines.",
    },
    {
        "category": "covert_comment",
        "pattern": re.compile(
            r"<!--[\s\S]*?(?:ignore|system|instruction|bypass|prompt|execute|assistant)[\s\S]*?-->",
            re.IGNORECASE,
        ),
        "risk_level": "high",
        "reason_ar": "تعليمات خفية مدمجة داخل تعليقات HTML تستهدف وكلاء الذكاء الاصطناعي بشكل غير مرئي.",
        "reason_en": "Covert instructions embedded inside HTML comments targeting AI web parsers.",
    },
    {
        "category": "hidden_css_element",
        "pattern": re.compile(
            r"""<[^>]+style=["'][^"']*(?:display:\s*none|visibility:\s*hidden|font-size:\s*0|opacity:\s*0)[^"']*["'][^>]*>[\s\S]*?</[^>]+>""",
            re.IGNORECASE,
        ),
        "risk_level": "medium",
        "reason_ar": "عنصر HTML مخفي بنمط CSS (نص غير مرئي للمستخدم العادي) يحتوي على نصوص قد توجه الوكيل.",
        "reason_en": "Hidden HTML element styled with zero-opacity or display:none containing covert text.",
    },
]


def strip_html_tags(raw_html: str, max_chars: int = 15000) -> str:
    """Extract clean, human-readable text from HTML by removing scripts, styles, and tags."""
    if not raw_html:
        return ""
    
    # Fast clean: remove <script>...</script> and <style>...</style>
    text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", raw_html)
    text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
    
    # Replace block-level tags with newlines
    text = re.sub(r"(?i)<(?:p|div|h[1-6]|li|tr|blockquote|br)[^>]*>", "\n", text)
    
    # Remove remaining HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    
    # Unescape HTML entities (&amp;, &lt;, &quot;, etc.)
    text = html.unescape(text)
    
    # Normalize whitespaces and blank lines
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
    
    if len(text) > max_chars:
        text = text[:max_chars] + "\n... [المحتوى مقتطع للعرض]"
    
    return text


def detect_threat_snippets(
    content: str,
    is_injection: bool = False,
    model_decision_fn: Optional[Callable[[List[str]], Any]] = None,
    threshold: float = -0.2375,
    max_snippets: int = 8,
) -> List[Dict[str, Any]]:
    """
    Inspects content for prompt injection indicators.
    Combines rule-based pattern matching with model-guided segment scoring (XAI).
    """
    if not content or not content.strip():
        return []

    snippets: List[Dict[str, Any]] = []
    seen_spans: List[tuple] = []

    def _is_overlapping(start: int, end: int) -> bool:
        for s, e in seen_spans:
            if max(start, s) < min(end, e):
                return True
        return False

    # 1. Pattern matching detection
    for item in THREAT_PATTERNS:
        pat = item["pattern"]
        for match in pat.finditer(content):
            start = match.start()
            end = match.end()

            # Expand context slightly around the match for readability
            context_start = max(0, start - 30)
            context_end = min(len(content), end + 30)
            snippet_text = content[context_start:context_end].strip()

            if not _is_overlapping(start, end):
                seen_spans.append((start, end))
                snippets.append({
                    "text": snippet_text,
                    "start_pos": start,
                    "end_pos": end,
                    "category": item["category"],
                    "risk_level": item["risk_level"],
                    "reason_ar": item["reason_ar"],
                    "reason_en": item["reason_en"],
                    "score": None,
                })
            
            if len(snippets) >= max_snippets:
                break
        if len(snippets) >= max_snippets:
            break

    # 2. Model-guided segment scoring (Explainable AI / XAI)
    # If the document was flagged as an injection, or if few pattern snippets were found,
    # evaluate candidate sentences to identify the exact segments influencing the LinearSVC decision.
    if is_injection and model_decision_fn is not None and len(snippets) < max_snippets:
        is_html = bool(re.search(r"<(?:!DOCTYPE|html|head|body|div|p|script|style)[\s>]", content, re.IGNORECASE))
        clean_text = strip_html_tags(content, max_chars=80000) if is_html else content

        # Split text into candidate sentences / paragraphs
        raw_sentences = re.split(r"(?<=[.!?\n])\s+", clean_text)
        candidates = []
        for s in raw_sentences:
            cleaned = s.strip()
            # Only consider sentences with sufficient linguistic length
            if 20 <= len(cleaned) <= 450:
                pos = clean_text.find(cleaned)
                if not _is_overlapping(pos, pos + len(cleaned)):
                    candidates.append((cleaned, pos, pos + len(cleaned)))

        # Batch-score candidates using the model's decision_function
        if candidates:
            # Sample up to 80 sentences evenly across the document to cover all sections
            if len(candidates) > 80:
                step = max(1, len(candidates) // 80)
                sample_candidates = candidates[::step][:80]
            else:
                sample_candidates = candidates

            candidate_texts = [c[0] for c in sample_candidates]
            try:
                scores = model_decision_fn(candidate_texts)
                scored = []
                for (cand_text, start, end), score in zip(sample_candidates, scores):
                    val = float(score)
                    scored.append((val, cand_text, start, end))

                # Sort by highest decision score
                scored.sort(key=lambda x: x[0], reverse=True)

                # First collect sentences above threshold
                above_thresh = [s for s in scored if s[0] >= threshold]

                # If none above threshold, but is_injection is true (diffuse pattern),
                # take the top 2-3 highest scoring sentences to explain the elevation
                selected_segments = above_thresh if above_thresh else scored[:3]

                for val, cand_text, start, end in selected_segments[: max_snippets - len(snippets)]:
                    seen_spans.append((start, end))
                    is_above = val >= threshold
                    snippets.append({
                        "text": cand_text,
                        "start_pos": start,
                        "end_pos": end,
                        "category": "model_signal" if is_above else "diffuse_model_signal",
                        "risk_level": "high" if val > 0.5 else ("medium" if is_above else "low"),
                        "reason_ar": (
                            f"إشارة نموذج الذكاء الاصطناعي: المقطع سجل دالة قرار مرتفعة ({val:+.2f}) مساهماً في مؤشر تصنيف الصفحة."
                            if is_above
                            else f"مؤشر تأثير إحصائي: المقطع سجل أعلى درجة مساهمة نسبية ({val:+.2f}) ضمن سياق الصفحة."
                        ),
                        "reason_en": (
                            f"Model inference signal: segment scored elevated decision margin ({val:+.2f}) contributing to classification."
                            if is_above
                            else f"Statistical influence: segment recorded highest relative contribution ({val:+.2f}) in page context."
                        ),
                        "score": round(val, 4),
                    })
            except Exception:
                pass

    return snippets

