export function encodeBasicAuth(username: string, password: string): string {
  return btoa(`${username}:${password}`);
}
