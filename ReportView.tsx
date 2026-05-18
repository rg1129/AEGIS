import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Shield, FileText, Download, Copy, CheckCircle, Sparkles, AlertTriangle } from 'lucide-react';
import type { EndpointFinding, ScanSummary, ScanConfig } from '../types';
import { MOCK_REPORT } from '../mockData';
import { formatCurrency } from '../utils/format';

interface ReportViewProps {
  findings: EndpointFinding[];
  summary: ScanSummary;
  config: ScanConfig;
  onBack: () => void;
}

type Tab = 'executive' | 'engineering';

function MarkdownBlock({ text }: { text: string }) {
  // Very simple markdown renderer for the report
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-slate-300 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3 first:mt-0">
              {line.replace('## ', '')}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-base font-semibold text-slate-100 mt-4 mb-2">
              {line.replace('### ', '')}
            </h3>
          );
        }
        if (line.startsWith('#### ')) {
          return (
            <h4 key={i} className="text-sm font-semibold text-cyan-400 mt-3 mb-1">
              {line.replace('#### ', '')}
            </h4>
          );
        }
        if (line.startsWith('```')) {
          return null; // handled in block below
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-cyan-500 flex-shrink-0 mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />
            </div>
          );
        }
        if (/^\d+\./.test(line)) {
          return (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-cyan-500 flex-shrink-0 font-mono">{line.match(/^\d+/)![0]}.</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^\d+\.\s*/, '')) }} />
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
        );
      })}
    </div>
  );
}

// Handle code blocks separately
function ReportSection({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const codeContent = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
          return (
            <div key={i} className="my-4 bg-[#060912] border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/8">
                <span className="text-xs text-slate-500 font-mono">python</span>
                <CopyButton text={codeContent} />
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-5">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }
        return <MarkdownBlock key={i} text={part} />;
      })}
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
      {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-cyan-300 not-italic font-medium">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="text-xs font-mono bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded">$1</code>');
}

export default function ReportView({ findings: _findings, summary, config, onBack }: ReportViewProps) {
  const [tab, setTab] = useState<Tab>('executive');
  const [generating, setGenerating] = useState(true);
  const [streamedText, setStreamedText] = useState('');
  const [fullText, setFullText] = useState('');
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetText = tab === 'executive' ? MOCK_REPORT.executive_brief : MOCK_REPORT.engineering_fixes;

  useEffect(() => {
    setGenerating(true);
    setStreamedText('');
    setFullText('');
    setDone(false);

    const generationDelay = setTimeout(() => {
      setGenerating(false);
      const chars = targetText.split('');
      let i = 0;

      intervalRef.current = setInterval(() => {
        i += Math.floor(Math.random() * 8) + 4;
        if (i >= chars.length) {
          setStreamedText(targetText);
          setFullText(targetText);
          setDone(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setStreamedText(chars.slice(0, i).join(''));
        }
      }, 20);
    }, 1500);

    return () => {
      clearTimeout(generationDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tab]);

  const handleDownload = () => {
    const content = `# Aegis Compliance Report\n\nGenerated: ${new Date().toLocaleString()}\nTarget: ${config.base_url}\n\n---\n\n${MOCK_REPORT.executive_brief}\n\n---\n\n${MOCK_REPORT.engineering_fixes}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aegis-compliance-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Top bar */}
      <div className="border-b border-white/5 px-6 py-4 sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold flex items-center gap-2">
                  AI Compliance Report
                  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Claude
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">{config.base_url}</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-slate-300 text-sm font-medium px-3 py-2 rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Export .md
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#111827] border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{MOCK_REPORT.risk_score}</div>
            <div className="text-xs text-slate-500 mt-0.5">Risk Score</div>
          </div>
          <div className="bg-[#111827] border border-white/8 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-orange-400">{formatCurrency(summary.total_fine_exposure)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Fine Exposure</div>
          </div>
          <div className="bg-[#111827] border border-white/8 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-purple-400">{summary.critical_count}</div>
            <div className="text-xs text-slate-500 mt-0.5">Critical Endpoints</div>
          </div>
        </div>

        {/* Alert */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300/80">
            This report was generated by Claude based on live scan findings. It is for informational purposes only and does not constitute legal advice. Consult your DPO and legal team before taking action.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-[#111827] border border-white/8 rounded-xl p-1">
          <button
            onClick={() => setTab('executive')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === 'executive'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Executive Brief
          </button>
          <button
            onClick={() => setTab('engineering')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === 'engineering'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚙️ Engineering Fixes
          </button>
        </div>

        {/* Report content */}
        <div className="bg-[#111827] border border-white/8 rounded-2xl p-8 min-h-[500px]">
          {generating ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 opacity-30 blur animate-pulse" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-slate-200">Claude is analysing your findings...</div>
                <div className="text-sm text-slate-500 mt-1">
                  {tab === 'executive'
                    ? 'Generating executive brief for your legal and board team'
                    : 'Generating engineering remediation guide'}
                </div>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/8">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-500">
                  Generated by Claude · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {!done && (
                  <span className="text-xs text-purple-400 flex items-center gap-1 ml-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Streaming...
                  </span>
                )}
                {done && <CopyButton text={fullText} />}
              </div>
              <ReportSection text={streamedText + (done ? '' : '▮')} />
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="text-center text-xs text-slate-600">
          Aegis Compliance Report · UOE Summer of Code 2026 · Powered by Anthropic Claude
        </div>
      </div>
    </div>
  );
}
