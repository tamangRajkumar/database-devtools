/** Web / Node fallback — clipboard is provided by the native module. */
export async function copyToClipboard(_text: string): Promise<boolean> {
  return false;
}
