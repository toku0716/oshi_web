/**
 * スマホ端末でのソフトウェアキーボード被り・自動ズーム防止ヘルパー
 */
export function initMobileKeyboardHelper(): void {
  if (typeof window === 'undefined') return;

  const updateViewportMetrics = () => {
    const vv = window.visualViewport;
    if (!vv) return;

    // キーボードのせいで隠れている下部領域の高さを算出
    const keyboardHeight = Math.max(
      0,
      window.innerHeight - Math.round(vv.height + vv.offsetTop)
    );

    document.documentElement.style.setProperty(
      '--keyboard-inset-height',
      `${keyboardHeight}px`
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-height',
      `${Math.round(vv.height)}px`
    );

    if (keyboardHeight > 80) {
      document.documentElement.classList.add('keyboard-open');
    } else {
      document.documentElement.classList.remove('keyboard-open');
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewportMetrics, {
      passive: true,
    });
    window.visualViewport.addEventListener('scroll', updateViewportMetrics, {
      passive: true,
    });
    updateViewportMetrics();
  }

  // 入力フィールドにフォーカスした際、キーボードスライド完了後に確実に中央へスクロール
  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        // キーボードアニメーション（約300ms）を待ってからスクロール
        setTimeout(() => {
          if (document.activeElement === target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 320);
      }
    },
    { passive: true }
  );

  // 初回実行
  updateViewportMetrics();
}
