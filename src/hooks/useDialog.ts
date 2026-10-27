import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// 開いているダイアログのスタック（ネストしたシートで Esc / フォーカストラップが最前面にだけ効くように）
const dialogStack: symbol[] = [];
let scrollLockCount = 0;
let savedBodyOverflow = '';

/**
 * モーダル / ボトムシート共通のアクセシビリティ挙動をまとめたフック。
 * - Esc で閉じる（最前面のダイアログのみ）
 * - Tab / Shift+Tab のフォーカストラップ
 * - 開いた時にダイアログ内へフォーカス移動、閉じたら元の要素へ復帰
 * - 背景（body）のスクロールロック
 *
 * 使い方:
 *   const ref = useDialog<HTMLDivElement>(isOpen, onClose);
 *   <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="...">
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose: () => void,
  options: { closeOnEscape?: boolean } = {}
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  const closeOnEscape = options.closeOnEscape ?? true;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const id = Symbol('dialog');
    dialogStack.push(id);
    const isTop = () => dialogStack[dialogStack.length - 1] === id;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // スクロールロック
    if (scrollLockCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount += 1;

    // 初期フォーカス（autoFocus 指定の要素があればそれを優先）
    const focusTimer = window.setTimeout(() => {
      const root = ref.current;
      if (!root || root.contains(document.activeElement)) return;
      const auto = root.querySelector<HTMLElement>('[autofocus],[data-autofocus]');
      if (auto) {
        auto.focus();
        return;
      }
      if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '-1');
      root.focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTop()) return;
      const root = ref.current;
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      const idx = dialogStack.indexOf(id);
      if (idx >= 0) dialogStack.splice(idx, 1);
      scrollLockCount = Math.max(0, scrollLockCount - 1);
      if (scrollLockCount === 0) {
        document.body.style.overflow = savedBodyOverflow;
      }
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isOpen, closeOnEscape]);

  return ref;
}
