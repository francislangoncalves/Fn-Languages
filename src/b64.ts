const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** ArrayBuffer -> base64 (sem depender de btoa/Buffer) */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const t = (a << 16) | (b << 8) | c;
    parts.push(
      CHARS[(t >> 18) & 63],
      CHARS[(t >> 12) & 63],
      i + 1 < bytes.length ? CHARS[(t >> 6) & 63] : '=',
      i + 2 < bytes.length ? CHARS[t & 63] : '='
    );
  }
  return parts.join('');
}
