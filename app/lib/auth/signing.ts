/**
 * Signs the raw session token before it goes in the cookie, so a
 * tampered/corrupted/randomly-guessed cookie value is rejected locally —
 * zero Redis round trips — before it ever reaches session.ts.
 *
 * This is deliberately a separate concern from the hashing in session.ts:
 *   - Signing protects the cookie in transit/at rest in the browser
 *     (integrity — did the server actually issue this exact value).
 *   - Hashing protects the token at rest in Redis (confidentiality — a
 *     store leak alone doesn't yield a usable credential).
 * Neither one substitutes for the other.
 *
 * SESSION_SECRET must be a long, random value from your env (not the same
 * secret as anything else). Rotating it invalidates every existing
 * session, since old signatures stop verifying — treat rotation like a
 * global logout.
 */

const encoder = new TextEncoder();

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");

  cachedKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return cachedKey;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Wraps a raw session token into a signed value fit for a cookie. */
export async function signToken(token: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  return `${token}.${Buffer.from(sig).toString("base64url")}`;
}

/**
 * Verifies a signed cookie value and returns the raw token if valid, or
 * null if it's missing, malformed, or tampered with. Callers should treat
 * null exactly like "no session" — do not fall through to a Redis lookup
 * on a failed signature.
 */
export async function verifySignedToken(
  signed: string | undefined | null
): Promise<string | null> {
  if (!signed) return null;

  const separatorIndex = signed.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const token = signed.slice(0, separatorIndex);
  const providedSig = signed.slice(separatorIndex + 1);

  const key = await getKey();
  const expectedSigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(token)
  );
  const expectedSig = Buffer.from(expectedSigBuffer).toString("base64url");

  if (!timingSafeEqual(expectedSig, providedSig)) return null;
  return token;
}