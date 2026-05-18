import { useEffect, useState, useRef } from 'react';
import { Shield, Wifi, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import type { EndpointFinding, ScanConfig, ScanSummary } from '../types';
import { MOCK_FINDINGS, MOCK_SUMMARY } from '../mockData';
import { formatCurrency, severityBg, severityLabel } from '../utils/format';

interface ScanViewProps {
  config: ScanConfig;
  onScanComplete: (findings: EndpointFinding[], summary: ScanSummary) => void;
}

interface LogLine {
  id: number;
  text: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'data';
}

const DEMO_ENDPOINTS = [
  '/api/health',
  '/api/products',
  '/api/users/1',
  '/api/appointments',
  '/api/v2/profile',
];

export default function ScanView({ config, onScanComplete }: ScanViewProps) {
  const [phase, setPhase] = useState<'connecting' | 'scanning' | 'analyzing' | 'done'>('connecting');
  const [progress, setProgress] = useState(0);
  const [currentEndpoint, setCurrentEndpoint] = useState('');
  const [completedEndpoints, setCompletedEndpoints] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const logId = useRef(0);
  const startTime = useRef(Date.now());

  const addLog = (text: string, type: LogLine['type'] = 'info') => {
    setLogs(prev => [...prev, { id: logId.current++, text, type }]);
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime.current);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Simulate the SSE scan pipeline
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Phase 1: Connecting
      addLog(`[AEGIS] Initializing scan session...`, 'info');
      await delay(400);
      addLog(`[AEGIS] Target: ${config.base_url}`, 'info');
      await delay(300);
      addLog(`[AEGIS] Company type: ${config.company_type} | User count: ${config.user_count.toLocaleString()}`, 'info');
      await delay(400);
      addLog(`[CONN] Establishing connection to Aegis backend (port 8000)...`, 'info');
      await delay(600);
      addLog(`[CONN] SSE stream established ✓`, 'success');
      await delay(300);
      addLog(`[DISC] Discovering endpoints from ${config.base_url}...`, 'info');
      await delay(500);
      addLog(`[DISC] Found ${DEMO_ENDPOINTS.length} endpoints to scan`, 'success');

      if (cancelled) return;
      setPhase('scanning');

      // Phase 2: Scan each endpoint
      for (let i = 0; i < DEMO_ENDPOINTS.length; i++) {
        if (cancelled) return;
        const ep = DEMO_ENDPOINTS[i];
        const finding = MOCK_FINDINGS[i];

        setCurrentEndpoint(ep);
        setProgress(Math.round((i / DEMO_ENDPOINTS.length) * 70));

        await delay(200);
        addLog(`\n[SCAN] GET ${ep}`, 'info');
        await delay(finding.response_time_ms + Math.random() * 100);
        addLog(`[HTTP] ${finding.status_code} OK — ${finding.response_time_ms}ms`, 'data');
        await delay(150);
        addLog(`[NER]  Running Presidio NER analysis...`, 'info');
        await delay(200);
        addLog(`[RGX]  Applying regex pattern library...`, 'info');
        await delay(150);
        addLog(`[FLD]  Running field name classifier...`, 'info');
        await delay(200);

        if (finding.pii_findings.length > 0) {
          const icon = finding.severity === 'critical' ? '🔴' : '🟡';
          addLog(`${icon} FINDINGS: ${finding.pii_findings.length} PII type(s) detected`, finding.severity === 'critical' ? 'error' : 'warn');
          for (const pii of finding.pii_findings) {
            await delay(80);
            addLog(`    → ${pii.type} [${pii.source}] confidence: ${(pii.confidence * 100).toFixed(0)}%`, 'data');
          }
          addLog(`[REG]  Regulations triggered: ${finding.regulations_triggered.join(', ')}`, 'warn');
          addLog(`[FINE] Exposure: ${formatCurrency(finding.total_fine_exposure)}`, finding.severity === 'critical' ? 'error' : 'warn');
        } else {
          addLog(`✅ No PII detected`, 'success');
        }

        setCompletedEndpoints(prev => [...prev, ep]);
      }

      if (cancelled) return;
      setPhase('analyzing');
      setProgress(80);
      setCurrentEndpoint('');

      addLog(`\n[AGG]  Aggregating findings across all endpoints...`, 'info');
      await delay(400);
      addLog(`[REG]  Computing regulatory blast radius...`, 'info');
      await delay(350);
      addLog(`[FINE] Calculating fine exposure model...`, 'info');
      await delay(400);
      addLog(`[MAP]  Cross-referencing GDPR Art. 83, HIPAA §164, PCI-DSS v4.0, CCPA §1798...`, 'info');
      await delay(500);

      setProgress(95);
      addLog(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
      addLog(`[DONE] Scan complete in ${((Date.now() - startTime.current) / 1000).toFixed(2)}s`, 'success');
      addLog(`[SUMM] Critical: ${MOCK_SUMMARY.critical_count} | Warning: ${MOCK_SUMMARY.warning_count}`, 'warn');
      addLog(`[SUMM] Total fine exposure: ${formatCurrency(MOCK_SUMMARY.total_fine_exposure)}`, 'error');
      addLog(`[SUMM] Blast radius: ${MOCK_SUMMARY.blast_radius.toLocaleString()} users`, 'warn');
      addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');

      await delay(600);
      setProgress(100);
      setPhase('done');

      await delay(800);
      onScanComplete(MOCK_FINDINGS, MOCK_SUMMARY);
    };

    run();
    return () => { cancelled = true; };
  }, []);

  const logColor = (type: LogLine['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-amber-400';
      case 'success': return 'text-green-400';
      case 'data': return 'text-cyan-300';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Aegis</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-400 font-mono">{config.base_url}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-slate-400 font-mono">{(elapsedMs / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: endpoint status */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Endpoint Status
          </h2>

          <div className="space-y-2">
            {DEMO_ENDPOINTS.map((ep, i) => {
              const finding = MOCK_FINDINGS[i];
              const isComplete = completedEndpoints.includes(ep);
              const isCurrent = currentEndpoint === ep;
              const _isPending = !isComplete && !isCurrent; void _isPending;

              return (
                <div
                  key={ep}
                  className={`border rounded-xl p-3 transition-all duration-300 ${
                    isCurrent
                      ? 'border-cyan-500/40 bg-cyan-500/5'
                      : isComplete
                      ? 'border-white/8 bg-white/2'
                      : 'border-white/5 bg-transparent opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      ) : isComplete ? (
                        <div className={`w-2 h-2 rounded-full ${finding.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                      )}
                      <span className="text-xs font-mono text-slate-300">{ep}</span>
                    </div>
                    {isComplete && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${severityBg(finding.severity)}`}>
                        {severityLabel(finding.severity)}
                      </span>
                    )}
                  </div>
                  {isComplete && finding.pii_findings.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      {finding.pii_findings.length} finding{finding.pii_findings.length !== 1 ? 's' : ''} · {formatCurrency(finding.total_fine_exposure)} exposure
                    </div>
                  )}
                  {isCurrent && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-cyan-400">
                      <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      Scanning...
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div className="border border-white/8 rounded-xl p-4 space-y-3 bg-[#111827]">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="uppercase tracking-wider">{phase === 'done' ? 'Scan Complete' : phase === 'analyzing' ? 'Analyzing...' : phase === 'scanning' ? 'Scanning...' : 'Connecting...'}</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {(elapsedMs / 1000).toFixed(1)}s elapsed
            </div>
          </div>
        </div>

        {/* Right: live log */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Live Detection Stream
          </h2>

          <div
            ref={logRef}
            className="bg-[#060912] border border-white/8 rounded-xl p-4 h-[520px] overflow-y-auto font-mono text-xs space-y-0.5 scroll-smooth"
          >
            {logs.map((log) => (
              <div key={log.id} className={`leading-5 ${logColor(log.type)} ${log.text === '' ? 'h-2' : ''}`}>
                {log.text}
              </div>
            ))}
            {phase !== 'done' && (
              <div className="text-slate-600 animate-pulse">▮</div>
            )}
          </div>

          {/* Done CTA */}
          {phase === 'done' && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-semibold text-sm">Scan complete</div>
                  <div className="text-xs text-slate-400">
                    {MOCK_SUMMARY.critical_count} critical · {MOCK_SUMMARY.warning_count} warnings · {formatCurrency(MOCK_SUMMARY.total_fine_exposure)} total exposure
                  </div>
                </div>
              </div>
              <div className="text-xs text-cyan-400 flex items-center gap-1 animate-pulse">
                Loading results <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
