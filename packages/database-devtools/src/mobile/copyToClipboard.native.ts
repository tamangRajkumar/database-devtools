import * as Clipboard from 'expo-clipboard';

export async function copyToClipboard(text: string): Promise<boolean> {
  await Clipboard.setStringAsync(text);
  return true;
}
