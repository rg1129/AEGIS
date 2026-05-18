import type { EndpointFinding, ScanSummary } from './types';

export const MOCK_FINDINGS: EndpointFinding[] = [
  {
    endpoint: '/api/health',
    method: 'GET',
    severity: 'warning',
    pii_findings: [
      {
        type: 'VERSION_STRING',
        value: '2.1.0',
        confidence: 0.62,
        source: 'presidio',
        regulation: ['GDPR'],
        fine_range: [0, 5000],
      },
      {
        type: 'LOCATION',
        value: 'us-east',
        confidence: 0.58,
        source: 'presidio',
        regulation: ['GDPR'],
        fine_range: [0, 5000],
      },
    ],
    blast_radius: 100000,
    total_fine_exposure: 10000,
    regulations_triggered: ['GDPR'],
    response_time_ms: 42,
    status_code: 200,
    timestamp: new Date().toISOString(),
  },
  {
    endpoint: '/api/products',
    method: 'GET',
    severity: 'warning',
    pii_findings: [
      {
        type: 'INTERNAL_BUSINESS_SCORE',
        value: 'internal_margin_score',
        confidence: 0.91,
        source: 'field_name',
        regulation: ['GDPR', 'CCPA'],
        fine_range: [5000, 25000],
      },
      {
        type: 'INTERNAL_RISK_TIER',
        value: 'internal_risk_tier',
        confidence: 0.88,
        source: 'field_name',
        regulation: ['GDPR', 'CCPA'],
        fine_range: [5000, 25000],
      },
    ],
    blast_radius: 100000,
    total_fine_exposure: 50000,
    regulations_triggered: ['GDPR', 'CCPA'],
    response_time_ms: 87,
    status_code: 200,
    timestamp: new Date().toISOString(),
  },
  {
    endpoint: '/api/users/1',
    method: 'GET',
    severity: 'critical',
    pii_findings: [
      {
        type: 'CREDIT_CARD',
        value: '4532•••••••1234',
        confidence: 0.99,
        source: 'regex',
        regulation: ['PCI-DSS', 'GDPR', 'CCPA'],
        fine_range: [50000, 500000],
      },
      {
        type: 'PASSWORD_HASH',
        value: '$2b$12$eImiT...',
        confidence: 0.97,
        source: 'field_name',
        regulation: ['GDPR', 'CCPA'],
        fine_range: [20000, 200000],
      },
      {
        type: 'EMAIL_ADDRESS',
        value: 'jo***@example.com',
        confidence: 0.99,
        source: 'presidio',
        regulation: ['GDPR', 'CCPA'],
        fine_range: [10000, 100000],
      },
    ],
    blast_radius: 100000,
    total_fine_exposure: 800000,
    regulations_triggered: ['PCI-DSS', 'GDPR', 'CCPA'],
    response_time_ms: 124,
    status_code: 200,
    timestamp: new Date().toISOString(),
  },
  {
    endpoint: '/api/appointments',
    method: 'GET',
    severity: 'critical',
    pii_findings: [
      {
        type: 'US_SSN',
        value: '***-**-6789',
        confidence: 0.99,
        source: 'regex',
        regulation: ['HIPAA', 'GDPR', 'CCPA'],
        fine_range: [100000, 1900000],
      },
      {
        type: 'MEDICAL_DIAGNOSIS',
        value: 'Type 2 Diabetes',
        confidence: 0.94,
        source: 'presidio',
        regulation: ['HIPAA', 'GDPR'],
        fine_range: [50000, 500000],
      },
      {
        type: 'MEDICATION',
        value: 'Metformin 500mg',
        confidence: 0.92,
        source: 'presidio',
        regulation: ['HIPAA', 'GDPR'],
        fine_range: [50000, 500000],
      },
    ],
    blast_radius: 100000,
    total_fine_exposure: 2400000,
    regulations_triggered: ['HIPAA', 'GDPR', 'CCPA'],
    response_time_ms: 156,
    status_code: 200,
    timestamp: new Date().toISOString(),
  },
  {
    endpoint: '/api/v2/profile',
    method: 'GET',
    severity: 'critical',
    pii_findings: [
      {
        type: 'PASSPORT_NUMBER',
        value: 'P•••••789',
        confidence: 0.96,
        source: 'regex',
        regulation: ['GDPR', 'CCPA'],
        fine_range: [50000, 500000],
      },
      {
        type: 'GEOLOCATION',
        value: '51.5074, -0.1278',
        confidence: 0.99,
        source: 'field_name',
        regulation: ['GDPR', 'CCPA'],
        fine_range: [20000, 200000],
      },
      {
        type: 'EMAIL_ADDRESS',
        value: 'al***@corp.com',
        confidence: 0.99,
        source: 'presidio',
        regulation: ['GDPR', 'CCPA'],
        fine_range: [10000, 100000],
      },
    ],
    blast_radius: 100000,
    total_fine_exposure: 800000,
    regulations_triggered: ['GDPR', 'CCPA'],
    response_time_ms: 98,
    status_code: 200,
    timestamp: new Date().toISOString(),
  },
];

