import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('oshiss_accepted_policy_version');
      sessionStorage.clear();
      window.location.hash = '#/home';
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'var(--bg-canvas, #F8FAFC)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              borderRadius: 20,
              padding: '32px 24px',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h1
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text-primary, #0F172A)',
                margin: '0 0 8px 0',
              }}
            >
              エラーが発生しました
            </h1>

            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary, #64748B)',
                lineHeight: 1.6,
                margin: '0 0 20px 0',
              }}
            >
              画面の表示中に問題が発生しました。
              <br />
              再読み込みをお試しください。
            </p>

            {this.state.error && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  backgroundColor: 'var(--bg-surface-subtle, #F1F5F9)',
                  fontSize: 11.5,
                  fontFamily: 'monospace',
                  color: '#EF4444',
                  textAlign: 'left',
                  maxHeight: 100,
                  overflowY: 'auto',
                  marginBottom: 20,
                  wordBreak: 'break-all',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'var(--oshi-color, #3B82F6)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} />
                <span>アプリを再読み込み</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  color: 'var(--text-secondary, #64748B)',
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                セッションをリセットしてホームへ戻る
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
