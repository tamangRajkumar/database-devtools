import { exec } from 'node:child_process';

export function openBrowser(url: string): void {
  if (process.env.DATABASE_DEVTOOLS_NO_OPEN === '1') {
    return;
  }

  const platform = process.platform;
  const command =
    platform === 'win32'
      ? `start "" "${url}"`
      : platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (error) => {
    if (error) {
      console.warn(`[database-devtools] Could not open browser automatically: ${error.message}`);
    }
  });
}
