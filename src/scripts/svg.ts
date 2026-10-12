export const SVG_NS = "http://www.w3.org/2000/svg";

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Create an SVG element with attributes, optionally appending it to a parent. */
export function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (parent) parent.appendChild(node);
  return node;
}
