import { fetchSnapshot } from './fetchSnapshot';
import type { ListedProjectDatabase, ProjectDatabaseMeta } from './projectDatabase';
import {
  resolveDeviceExportDatabaseMetaUrl,
  resolveDeviceExportDatabaseUrl,
  resolveDeviceExportsUrl,
} from './resolveDeviceDatabaseUrl';
import type { ResolveProjectDatabaseUrlOptions } from './resolveProjectDatabaseUrl';

export type DeviceExportMeta = ProjectDatabaseMeta;
export type ListedDeviceExport = ListedProjectDatabase;

async function fetchJson<T>(url: string, errorLabel: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    const networkMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Network error fetching ${errorLabel} from ${url}. ${networkMessage}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${errorLabel} from ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchDeviceExportMeta(
  serverUrl: string,
  deviceId: string,
  options?: ResolveProjectDatabaseUrlOptions,
): Promise<DeviceExportMeta> {
  const url = resolveDeviceExportDatabaseMetaUrl(serverUrl, deviceId, options);
  return fetchJson<DeviceExportMeta>(url, 'device export metadata');
}

export async function fetchDeviceExportDatabase(
  serverUrl: string,
  deviceId: string,
  options?: ResolveProjectDatabaseUrlOptions,
): Promise<ArrayBuffer> {
  const url = resolveDeviceExportDatabaseUrl(serverUrl, deviceId, options);
  return fetchSnapshot(url);
}

export async function fetchDeviceExports(
  serverUrl: string,
  options?: ResolveProjectDatabaseUrlOptions,
): Promise<ListedDeviceExport[]> {
  const url = resolveDeviceExportsUrl(serverUrl, options);
  const payload = await fetchJson<{ devices?: ListedDeviceExport[] }>(url, 'device exports');
  return payload.devices ?? [];
}
