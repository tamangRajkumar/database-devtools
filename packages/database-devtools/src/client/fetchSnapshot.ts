export async function fetchSnapshot(downloadUrl: string): Promise<ArrayBuffer> {
  let response: Response;

  try {
    response = await fetch(downloadUrl);
  } catch (error) {
    const networkMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Network error fetching snapshot from ${downloadUrl}. ${networkMessage} If the web UI runs on a different port than the hub, ensure CORS is enabled on the hub HTTP API.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch snapshot from ${downloadUrl}: ${response.status} ${response.statusText}`,
    );
  }

  return response.arrayBuffer();
}
