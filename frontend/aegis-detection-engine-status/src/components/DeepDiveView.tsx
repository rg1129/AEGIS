import { ArrowLeft, Shield, AlertTriangle, ExternalLink, Code2, Eye, EyeOff } from 'lucide-react';
import type { EndpointFinding } from '../types';
import { formatCurrency, severityBg, severityLabel, regulationColor, sourceLabel } from '../utils/format';

interface DeepDiveViewProps {
  finding: EndpointFinding;
  userCount: number;
  onBack: () => void;
}

const REGULATION_ARTICLES: Record<string, { article: string; title: string; url: string }> = {
  'GDPR': {
    article: 'Art. 83',
    title: 'Fines up to €20M or 4% of global turnover',
    url: 'https://gdpr-info.eu/art-83-gdpr/',
  },
  'HIPAA': {
    article: '45 CFR §164.502',
    title: 'PHI disclosure without valid authorization',
    url: 'https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/',
  },
  'PCI-DSS': {
    article: 'v4.0 Req. 3.4',
    title: 'PAN must be unreadable anywhere it is stored',
    url: 'https://www.pcisecuritystandards.org/',
  },
  'CCPA': {
    article: '§1798.100',
    title: 'Right to know what personal information is collected',
    url: 'https://oag.ca.gov/privacy/ccpa',
  },
};

const REMEDIATION_TIPS: Record<string, string> = {
  'CREDIT_CARD': 'Return only last 4 digits. Use tokenization (Stripe/Braintree) for full PAN storage. Never log or serialize raw card numbers.',
  'PASSWORD_HASH': 'Remove password_hash entirely from API responses. This field has zero valid client use cases and exposes your hashing algorithm.',
  'EMAIL_ADDRESS': 'Mask emails in list endpoints (jo***@example.com). Return full email only on authenticated profile endpoints.',
  'US_SSN': 'SSNs must never appear in API responses. Use a separate PII vault (AWS Macie / HashiCorp Vault) and reference by tokenized ID.',
  'MEDICAL_DIAGNOSIS': 'PHI fields require HIPAA BAA with all downstream consumers. Implement field-level encryption + audit logging per 45 CFR §164.312.',
  'MEDICATION': 'Medication data is PHI under HIPAA. Strip from API responses; provide access only via a HIPAA-compliant PHI endpoint with specific consent scope.',
  'PASSPORT_NUMBER': 'Mask passport numbers (P•••••789). Store encrypted; require elevated scope token for access.',
  'GEOLOCATION': 'Truncate coordinates to city-level precision (2 decimal places ~1km). Do not expose street-level or realtime location.',
  'INTERNAL_BUSINESS_SCORE': 'Internal scoring fields should never appear in external API responses. Add a field allowlist/blocklist in your serializer layer.',
  'INTERNAL_RISK_TIER': 'Risk tier data is proprietary and may constitute trade secrets. Remove from all public endpoints via serializer-level field filtering.',
  'VERSION_STRING': 'Version strings in health endpoints can expose attack surface. Consider using a vague "status: ok" with no version details in production.',
  'LOCATION': 'Infrastructure location data (regions, AZs) should not be exposed in public API responses.',
};

export default function DeepDiveView({ finding, userCount, onBack }: DeepDiveViewProps) {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Top bar */}
      <div className="border-b border-white/5 px-6 py-4 sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Endpoint Deep Dive</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${severityBg(finding.severity)}`}>
                  {severityLabel(finding.severity)}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">{finding.method} {finding.endpoint}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-white/8 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Fine Exposure</div>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(finding.total_fine_exposure)}</div>
          </div>
          <div className="bg-[#111827] border border-white/8 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Users at Risk</div>
            <div className="text-2xl font-bold text-orange-400">{userCount.toLocaleString()}</div>
          </div>
          <div className="bg-[#111827] border border-white/8 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">PII Findings</div>
            <div className="text-2xl font-bold text-yellow-400">{finding.pii_findings.length}</div>
          </div>
          <div className="bg-[#111827] border border-white/8 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Response Time</div>
            <div className="text-2xl font-bold text-cyan-400">{finding.response_time_ms}ms</div>
          </div>
        </div>

        {/* PII Findings */}
        <div>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Detected PII — {finding.pii_findings.length} finding{finding.pii_findings.length !== 1 ? 's' : ''}
          </h2>
          <div className="space-y-4">
            {finding.pii_findings.map((pii, i) => (
              <div key={i} className="bg-[#111827] border border-white/8 rounded-2xl p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-200">{pii.type}</span>
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-white/8">
                        {sourceLabel(pii.source)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        pii.confidence >= 0.95 ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                        pii.confidence >= 0.8 ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' :
                        'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'
                      }`}>
                        {(pii.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    {/* Exposed value */}
                    <div className="mt-2 flex items-center gap-2">
                      <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs text-slate-500">Redacted sample:</span>
                      <code className="text-xs font-mono text-red-300 bg-red-500/10 px-2 py-0.5 rounded">{pii.value}</code>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-red-400">{formatCurrency(pii.fine_range[1])}</div>
                    <div className="text-xs text-slate-500">max fine</div>
                  </div>
                </div>

                {/* Regulations */}
                <div>
                  <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Regulations Triggered</div>
                  <div className="flex flex-wrap gap-2">
                    {pii.regulation.map(reg => (
                      <a
                        key={reg}
                        href={REGULATION_ARTICLES[reg]?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-opacity hover:opacity-80 ${regulationColor(reg)}`}
                      >
                        {reg}
                        <span className="opacity-60 text-xs">{REGULATION_ARTICLES[reg]?.article}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                      </a>
                    ))}
                  </div>
                  {pii.regulation.map(reg => REGULATION_ARTICLES[reg]).filter(Boolean).map((r, i) => (
                    <div key={i} className="mt-1 text-xs text-slate-600">{r.title}</div>
                  ))}
                </div>

                {/* Remediation */}
                {REMEDIATION_TIPS[pii.type] && (
                  <div className="bg-[#0a0e1a] border border-cyan-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 mb-2">
                      <Code2 className="w-3.5 h-3.5" />
                      Remediation
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{REMEDIATION_TIPS[pii.type]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fine range breakdown */}
        <div className="bg-[#111827] border border-white/8 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-slate-400" />
            Fine Exposure Breakdown
          </h3>
          <div className="space-y-3">
            {finding.pii_findings.map((pii, i) => {
              const maxAll = Math.max(...finding.pii_findings.map(p => p.fine_range[1]));
              const pct = (pii.fine_range[1] / maxAll) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-mono">{pii.type}</span>
                    <span className="text-slate-300">{formatCurrency(pii.fine_range[0])} – {formatCurrency(pii.fine_range[1])}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/8 flex justify-between">
            <span className="text-sm text-slate-400">Total estimated exposure</span>
            <span className="font-bold text-red-400">{formatCurrency(finding.total_fine_exposure)}</span>
          </div>
        </div>

        {/* HTTP metadata */}
        <div className="bg-[#111827] border border-white/8 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-slate-400" />
            Request Metadata
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Method', value: finding.method },
              { label: 'Status Code', value: String(finding.status_code) },
              { label: 'Response Time', value: `${finding.response_time_ms}ms` },
              { label: 'Blast Radius', value: `${userCount.toLocaleString()} users` },
            ].map(item => (
              <div key={item.label}>
                <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                <div className="font-mono text-slate-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
