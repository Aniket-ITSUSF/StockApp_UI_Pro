import { useState, Component } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import ShadowLab from './pages/ShadowLab';
import Settings from './pages/Settings';
import AiRadar from './pages/AiRadar';
import RecentIntelligence from './pages/RecentIntelligence';
import { BackendProvider } from './context/BackendContext';
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
  intelligence:  RecentIntelligence,
  settings:      Settings,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const Page = PAGES[page] ?? Dashboard;

  return (
    <ErrorBoundary>
      <BackendProvider>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#020617', color: '#e2e8f0' }}>
          <Sidebar currentPage={page} onNavigate={setPage} />
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <ErrorBoundary>
              <Page onNavigate={setPage} />
            </ErrorBoundary>
          </main>
        </div>
      </BackendProvider>
    </ErrorBoundary>
  );
}
