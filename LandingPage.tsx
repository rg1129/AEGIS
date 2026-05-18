import { useState } from 'react';
import { Shield, Zap, AlertTriangle, FileText, ChevronRight, Globe, Users, Building2 } from 'lucide-react';
import type { ScanConfig } from '../types';

interface LandingPageProps {
  onStartScan: (config: ScanConfig) => void;
}

const COMPANY_TYPES = [
  { value: 'general', label: 'General SaaS', icon: '🏢' },
  { value: 'healthcare', label: 'Healthcare / MedTech', icon: '🏥' },
  { value: 'fintech', label: 'FinTech / Banking', icon: '🏦' },
  { value: 'ecommerce', label: 'E-Commerce / Retail', icon: '🛒' },
];

const STATS = [
  { label: 'Avg. detection time', value: '< 60s' },
  { label: 'Regulations mapped', value: '4 major' },
  { label: 'Detection layers', value: '3 AI' },
  { label: 'False positive rate', value: '< 3%' },
];

export default function LandingPage({ onStartScan }: LandingPageProps) {
  const [config, setConfig] = useState<ScanConfig>({
    base_url: 'http://127.0.0.1:8001',
    user_count: 100000,
    company_type: 'general',
    api_key: '',
  });
  const [useMock, setUseMock] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartScan(config);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Aegis</span>
            <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">v0.1 BETA</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#scan" className="hover:text-white transition-colors">Scan</a>
            <span>Docs</span>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded-full">UOE SoC 2026</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            <span className="text-red-300">In 2023, British Airways paid £20M. Their own API was the leak.</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Your API is leaking data
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              right now. Find it first.
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Aegis scans every endpoint in your API, detects PII leakage across 3 AI layers,
            maps violations to GDPR/HIPAA/PCI-DSS/CCPA, and quantifies your fine exposure —
            in under 60 seconds.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 pt-2">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scan Form */}
        <div id="scan" className="mt-16 max-w-2xl mx-auto">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Start Compliance Scan</h2>
                <p className="text-sm text-slate-500">Configure your target API</p>
              </div>
            </div>

            {/* Demo toggle */}
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => {
                  setUseMock(true);
                  setConfig(c => ({ ...c, base_url: 'http://127.0.0.1:8001' }));
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  useMock
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                🎯 Use Demo API (port 8001)
              </button>
              <button
                onClick={() => setUseMock(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  !useMock
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                🌐 Custom API URL
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Base URL */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  <Globe className="w-3 h-3 inline mr-1" /> Target API Base URL
                </label>
                <input
                  type="url"
                  value={config.base_url}
                  onChange={e => setConfig(c => ({ ...c, base_url: e.target.value }))}
                  disabled={useMock}
                  placeholder="https://api.yourcompany.com"
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>

              {/* Company type */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  <Building2 className="w-3 h-3 inline mr-1" /> Company Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_TYPES.map(ct => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, company_type: ct.value }))}
                      className={`py-2 px-3 rounded-lg text-sm border transition-all text-left ${
                        config.company_type === ct.value
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                          : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <span className="mr-2">{ct.icon}</span>
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* User count */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  <Users className="w-3 h-3 inline mr-1" /> Estimated User Count
                  <span className="ml-2 text-cyan-400 font-mono normal-case">{config.user_count.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000000"
                  step="1000"
                  value={config.user_count}
                  onChange={e => setConfig(c => ({ ...c, user_count: Number(e.target.value) }))}
                  className="w-full h-2 rounded-full bg-slate-700 appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>1K</span>
                  <span>Affects fine calculation</span>
                  <span>10M</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Shield className="w-4 h-4" />
                Run Compliance Scan
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-slate-600">
                Scans are read-only. No data is stored without your consent.
              </p>
            </form>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Shield className="w-5 h-5 text-cyan-400" />,
              title: '3-Layer Detection Engine',
              desc: 'Microsoft Presidio NER + custom regex patterns + ML field name classifier. Catches what rule engines miss.',
              color: 'from-cyan-500/5',
            },
            {
              icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
              title: 'Regulatory Blast Radius',
              desc: 'Maps every finding to GDPR, HIPAA, PCI-DSS, and CCPA. Calculates fine exposure based on your user count.',
              color: 'from-orange-500/5',
            },
            {
              icon: <FileText className="w-5 h-5 text-purple-400" />,
              title: 'AI-Written Reports',
              desc: 'Claude generates executive briefs your legal team understands, plus engineering fix guides your devs can act on.',
              color: 'from-purple-500/5',
            },
          ].map((f) => (
            <div key={f.title} className={`bg-gradient-to-br ${f.color} to-transparent border border-white/8 rounded-xl p-6 space-y-3`}>
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 py-6 text-center text-xs text-slate-600">
        Built for UOE Summer of Code 2026 · Aegis v0.1 · "The API compliance layer your legal team didn't know they needed"
      </div>
    </div>
  );
}
