<div align="center">

<img src="https://img.shields.io/badge/UOE-Summer%20of%20Code%202026-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/Detection-3%20Layer%20AI-purple?style=for-the-badge" />

<br />
<br />

```
 █████╗ ███████╗ ██████╗ ██╗███████╗
██╔══██╗██╔════╝██╔════╝ ██║██╔════╝
███████║█████╗  ██║  ███╗██║███████╗
██╔══██║██╔══╝  ██║   ██║██║╚════██║
██║  ██║███████╗╚██████╔╝██║███████║
╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝
```

### API Data Leakage & Compliance Intelligence Platform

*Your API is silently leaking user data. Aegis finds it before a regulator does — and writes the report your lawyer needs.*

<br />

</div>

---

## The Problem That Shouldn't Exist

In 2023, British Airways paid **£20 million** in regulatory fines.

No hacker. No breach. No sophisticated attack.

Just an API — *their own API* — quietly returning data it was never supposed to return. For months. To anyone who called it. The engineers who built it were good engineers. They just never had a tool that looked at what their API was **actually returning** versus what it was **supposed to return**.

This is not a rare edge case. This is the norm.

> Meta paid **€1.2 billion**. Clearview AI paid **$9.4 million**. The API was always their own. It was just never audited.

**Aegis is that audit. Automated. Continuous. In under 60 seconds.**

---

## What Aegis Does

Paste your API URL. Hit scan. In under 60 seconds, Aegis:

- Fires authenticated requests against every endpoint in your API
- Runs every response through a 3-layer AI detection pipeline
- Maps every sensitive field to the exact regulation it violates
- Calculates your fine exposure in dollars based on your actual user count
- Estimates how many users are affected — your blast radius
- Generates an AI executive brief your legal team can take to a board meeting
- Generates an engineering remediation guide with before/after code diffs your developer can act on today

---

## Detection Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                      INPUT LAYER                            │
│         OpenAPI Spec  +  Staging Credentials                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST ENGINE                           │
│          httpx async  →  raw response collection            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  3-LAYER DETECTION                          │
│                                                             │
│  Layer 1 ── Microsoft Presidio NER                         │
│             names, emails, SSNs, medical, financial         │
│                                                             │
│  Layer 2 ── Custom Regex Engine                            │
│             card numbers, password hashes, JWT tokens,      │
│             geolocation coordinates                         │
│                                                             │
│  Layer 3 ── Field Name Classifier                          │
│             password_hash is dangerous regardless           │
│             of what's inside it                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  FINDINGS SCHEMA                            │
│   { endpoint, field_path, detected_type, confidence,       │
│     consent_status, regulations, fine_range, blast_radius } │
│                                                             │
│   Everything downstream reads from this single schema.     │
└──────┬──────────┬──────────┬──────────┬────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   UI (SSE)   Reg Map   AI Report   Fine Calc
```

Every detection is classified into one of three confidence tiers:

| Tier | Threshold | Example |
|------|-----------|---------|
| **Definite** | ≥ 0.95 | Regex-matched card number |
| **Probable** | 0.80 – 0.94 | Presidio-detected SSN |
| **Possible** | 0.50 – 0.79 | Ambiguous field name |

---

## Regulatory Coverage

| Regulation | Articles Covered | Trigger |
|------------|-----------------|---------|
| **GDPR** | Art. 5 (minimization), Art. 9 (special category), Art. 25 (privacy by design) | All company types |
| **CCPA** | §1798.100, §1798.150 | All company types |
| **HIPAA** | Safe Harbor 18 identifiers | Healthcare |
| **PCI-DSS** | Requirements 3 & 4 | Fintech, E-commerce |

---

## The Live Demo

Five deliberately vulnerable endpoints. One scan. A story that unfolds in real time.

| Endpoint | What it leaks | Severity |
|----------|--------------|----------|
| `/api/health` | Clean | ✅ None |
| `/api/products` | `internal_margin_score`, `internal_risk_tier` | ⚠️ Warning |
| `/api/users/1` | `card_number`, `password_hash`, `email` | 🔴 Critical |
| `/api/appointments` | `health_diagnosis`, `medication`, `ssn` | 🔴 Critical |
| `/api/v2/profile` | `precise_geolocation`, `passport_number` | 🔴 Critical |

**Total fine exposure detected: $459,000**  
**Blast radius: 100,000 users**  
**Regulations triggered: GDPR, HIPAA, PCI-DSS, CCPA**

---

## Tech Stack

```
Backend          FastAPI · Python · httpx · sse-starlette · SQLite
Detection        Microsoft Presidio · spaCy en_core_web_lg · Custom Regex
AI Layer         Google Gemini · Structured JSON prompting
Frontend         React · TypeScript · Vite · Tailwind CSS
Visualization    Recharts · Framer Motion · Lucide Icons
Streaming        Server-Sent Events (SSE)
```

---

## Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate

pip install fastapi uvicorn sse-starlette httpx \
            presidio-analyzer presidio-anonymizer \
            google-genai

python -m spacy download en_core_web_lg

# Terminal 1 — Mock vulnerable API
uvicorn mock_api:app --port 8001 --reload

# Terminal 2 — Aegis scanner
uvicorn main:app --port 8000 --reload
```

### Frontend

```bash
cd frontend/aegis-detection-engine-status
npm install
npm run dev
```

Open `http://localhost:5174` → select Demo API → Run Compliance Scan.

---

## Project Structure

```
aegis/
├── backend/
│   ├── main.py              # Aegis scanner — FastAPI + SSE + detection pipeline
│   ├── mock_api.py          # Deliberately vulnerable target API (5 endpoints)
│   └── scanner/
│       └── __init__.py
├── frontend/
│   └── aegis-detection-engine-status/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── LandingPage.tsx
│       │   │   ├── ScanView.tsx
│       │   │   ├── ResultsDashboard.tsx
│       │   │   ├── DeepDiveView.tsx
│       │   │   └── ReportView.tsx
│       │   └── types.ts
│       └── package.json
└── README.md
```

---

## Business Model

| Tier | What's included |
|------|----------------|
| **Free** | 10 endpoints per scan, basic PII detection |
| **Pro** | Unlimited endpoints, full regulatory mapping, delta scanning, PDF export |
| **Enterprise** | On-premise deployment for banks and hospitals. Nothing leaves your infrastructure. |

---

## What's Next

- **Delta scanning** — diff every deploy against the previous scan. New leaks flagged. Fixed leaks acknowledged. Aegis becomes a CI/CD layer, not a one-time audit.
- **Browser extension** — click the Aegis icon on any Swagger UI page. It detects the spec, discovers endpoints, and asks: "Found 47 endpoints. Start scan?" One click. No setup.
- **Remediation tracking** — every fix gets a "Resolved ✓" timestamp. Engineers see their work matter.
- **Enterprise on-premise** — full pipeline inside your infrastructure. Zero data egress.

---

## Disclaimer

Aegis identifies potential compliance violations based on automated analysis. This is not legal advice. Consult your DPO and legal team before taking action.

---

<div align="center">

*The API was their own. It just was never audited. Now it can be.*

**Built for UOE Summer of Code 2026**

</div>
