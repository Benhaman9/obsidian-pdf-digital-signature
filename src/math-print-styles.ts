/** Refresh MathJax's adaptive CSS after native PDF rendering has finished.
 * Obsidian caches the first CSSOM snapshot when cloning popout styles. Rules
 * inserted by MathJax while rendering the export do not update that snapshot.
 */
export async function refreshMathPrintStyles(source: Document, rendered: HTMLElement): Promise<void> {
  const destination = rendered.ownerDocument;
  if (source === destination || !rendered.querySelector('mjx-container[jax="CHTML"]')) return;
  const sourceStyle = source.getElementById('MJX-CHTML-styles') as HTMLStyleElement | null;
  if (!sourceStyle?.sheet) return;
  const css = Array.from(sourceStyle.sheet.cssRules, rule => rule.cssText).join('\n');
  let target = destination.getElementById(sourceStyle.id) as HTMLStyleElement | null;
  if (!target) {
    target = destination.createElement('style');
    target.id = sourceStyle.id;
    destination.head.appendChild(target);
  }
  // Update the existing clone so Obsidian's style synchronizer keeps using it.
  target.textContent = css;
  // Force layout before waiting, so fonts required by the new rules are loaded.
  rendered.getBoundingClientRect();
  await destination.fonts.ready;
}
