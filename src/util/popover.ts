import type { ShowOptions } from '../types';

/** Does this element support the native Popover API? */
export function supportsPopover(host: HTMLElement): boolean {
  return typeof (host as { showPopover?: unknown }).showPopover === 'function';
}

/** Open the host, using the native Popover API when available. */
export function openPopover(host: HTMLElement): void {
  if (supportsPopover(host)) {
    try {
      host.showPopover();
      return;
    } catch {
      /* already open or unsupported state — fall through */
    }
  }
  host.style.display = 'block';
}

/** Close the host. */
export function closePopover(host: HTMLElement): void {
  if (supportsPopover(host)) {
    try {
      host.hidePopover();
      return;
    } catch {
      /* already closed — fall through */
    }
  }
  host.style.display = 'none';
}

/**
 * Position the host relative to an anchor (JS fallback that works in the top
 * layer everywhere). Centres in the viewport when no anchor is given.
 */
export function positionPopover(host: HTMLElement, opts: ShowOptions = {}): void {
  const { anchor, placement = 'auto' } = opts;
  host.style.position = 'fixed';
  host.style.margin = '0';

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = host.offsetWidth || parseInt(host.style.width || '380', 10);
  const h = host.offsetHeight || parseInt(host.style.height || '480', 10);
  const gap = 8;

  if (!anchor) {
    host.style.left = `${Math.max(gap, (vw - w) / 2)}px`;
    host.style.top = `${Math.max(gap, (vh - h) / 2)}px`;
    return;
  }

  const r = anchor.getBoundingClientRect();
  const side = placement === 'auto' ? chooseSide(r, w, h, vw, vh) : placement;

  let top: number;
  let left: number;
  if (side === 'top') {
    top = r.top - h - gap;
    left = r.left;
  } else if (side === 'left') {
    top = r.top;
    left = r.left - w - gap;
  } else if (side === 'right') {
    top = r.top;
    left = r.right + gap;
  } else {
    // bottom
    top = r.bottom + gap;
    left = r.left;
  }

  // Keep the popover inside the viewport.
  left = clamp(left, gap, Math.max(gap, vw - w - gap));
  top = clamp(top, gap, Math.max(gap, vh - h - gap));

  host.style.left = `${left}px`;
  host.style.top = `${top}px`;
}

function chooseSide(
  r: DOMRect,
  w: number,
  h: number,
  vw: number,
  vh: number
): 'top' | 'bottom' | 'left' | 'right' {
  if (r.bottom + h + 8 <= vh) return 'bottom';
  if (r.top - h - 8 >= 0) return 'top';
  if (r.right + w + 8 <= vw) return 'right';
  if (r.left - w - 8 >= 0) return 'left';
  return 'bottom';
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
