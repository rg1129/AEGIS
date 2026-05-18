from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import json
import re
import asyncio
from datetime import datetime
from sse_starlette.sse import EventSourceResponse

app = FastAPI(title="Aegis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── PRESIDIO SETUP ────────────────────────────────────────────────────────
from presidio_analyzer import AnalyzerEngine
analyzer = AnalyzerEngine()

# ── REGEX PATTERNS ────────────────────────────────────────────────────────
REGEX_PATTERNS = {
    "card_number": re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b'),
    "password_hash": re.compile(r'\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}'),
    "ssn": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    "auth_token": re.compile(r'\b(eyJ[A-Za-z0-9_-]{10,})\b'),
    "geolocation": re.compile(r'"(latitude|longitude|lat|lng|lon)"\s*:\s*-?\d+\.\d{4,}'),
}

# ── SUSPICIOUS FIELD NAMES ────────────────────────────────────────────────
SUSPICIOUS_FIELDS = [
    "password", "password_hash", "passwd", "secret", "token", "auth_token",
    "card_number", "card_num", "cvv", "ssn", "social_security",
    "internal_margin_score", "internal_risk_tier", "internal_credit_score",
    "health_diagnosis", "diagnosis", "medication", "prescription",
    "passport_number", "passport", "salary", "income", "tax_id",
    "latitude", "longitude", "altitude", "accuracy_meters",
]

# ── REGULATION MAPPING ────────────────────────────────────────────────────
REGULATION_MAP = {
    "card_number":        ["PCI-DSS:Req3", "PCI-DSS:Req4"],
    "password_hash":      ["GDPR:Art5", "GDPR:Art25"],
    "ssn":                ["GDPR:Art9", "CCPA:1798.100"],
    "health_diagnosis":   ["GDPR:Art9", "HIPAA:SafeHarbor"],
    "medication":         ["GDPR:Art9", "HIPAA:SafeHarbor"],
    "passport_number":    ["GDPR:Art9", "GDPR:Art5"],
    "geolocation":        ["GDPR:Art5", "CCPA:1798.100"],
    "latitude":           ["GDPR:Art5", "CCPA:1798.100"],
    "longitude":          ["GDPR:Art5", "CCPA:1798.100"],
    "email":              ["GDPR:Art5", "CCPA:1798.100"],
    "phone_number":       ["GDPR:Art5", "CCPA:1798.100"],
    "internal_margin_score": ["GDPR:Art5"],
    "internal_risk_tier": ["GDPR:Art5"],
}

FINE_RANGES = {
    "card_number":        [50000,  500000],
    "password_hash":      [20000,  200000],
    "ssn":                [50000,  500000],
    "health_diagnosis":   [100000, 1000000],
    "medication":         [100000, 1000000],
    "passport_number":    [50000,  400000],
    "geolocation":        [20000,  200000],
    "latitude":           [20000,  200000],
    "longitude":          [20000,  200000],
    "email":              [5000,   50000],
    "phone_number":       [5000,   50000],
    "internal_margin_score": [1000, 20000],
    "internal_risk_tier": [1000,   20000],
}

# ── HELPERS ───────────────────────────────────────────────────────────────
def flatten_json(obj, prefix=""):
    """Flatten nested JSON into dot-notation field paths."""
    fields = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            fields.update(flatten_json(v, f"{prefix}.{k}" if prefix else k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            fields.update(flatten_json(v, f"{prefix}[{i}]"))
    else:
        fields[prefix] = obj
    return fields

def detect_field(field_name, value, user_count=100000):
    """Run all three detection layers on a single field."""
    findings = []
    str_value = str(value) if value is not None else ""
    field_lower = field_name.lower().split(".")[-1]  # just the last part

    # Layer 1 — Regex
    for pattern_name, pattern in REGEX_PATTERNS.items():
        if pattern.search(str_value) or (pattern_name in field_lower):
            findings.append({
                "field_path": field_name,
                "detected_type": pattern_name,
                "detection_method": "regex",
                "confidence": "definite",
                "consent_status": "leaked",
                "regulations": REGULATION_MAP.get(pattern_name, ["GDPR:Art5"]),
                "fine_range": FINE_RANGES.get(pattern_name, [5000, 50000]),
                "blast_radius": user_count,
                "value_sample": str_value[:20] + "..." if len(str_value) > 20 else str_value,
            })
            return findings  # one finding per field is enough

    # Layer 2 — Suspicious field name
    for suspicious in SUSPICIOUS_FIELDS:
        if suspicious in field_lower:
            findings.append({
                "field_path": field_name,
                "detected_type": suspicious,
                "detection_method": "field_name",
                "confidence": "probable",
                "consent_status": "overcollected",
                "regulations": REGULATION_MAP.get(suspicious, ["GDPR:Art5"]),
                "fine_range": FINE_RANGES.get(suspicious, [1000, 20000]),
                "blast_radius": user_count,
                "value_sample": str_value[:20] + "..." if len(str_value) > 20 else str_value,
            })
            return findings

    # Layer 3 — Presidio NER on string values
    if len(str_value) > 3 and isinstance(value, str):
        results = analyzer.analyze(text=str_value, language="en")
        for r in results:
            if r.score >= 0.5:
                detected_type = r.entity_type.lower()
                confidence = "definite" if r.score >= 0.95 else ("probable" if r.score >= 0.8 else "possible")
                findings.append({
                    "field_path": field_name,
                    "detected_type": detected_type,
                    "detection_method": "presidio",
                    "confidence": confidence,
                    "consent_status": "leaked" if confidence == "definite" else "overcollected",
                    "regulations": REGULATION_MAP.get(detected_type, ["GDPR:Art5"]),
                    "fine_range": FINE_RANGES.get(detected_type, [5000, 50000]),
                    "blast_radius": user_count,
                    "value_sample": str_value[:20] + "..." if len(str_value) > 20 else str_value,
                })
                break  # one finding per field

    return findings

# ── SCAN REQUEST MODEL ────────────────────────────────────────────────────
class ScanRequest(BaseModel):
    base_url: str
    api_token: Optional[str] = None
    user_count: Optional[int] = 100000
    company_type: Optional[str] = "general"

# ── ENDPOINTS TO SCAN (hardcoded for hackathon demo) ─────────────────────
DEMO_ENDPOINTS = [
    {"path": "/api/health",          "method": "GET"},
    {"path": "/api/products",        "method": "GET"},
    {"path": "/api/users/1",         "method": "GET"},
    {"path": "/api/appointments",    "method": "GET"},
    {"path": "/api/v2/profile",      "method": "GET"},
]

# ── MAIN SCAN ENDPOINT (SSE) ──────────────────────────────────────────────
@app.get("/scan")
async def scan(base_url: str, user_count: int = 100000, company_type: str = "general"):
    async def event_stream():
        total_fine = 0
        total_blast = 0
        critical_count = 0
        regulations_found = set()

        async with httpx.AsyncClient(timeout=10.0) as client:
            for i, endpoint in enumerate(DEMO_ENDPOINTS):
                url = base_url.rstrip("/") + endpoint["path"]

                # Signal: scanning started
                yield {
                    "event": "scanning",
                    "data": json.dumps({
                        "index": i,
                        "path": endpoint["path"],
                        "method": endpoint["method"],
                        "status": "scanning"
                    })
                }

                await asyncio.sleep(0.8)  # dramatic pause — good for demo

                try:
                    response = await client.get(url)
                    response_json = response.json()
                    response_time = int(response.elapsed.total_seconds() * 1000)
                except Exception as e:
                    yield {
                        "event": "error",
                        "data": json.dumps({"path": endpoint["path"], "error": str(e)})
                    }
                    continue

                # Run detection on all fields
                flat_fields = flatten_json(response_json)
                endpoint_findings = []

                for field_path, value in flat_fields.items():
                    findings = detect_field(field_path, value, user_count)
                    endpoint_findings.extend(findings)

                # Calculate endpoint-level stats
                if endpoint_findings:
                    ep_fine = sum(f["fine_range"][0] for f in endpoint_findings)
                    total_fine += ep_fine
                    total_blast = max(total_blast, max(f["blast_radius"] for f in endpoint_findings))
                    critical_count += sum(1 for f in endpoint_findings if f["confidence"] == "definite")
                    for f in endpoint_findings:
                        for r in f["regulations"]:
                            regulations_found.add(r.split(":")[0])

                severity = "clean"
                if endpoint_findings:
                    if any(f["confidence"] == "definite" for f in endpoint_findings):
                        severity = "critical"
                    else:
                        severity = "warning"

                # Send result for this endpoint
                yield {
                    "event": "result",
                    "data": json.dumps({
                        "index": i,
                        "path": endpoint["path"],
                        "method": endpoint["method"],
                        "status": severity,
                        "response_time_ms": response_time,
                        "findings": endpoint_findings,
                        "first_finding": endpoint_findings[0]["detected_type"] if endpoint_findings else None,
                        "summary": {
                            "total_fine_so_far": total_fine,
                            "total_blast": total_blast,
                            "critical_count": critical_count,
                            "regulations": list(regulations_found),
                            "endpoints_scanned": i + 1,
                            "total_endpoints": len(DEMO_ENDPOINTS),
                        }
                    })
                }

                await asyncio.sleep(0.5)

        # Final summary event
        yield {
            "event": "complete",
            "data": json.dumps({
                "total_fine_exposure": total_fine,
                "blast_radius": total_blast,
                "critical_findings": critical_count,
                "regulations": list(regulations_found),
                "scanned_at": datetime.now().isoformat(),
            })
        }

    return EventSourceResponse(event_stream())

# ── HEALTH CHECK ──────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"service": "Aegis", "status": "running"}

    # ── GEMINI REPORT GENERATION ──────────────────────────────────────────────
import google.genai as genai

import os
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")  # paste your key


class ReportRequest(BaseModel):
    endpoint_path: str
    findings: list
    user_count: int = 100000
    company_type: str = "general"
@app.post("/report")
async def generate_report(req: ReportRequest):
    client = genai.Client(api_key=GEMINI_API_KEY)
    findings_text = json.dumps(req.findings, indent=2)
    prompt = f"""You are a compliance intelligence system. Analyze these API security findings and return ONLY a JSON object with no markdown, no backticks, no preamble.
Endpoint: {req.endpoint_path}
Company type: {req.company_type}
Estimated users affected: {req.user_count:,}
Findings:
{findings_text}
Return this exact JSON structure:
{{
  "executive_brief": "2-3 paragraph summary written for a CTO and legal team. Board-meeting language. Cover what was found, legal exposure, and recommended immediate action.",
  "engineering_fix": "1 paragraph for the developer explaining exactly what to remove or mask.",
  "fix_diff": {{
    "before": {{"example_field": "sensitive_value"}},
    "after": {{"example_field": "[REDACTED]"}}
  }},
  "risk_level": "critical or high or medium or low",
  "immediate_action": "one sentence, the single most important thing to do right now"
}}"""
    response = client.models.generate_content(
      model="models/gemini-2.5-flash-lite",
        contents=prompt
    )
    raw = response.text.strip()
    try:
        report = json.loads(raw)
    except json.JSONDecodeError:
        clean = raw.replace("```json", "").replace("```", "").strip()
        report = json.loads(clean)
    return report