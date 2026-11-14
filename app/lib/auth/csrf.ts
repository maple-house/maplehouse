import { cookies } from "next/headers";

/**
 * CSRF defense, layered per current OWASP guidance:
 *
 *   1. Sec-Fetch-Site header  — primary check. Set by the browser itself,
 *      cannot be spoofed by page JS. ~98%+ browser coverage as of 2026.
 *   2. Origin/Host comparison — fallback for the browsers/proxies that
 *      strip Sec-Fetch-*.
 *   3. Double-submit token    — last-resort fallback for the remaining
 *      sliver of clients (old embedded webviews, some corporate proxies)
 *      that send neither. Also doubles as your defense if you ever expose
 *      these endpoints to non-fetch-metadata API clients.
 *
 * SameSite=Lax on the session cookie (see cookies.ts) is a structural
 * backstop underneath all of this — even if every check here were
 * bypassed, Lax alone stops the cookie from riding along on a forged
 * cross-site POST in the first place. Defense in depth, not either/or.
 */

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Call once per session (e.g. alongside createSession) to seed the double-submit cookie. */
export async function issueCsrfToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Buffer.from(bytes).toString("base64url");

  const store = await cookies();
  store.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // must be readable by client JS to echo back in the header
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return token;
}

export interface CsrfCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Call this at the top of every state-changing route handler (POST/PUT/
 * PATCH/DELETE) that relies on the session cookie for auth. Safe methods
 * (GET/HEAD/OPTIONS) should never reach this — they must not have side
 * effects in the first place.
 */
export async function verifyCsrf(request: Request): Promise<CsrfCheckResult> {
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (secFetchSite) {
    if (secFetchSite === "same-origin" || secFetchSite === "none") {
      return { allowed: true };
    }
    if (secFetchSite === "same-site") {
      // Cookies are shared across subdomains under SameSite=Lax, so a
      // compromised sibling subdomain is a real vector. Treat same-site
      // as cross-site unless you deliberately trust every subdomain.
      return { allowed: false, reason: "cross-subdomain request rejected" };
    }
    // "cross-site"
    return { allowed: false, reason: "cross-site request rejected" };
  }

  // Fallback 1: Origin header vs Host.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return { allowed: false, reason: "malformed origin header" };
    }
    if (originHost === host) return { allowed: true };
    return { allowed: false, reason: "origin/host mismatch" };
  }

  // Fallback 2: double-submit token. Only reached when the browser sends
  // neither Fetch Metadata nor an Origin header — increasingly rare, but
  // this is where non-browser or legacy clients land too.
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return { allowed: false, reason: "missing csrf token" };
  }
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return { allowed: false, reason: "csrf token mismatch" };
  }

  return { allowed: true };
}

/**
 * Convenience wrapper for route handlers:
 *
 *   export async function POST(request: Request) {
 *     const csrf = await requireCsrf(request);
 *     if (csrf) return csrf;
 *     ...
 *   }
 */
export async function requireCsrf(request: Request): Promise<Response | null> {
  const result = await verifyCsrf(request);
  if (!result.allowed) {
    return new Response(JSON.stringify({ error: "CSRF check failed" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}