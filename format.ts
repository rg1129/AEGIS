import type { Severity, Regulation } from '../types';

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function severityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'text-red-400';
    case 'high': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    case 'warning': return 'text-amber-400';
    case 'low': return 'text-blue-400';
    default: return 'text-slate-400';
  }
}

export function severityBg(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/10 border-red-500/30 text-red-400';
    case 'high': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
    case 'medium': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    case 'warning': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'low': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
  }
}

export function regulationColor(reg: Regulation): string {
  switch (reg) {
    case 'GDPR': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'HIPAA': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'PCI-DSS': return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    case 'CCPA': return 'bg-green-500/15 text-green-300 border-green-500/30';
    default: return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}

export function sourceLabel(source: string): string {
  switch (source) {
    case 'presidio': return 'NER Model';
    case 'regex': return 'Pattern Match';
    case 'field_name': return 'Field Classifier';
    default: return source;
  }
}

export function severityLabel(severity: Severity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
