import { randomBytes } from "crypto";

const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generates a short, opaque, URL-safe token (e.g. "x97bQk2f") suitable for
 * short links like agnt.sr/x97b. Not sequential, not guessable.
 */
export function generatePathwayToken(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BASE62[bytes[i] % BASE62.length];
  }
  return out;
}

/**
 * Builds the full shareable URL for a token.
 */
export function buildShareUrl(token: string): string {
  const domain = process.env.PATHWAY_TOKEN_DOMAIN ?? "agnt.sr";
  return `${domain}/${token}`;
}

export function ttlSecondsFromNow(seconds?: number): Date {
  const ttl = seconds ?? Number(process.env.PATHWAY_TOKEN_TTL_SECONDS ?? 86400);
  return new Date(Date.now() + ttl * 1000);
}
