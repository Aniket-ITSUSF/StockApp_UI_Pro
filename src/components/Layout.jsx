import { Component } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { MobileNav } from './Sidebar';
import AdAnchor from './ads/AdAnchor';

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

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#020617', color: '#e2e8f0' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }} className="pb-16 md:pb-0">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <MobileNav />
      <AdAnchor />
    </div>
  );
}
