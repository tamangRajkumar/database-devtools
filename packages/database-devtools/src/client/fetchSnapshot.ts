export async function fetchSnapshot(downloadUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch snapshot: ${response.status} ${response.statusText}`);
  }

  return response.arrayBuffer();
}
