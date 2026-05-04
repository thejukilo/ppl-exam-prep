/**
 * The source data.json contains question text with HTML fragments
 * (mostly `<br />` tags between option labels). React Native does not
 * render HTML directly, so we convert the string into an array of lines.
 *
 *   "Which docs?<br /> a) ...<br /> b) ..." -> ["Which docs?", "a) ...", "b) ..."]
 *
 * For more complex HTML we would reach for react-native-render-html, but
 * the data here only uses <br /> so this is sufficient and dependency-free.
 */
export function htmlToLines(text: string): string[] {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '') // strip any other stray tags
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}
