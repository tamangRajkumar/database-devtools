import {
  PROJECT_DATABASE_API_PATH,
  PROJECT_DATABASE_META_API_PATH,
  PROJECT_DATABASES_API_PATH,
} from '../types/protocol';

export type ResolveProjectDatabaseUrlOptions = {
  useSameOriginApi?: boolean;
};

function resolveApiBase(serverUrl: string, options?: ResolveProjectDatabaseUrlOptions): string {
  if (options?.useSameOriginApi && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return serverUrl.replace(/\/$/, '');
}

export function resolveProjectDatabaseUrl(
  serverUrl: string,
  options?: ResolveProjectDatabaseUrlOptions,
): string {
  return `${resolveApiBase(serverUrl, options)}${PROJECT_DATABASE_API_PATH}`;
}

export function resolveProjectDatabaseMetaUrl(
  serverUrl: string,
  options?: ResolveProjectDatabaseUrlOptions,
): string {
  return `${resolveApiBase(serverUrl, options)}${PROJECT_DATABASE_META_API_PATH}`;
}

export function resolveProjectDatabasesUrl(
  serverUrl: string,
  options?: ResolveProjectDatabaseUrlOptions,
): string {
  return `${resolveApiBase(serverUrl, options)}${PROJECT_DATABASES_API_PATH}`;
}
