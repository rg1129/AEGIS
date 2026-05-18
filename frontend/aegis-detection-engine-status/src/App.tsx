import { useState } from 'react';
import LandingPage from './components/LandingPage';
import ScanView from './components/ScanView';
import ResultsDashboard from './components/ResultsDashboard';
import DeepDiveView from './components/DeepDiveView';
import ReportView from './components/ReportView';
import type { AppView, ScanConfig, EndpointFinding, ScanSummary } from './types';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [config, setConfig] = useState<ScanConfig>({
    base_url: 'http://127.0.0.1:8001',
    user_count: 100000,
    company_type: 'general',
  });
  const [findings, setFindings] = useState<EndpointFinding[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<EndpointFinding | null>(null);

  const handleStartScan = (cfg: ScanConfig) => {
    setConfig(cfg);
    setFindings([]);
    setSummary(null);
    setView('scanning');
  };

  const handleScanComplete = (newFindings: EndpointFinding[], newSummary: ScanSummary) => {
    setFindings(newFindings);
    setSummary(newSummary);
    setView('results');
  };

  const handleDeepDive = (finding: EndpointFinding) => {
    setSelectedFinding(finding);
    setView('deep-dive');
  };

  return (
    <div className="font-sans antialiased">
      {view === 'landing' && (
        <LandingPage onStartScan={handleStartScan} />
      )}

      {view === 'scanning' && (
        <ScanView
          config={config}
          onScanComplete={handleScanComplete}
        />
      )}

      {view === 'results' && summary && (
        <ResultsDashboard
          findings={findings}
          summary={summary}
          config={config}
          onDeepDive={handleDeepDive}
          onViewReport={() => setView('report')}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'deep-dive' && selectedFinding && (
        <DeepDiveView
          finding={selectedFinding}
          userCount={config.user_count}
          onBack={() => setView('results')}
        />
      )}

      {view === 'report' && summary && (
        <ReportView
          findings={findings}
          summary={summary}
          config={config}
          onBack={() => setView('results')}
        />
      )}
    </div>
  );
}