export const MOCK_SUMMARY: ScanSummary = {
  total_endpoints: 5,
  critical_count: 3,
  high_count: 0,
  warning_count: 2,
  total_fine_exposure: 459000,
  regulations_triggered: ['GDPR', 'PCI-DSS', 'HIPAA', 'CCPA'],
  blast_radius: 100000,
  scan_duration_ms: 2847,
};

export const MOCK_REPORT = {
  executive_brief: `## Executive Risk Summary

Aegis has completed a full-surface scan of your API infrastructure and identified **critical data leakage across 3 of 5 endpoints**. Your platform is currently exposing Protected Health Information (PHI), financial card data, and personally identifiable information in live API responses — without any apparent access controls or field-level redaction.

**The total regulatory fine exposure stands at $459,000**, with potential escalation to **$4.06M** under worst-case HIPAA tier-4 penalties if a breach is formally reported. This is not a theoretical risk — the data is readable by any authenticated caller today.

### Key Findings

1. **/api/users/1** is returning raw credit card numbers and bcrypt password hashes. Under PCI-DSS v4.0, storing or transmitting PANs in clear text triggers mandatory breach notification and fines up to $100,000/month.

2. **/api/appointments** exposes Social Security Numbers, medical diagnoses, and prescription data. This constitutes a HIPAA violation under 45 CFR §164.502. A single reported breach at this scale (100,000 users) qualifies for Tier 3–4 penalties.

3. **/api/v2/profile** leaks passport numbers and real-time geolocation. Under GDPR Article 9, biometric and location data require explicit consent and separate processing agreements.

### Recommended Immediate Actions

- Implement field-level redaction on all user-facing endpoints within **24 hours**
- Rotate all exposed credential hashes and notify your security team
- Engage your DPO to assess formal breach notification obligations under GDPR Article 33 (72-hour window)`,

  engineering_fixes: `## Engineering Remediation Guide

### Priority 1 — CRITICAL (Fix within 24h)

#### /api/users/1 — Remove card data + credential exposure

\`\`\`python
# BEFORE (vulnerable)
return {
    "id": user.id,
    "email": user.email,
    "card_number": user.card_number,  # ❌ Full PAN
    "password_hash": user.password_hash,  # ❌ Hash exposure
}

# AFTER (remediated)
return {
    "id": user.id,
    "email": mask_email(user.email),
    "card_last_four": user.card_number[-4:],  # ✅ Last 4 only
    # password_hash: removed entirely
}
\`\`\`

#### /api/appointments — Redact PHI fields

\`\`\`python
# Add field-level PHI redaction middleware
PHI_FIELDS = {"ssn", "diagnosis", "medication", "dob", "mrn"}

def redact_phi(response_dict: dict) -> dict:
    return {
        k: "[REDACTED]" if k in PHI_FIELDS else v
        for k, v in response_dict.items()
    }
\`\`\`

### Priority 2 — HIGH (Fix within 72h)

#### /api/v2/profile — Remove passport + precise geolocation

\`\`\`python
# Truncate geolocation to city-level precision
def truncate_geo(lat: float, lon: float) -> dict:
    return {"lat": round(lat, 1), "lon": round(lon, 1)}  # ~10km precision

# Replace passport with masked version
"passport": f"{'*' * 6}{passport[-3:]}"
\`\`\`

### Priority 3 — Infrastructure

1. **Add a PII scanning middleware** that runs on every response before it leaves your API gateway
2. **Implement RBAC** — sensitive fields should require elevated scope tokens
3. **Enable audit logging** for all endpoints returning user data (GDPR Article 30)
4. **Set up automated scanning** in CI/CD — run Aegis on every PR that touches API response schemas`,

  risk_score: 94,
  generated_at: new Date().toISOString(),
};
