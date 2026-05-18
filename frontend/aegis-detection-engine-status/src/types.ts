export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info';

export type Regulation = 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'CCPA';

export interface PIIFinding {
  type: string;
  value: string;
  confidence: number;
  source: string; // 'presidio' | 'regex' | 'field_name'
  regulation: Regulation[];
  fine_range: [number, number];
}

export interface EndpointFinding {
  endpoint: string;
  method: string;
  severity: Severity;
  pii_findings: PIIFinding[];
  blast_radius: number;
  total_fine_exposure: number;
  regulations_triggered: Regulation[];
  response_time_ms: number;
  status_code: number;
  timestamp: string;
}

export interface ScanSummary {
  total_endpoints: number;
  critical_count: number;
  high_count: number;
  warning_count: number;
  total_fine_exposure: number;
  regulations_triggered: Regulation[];
  blast_radius: number;
  scan_duration_ms: number;
}

export interface ScanSession {
  id: string;
  base_url: string;
  user_count: number;
  company_type: string;
  status: 'idle' | 'scanning' | 'complete' | 'error';
  findings: EndpointFinding[];
  summary?: ScanSummary;
  started_at: string;
}

export interface ScanConfig {
  base_url: string;
  user_count: number;
  company_type: string;
  api_key?: string;
}

export interface ReportData {
  executive_brief: string;
  engineering_fixes: string;
  risk_score: number;
  generated_at: string;
}

export type AppView = 'landing' | 'scanning' | 'results' | 'deep-dive' | 'report';
