/** Resize only the Adidas URL forms known to support these transformations. */
export function homeImageUrl(original: string, width: 480 | 192): string {
  // Match the raw URL so that path escaping and query bytes are never normalized.
  const match = /^(https:\/\/assets\.adidas\.com\/images\/)(h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto|w_500,f_auto,q_auto)(\/[^?#]+)(\?[^#]*)?$/.exec(original);
  if (!match) return original;

  // Only a numeric cache version is known to be safe; all other query keys
  // may carry a signature or otherwise affect provider behavior.
  if (match[4] && !/^\?v=\d+$/.test(match[4])) return original;

  return `${match[1]}${match[2].replace(/^(h_2000|w_500)/, `w_${width}`)}${match[3]}${match[4] || ""}`;
}
