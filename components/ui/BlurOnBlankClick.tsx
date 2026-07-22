'use client';

import { useEffect } from 'react';

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'label',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="option"]',
  '[contenteditable="true"]',
  '.ant-btn',
  '.ant-input',
  '.ant-input-affix-wrapper',
  '.ant-select',
  '.ant-picker',
  '.ant-checkbox',
  '.ant-radio',
  '.ant-switch',
  '.ant-dropdown',
  '.ant-dropdown-menu',
  '.ant-modal',
  '.ant-drawer',
  '.ant-popover',
  '.ant-menu-item',
  '.ant-menu-submenu-title',
  '.ant-pagination',
  '.ant-table',
].join(', ');

/**
 * Clears DOM focus when the user clicks on blank / non-interactive space,
 * so buttons and other controls do not stay visually "selected" after use.
 * Also blurs buttons after a mouse/touch click (keyboard :focus-visible is kept).
 */
export function BlurOnBlankClick() {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      // Only primary mouse / touch — ignore right-click, etc.
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest(INTERACTIVE_SELECTOR)) return;

      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        typeof active.blur === 'function'
      ) {
        active.blur();
      }
    };

    /** After a mouse/touch click on a button, drop focus so it does not look stuck selected */
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const btn = target.closest('button, .ant-btn, [role="button"]');
      if (!btn) return;

      // Defer so the click handler still runs with focus if needed
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          (active === btn || btn.contains(active))
        ) {
          active.blur();
        }
      });
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
    };
  }, []);

  return null;
}
