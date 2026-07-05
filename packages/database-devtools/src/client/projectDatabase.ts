import { fetchSnapshot } from './fetchSnapshot';
import {
  resolveProjectDatabaseMetaUrl,
  resolveProjectDatabaseUrl,
  resolveProjectDatabasesUrl,
  type ResolveProjectDatabaseUrlOptions,
} from './resolveProjectDatabaseUrl';

export type ProjectDatabaseMeta = {
  exists: boolean;
  relativePath?: string;
  absolutePath?: string;
  kind?: string;
  mimeType?: string;
  databaseName?: string;
  size?: number;
  updatedAt?: number;
  source?: 'active' | 'device';
  deviceId?: string;
};

export type ListedProjectDatabase = {
  id: string;
  label: string;
  relativePath: string;
  source: 'active' | 'device';
  deviceId?: string;
  bundleId?: string;
  storageKey?: string;
  databaseName?: string;
  size: number;
  updatedAt: number;
};

/** @deprecated Use device-scoped `fetchDeviceExportMeta` instead. Proxies to the newest device export. */
export async function fetchProjectDatabaseMeta(
  serverUrl: string,
  options?: ResolveProjectDatabaseUrlOptions,
): Promise<ProjectDatabaseMeta> {
  const url = resolveProjectDatabaseMetaUrl(serverUrl, options);
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    const networkMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Network error fetching project database metadata from ${url}. ${networkMessage}`);
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch project database metadata from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as ProjectDatabaseMeta;
}

/** @deprecated Use device-scoped `fetchDeviceExportDatabase` instead. Proxies to the newest device export. */
export async function fetchProjectDatabase(
  serverUrl: string,
  options?: ResolveProjectDatabaseUrlOptions,
): Promise<ArrayBuffer> {
  const url = resolveProjectDatabaseUrl(serverUrl, options);
  return fetchSnapshot(url);
}

/** @deprecated Use `fetchDeviceExports` instead. */
export async function fetchProjectDatabases(
  serverUrl: string,
  options?: ResolveProjectDatabaseUrlOptions,
): Promise<ListedProjectDatabase[]> {
  const url = resolveProjectDatabasesUrl(serverUrl, options);
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    const networkMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Network error fetching project databases from ${url}. ${networkMessage}`);
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch project databases from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as { databases?: ListedProjectDatabase[] };
  return payload.databases ?? [];
}
