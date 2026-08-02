/** Minimal typed `createElement` helper. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Record<string, unknown>> = {},
  children: Array<Node | string> = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'class') {
      node.className = String(value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign(node.dataset, value as Record<string, string>);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key in node) {
      // Prefer the DOM property when it exists (e.g. `type`, `value`, `textContent`).
      (node as unknown as Record<string, unknown>)[key] = value;
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

/** Namespaced SVG helper for the search icon. */
export function svg(
  width: number,
  height: number,
  inner: string,
  viewBox = '0 0 16 16'
): SVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('viewBox', viewBox);
  node.setAttribute('width', String(width));
  node.setAttribute('height', String(height));
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = inner;
  return node;
}
