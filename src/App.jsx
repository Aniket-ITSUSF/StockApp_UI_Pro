import { useState, Component } from 'react';
import Sidebar, { MobileNav } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import ShadowLab from './pages/ShadowLab';
import Settings from './pages/Settings';
import AiRadar from './pages/AiRadar';
import PreMarket from './pages/PreMarket';
import RecentIntelligence from './pages/RecentIntelligence';
import { BackendProvider } from './context/BackendContext';
import { AdProvider } from './components/ads/AdProvider';
import AdAnchor from './components/ads/AdAnchor';
import CookieConsent from './components/CookieConsent';
import './App.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#f43f5e', background: '#020617', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#f43f5e' }}>Render Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#fca5a5', fontSize: 13 }}>
            {this.state.error.toString()}
            {'\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const PAGES = {
  dashboard:     Dashboard,
  portfolio:     Portfolio,
  'shadow-lab':  ShadowLab,
  'ai-radar':    AiRadar,
  'pre-market':  PreMarket,
  intelligence:  RecentIntelligence,
  settings:      Settings,
};

export default function App() {
  const [page,            setPage]            = useState('dashboard');
  const [hotTicker,       setHotTicker]       = useState('');

  const handleEvaluateTicker = (ticker) => {
    setHotTicker(ticker);
    setPage('dashboard');
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setPage}
            externalPrefilledTicker={hotTicker}
            onExternalPrefilledConsumed={() => setHotTicker('')}
          />
        );
      case 'pre-market':
        return <PreMarket onNavigate={setPage} onEvaluateTicker={handleEvaluateTicker} />;
      default: {
        const Page = PAGES[page] ?? Dashboard;
        return <Page onNavigate={setPage} />;
      }
    }
  };

  return (
    <ErrorBoundary>
      <BackendProvider>
        <AdProvider>
          <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#020617', color: '#e2e8f0' }}>
            <Sidebar currentPage={page} onNavigate={setPage} />
            <main style={{ flex: 1, overflowY: 'auto' }} className="pb-16 md:pb-0">
              <ErrorBoundary>
                {renderPage()}
              </ErrorBoundary>
            </main>
            <MobileNav currentPage={page} onNavigate={setPage} />
            <AdAnchor />
          </div>
          <CookieConsent />
        </AdProvider>
      </BackendProvider>
    </ErrorBoundary>
  );
}
