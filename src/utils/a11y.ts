import type React from 'react';

/**
 * `<div onClick>` のような「クリック可能な非ボタン要素」をキーボード / スクリーンリーダーから
 * 操作できるようにするための props を返す。
 * 可能なら素直に <button> を使うこと。ボタン内にボタンを入れ子にできない場合などに使う。
 *
 *   <div className="event-row" {...pressable(() => onOpen(ev))} aria-label="...">
 */
export function pressable(
  onPress: () => void
): Pick<
  React.HTMLAttributes<HTMLElement>,
  'role' | 'tabIndex' | 'onClick' | 'onKeyDown'
> {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: () => onPress(),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      // 子要素（入れ子のボタン等）からのキーイベントは無視
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPress();
      }
    },
  };
}
