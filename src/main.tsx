import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('BOH Shift Commando failed to render:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#0d0d0f',
            color: '#f4f4f5',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ maxWidth: '28rem' }}>
            <h1 style={{ color: '#e51636', marginBottom: '0.5rem' }}>BOH Shift Commando</h1>
            <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>
              Something went wrong loading the app.
            </p>
            <pre
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                background: '#16161a',
                overflow: 'auto',
                fontSize: '0.875rem',
              }}
            >
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('boh-shift-commando-v1');
                window.location.reload();
              }}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: '#e51636',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset saved data &amp; reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
