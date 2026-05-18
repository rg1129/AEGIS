import { useState } from 'react';
import {
  Shield, AlertTriangle, FileText, ChevronRight,
  TrendingUp, Users, Clock, DollarSign, ArrowLeft
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import type { EndpointFinding, ScanSummary, ScanConfig } from '../types';
import { formatCurrency, formatNumber, severityBg, severityLabel, regulationColor } from '../utils/format';

interface ResultsDashboardProps {
  findings: EndpointFinding[];
  summary: ScanSummary;
  config: ScanConfig;
  onDeepDive: (finding: EndpointFinding) => void;
  onViewReport: () => void;
  onBack: () => void;
}

const REG_LABELS: Record<string, string> = {
  'GDPR': 'GDPR',
  'HIPAA': 'HIPAA',
  'PCI-DSS': 'PCI-DSS',
  'CCPA': 'CCPA',
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'warning', 'low', 'info'];

export default function ResultsDashboard({
  findings, summary, config, onDeepDive, onViewReport, onBack
}: ResultsDashboardProps) {
  const [sortBy, setSortBy] = useState<'severity' | 'exposure'>('severity');

  const sorted = [...findings].sort((a, b) => {
    if (sortBy === 'severity') {
      return SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    }
    return b.total_fine_exposure - a.total_fine_exposure;
  });

  // Radar data — regulation coverage
  const radarData = ['GDPR', 'HIPAA', 'PCI-DSS', 'CCPA'].map(reg => {
    const count = findings.filter(f => f.regulations_triggered.includes(reg as any)).length;
    return { reg, count, fullMark: findings.length };
  });

  // Bar chart data — fine by endpoint
  const barData = findings
    .filter(f => f.total_fine_exposure > 0)
    .map(f => ({
      name: f.endpoint.replace('/api/', '/').replace('/api/v2/', '/v2/'),
      exposure: f.total_fine_exposure / 1000,
      severity: f.severity,
    }));

  const severityBarColor = (severity: string) => {
    if (severity === 'critical') return '#f87171';
    if (severity === 'warning') return '#fbbf24';
    return '#60a5fa';
  };

  const riskScore = Math.min(99, Math.round(
    (summary.critical_count * 35 + summary.warning_count * 10) +
    (summary.total_fine_exposure / 10000)
  ));

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Top bar */}
      <div className="border-b border-white/5 px-6 py-4 sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold">Aegis</span>
                <span className="text-slate-600 mx-2">/</span>
                <span className="text-sm text-slate-400 font-mono">{config.base_url}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onViewReport}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-lg shadow-purple-500/20"
          >
            <FileText className="w-4 h-4" />
            View AI Report
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Risk score + KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Risk score */}
          <div className="col-span-2 md:col-span-1 bg-[#111827] border border-red-500/20 rounded-2xl p-5 flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Risk Score</div>
            <div>
              <div className={`text-6xl font-black ${riskScore >= 80 ? 'text-red-400' : riskScore >= 50 ? 'text-amber-400' : 'text-green-400'}`}>
                {riskScore}
              </div>
              <div className="text-xs text-slate-500 mt-1">/ 100 — {riskScore >= 80 ? 'Critical Risk' : riskScore >= 50 ? 'High Risk' : 'Moderate'}</div>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" />
              Fine Exposure
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">{formatCurrency(summary.total_fine_exposure)}</div>
              <div className="text-xs text-slate-500 mt-1">Estimated regulatory fines</div>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Blast Radius
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">{formatNumber(summary.blast_radius)}</div>
              <div className="text-xs text-slate-500 mt-1">Users at risk</div>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/8 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Scan Duration
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">{(summary.scan_duration_ms / 1000).toFixed(2)}s</div>
              <div className="text-xs text-slate-500 mt-1">{summary.total_endpoints} endpoints scanned</div>
            </div>
          </div>
        </div>

        {/* Critical alert banner */}
        {summary.critical_count > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-300">
                {summary.critical_count} critical endpoint{summary.critical_count !== 1 ? 's' : ''} detected
              </div>
              <div className="text-sm text-red-300/70 mt-0.5">
                Your API is actively leaking PII. Under GDPR Article 33, you have 72 hours to notify your DPA after becoming aware of a breach.
                Immediate remediation required.
              </div>
            </div>
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fine exposure bar chart */}
          <div className="bg-[#111827] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-300">Fine Exposure by Endpoint (£K)</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                  formatter={(v: unknown) => [`$${v}K`, 'Exposure']}
                />
                <Bar dataKey="exposure" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={severityBarColor(entry.severity)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Regulation radar */}
          <div className="bg-[#111827] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-300">Regulatory Coverage</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="reg" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar
                  dataKey="count"
                  stroke="#22d3ee"
                  fill="#22d3ee"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regulation badges */}
        <div className="flex flex-wrap gap-2">
          {summary.regulations_triggered.map(reg => (
            <div key={reg} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${regulationColor(reg)}`}>
              <span>{REG_LABELS[reg]}</span>
              <span className="opacity-60">
                ({findings.filter(f => f.regulations_triggered.includes(reg)).length} endpoints)
              </span>
            </div>
          ))}
        </div>

        {/* Endpoint findings table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Endpoint Findings</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('severity')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${sortBy === 'severity' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                By Severity
              </button>
              <button
                onClick={() => setSortBy('exposure')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${sortBy === 'exposure' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                By Exposure
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {sorted.map((finding) => (
              <button
                key={finding.endpoint}
                onClick={() => onDeepDive(finding)}
                className="w-full bg-[#111827] border border-white/8 hover:border-white/20 rounded-xl p-4 text-left transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold flex-shrink-0 ${severityBg(finding.severity)}`}>
                      {severityLabel(finding.severity)}
                    </span>
                    <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded">
                      {finding.method}
                    </span>
                    <span className="font-mono text-sm text-slate-200 truncate">{finding.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <div className="text-sm font-semibold text-red-400">{formatCurrency(finding.total_fine_exposure)}</div>
                      <div className="text-xs text-slate-500">exposure</div>
                    </div>
                    <div className="text-right hidden lg:block">
                      <div className="text-sm text-slate-300">{finding.pii_findings.length} finding{finding.pii_findings.length !== 1 ? 's' : ''}</div>
                      <div className="text-xs text-slate-500">{finding.response_time_ms}ms</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>

                {/* PII types + regulations */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {finding.pii_findings.map((pii, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      {pii.type}
                    </span>
                  ))}
                  <span className="text-xs text-slate-600">·</span>
                  {finding.regulations_triggered.map(reg => (
                    <span key={reg} className={`text-xs px-2 py-0.5 rounded-full border ${regulationColor(reg)}`}>
                      {reg}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Report CTA */}
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold">Generate AI Compliance Report</h3>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Claude generates a boardroom-ready executive brief for your legal team, plus a step-by-step engineering remediation guide your devs can act on today.
          </p>
          <button
            onClick={onViewReport}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20"
          >
            <FileText className="w-4 h-4" />
            Generate Report with Claude
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
