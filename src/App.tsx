import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { PDFEditorPage } from './pages/PDFEditorPage';
import { MobileWarning } from './components/MobileWarning';

// ── Global error boundary ─────────────────────────────────────────────────────
interface EBState { error: Error | null }
class ErrorBoundary extends React.Component<{ children: React.ReactNode; label?: string }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[FreeCV ErrorBoundary:${this.props.label ?? 'root'}]`, error, info);
  }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'sans-serif', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <h2 style={{ margin: 0, fontSize: 20, color: '#111' }}>Something went wrong</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', maxWidth: 400 }}>{error.message}</p>
        <button
          onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
          style={{ marginTop: 8, padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Go to Home
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '8px 20px', background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}
        >
          Reload page
        </button>
      </div>
    );
  }
}

function App() {
  return (
    <ErrorBoundary label="root">
      <MobileWarning />
      <BrowserRouter>
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', fontSize: 14, borderRadius: 12, padding: '10px 16px' }, success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } } }} />
        <Routes>
          <Route path="/" element={<ErrorBoundary label="home"><HomePage /></ErrorBoundary>} />
          <Route path="/editor" element={<ErrorBoundary label="editor"><EditorPage /></ErrorBoundary>} />
          <Route path="/pdf-editor" element={<ErrorBoundary label="pdf-editor"><PDFEditorPage /></ErrorBoundary>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
