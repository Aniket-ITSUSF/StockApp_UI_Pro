import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';
import AuthGate from './components/AuthGate';
import HomeRedirect from './components/HomeRedirect';

import Analyze from './pages/Analyze';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import ShadowLab from './pages/ShadowLab';
import Settings from './pages/Settings';
import AiRadar from './pages/AiRadar';
import PreMarket from './pages/PreMarket';
import RecentIntelligence from './pages/RecentIntelligence';
import Pricing from './pages/Pricing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

import { BackendProvider } from './context/BackendContext';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './services/queryClient';
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

/**
 * Root of the SPA.
 *
 * Auth + data caching providers wrap a BrowserRouter. Public routes
 * (/sign-in, /sign-up) render full-screen; everything else mounts under
 * <Layout> which provides the persistent sidebar + AuthGate.
 *
 * After login the user lands on `/analyze` (configured in HomeRedirect and
 * the `from` param honoured by SignIn).
 */
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <BackendProvider>
              <Routes>
                {/* Public auth routes */}
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />

                {/* Public-but-shell routes - anyone can browse Analyze and Plans;
                    the page itself shows a "Sign in to analyze" CTA for guests. */}
                <Route element={<Layout />}>
                  <Route index element={<HomeRedirect />} />
                  <Route path="analyze" element={<Analyze />} />
                  <Route path="plans"   element={<Pricing />} />
                </Route>

                {/* Auth-gated routes - wrapped in AuthGate which redirects to /sign-in
                    while preserving the originally-requested URL. */}
                <Route element={<AuthGate><Layout /></AuthGate>}>
                  <Route path="home"      element={<Dashboard />} />
                  <Route path="holdings"  element={<Portfolio />} />
                  <Route path="today"     element={<PreMarket />} />
                  <Route path="discovery" element={<AiRadar />} />
                  <Route path="history"   element={<RecentIntelligence />} />
                  <Route path="backtest"  element={<ShadowLab />} />
                  <Route path="settings"  element={<Settings />} />
                  <Route path="*"         element={<Navigate to="/analyze" replace />} />
                </Route>
              </Routes>
            </BackendProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
