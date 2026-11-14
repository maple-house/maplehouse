import { cookies } from "next/headers";
import { signToken, verifySignedToken } from "./signing";

const SESSION_COOKIE_NAME = "SSID";
 
export async function setSessionCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const store = await cookies();
  const signedValue = await signToken(token);
  store.set(SESSION_COOKIE_NAME, signedValue, {
    httpOnly: true, // inaccessible to JS — the primary XSS mitigation for session theft
    secure: false, // required by the __Host- prefix; also just correct
    sameSite: "lax", // blocks the classic cross-site POST/state-changing CSRF vector
    path: "/", // required by the __Host- prefix
    expires: expiresAt, // explicit, matches your per-role session lifetime exactly
  });
}


export async function getSessionCookie(): Promise<string | null> {
  const store = await cookies();
  const signedValue = store.get(SESSION_COOKIE_NAME)?.value;
  return verifySignedToken(signedValue);
}
 
export async function deleteSessionCookie(): Promise<void> {
  const store = await cookies();
  // Overwriting with an expired cookie is more reliable across browsers
  // than `delete`, which can silently no-op if attributes don't match
  // exactly (Path/Secure mismatches are a common source of "logout
  // doesn't actually clear the cookie" bugs).
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}