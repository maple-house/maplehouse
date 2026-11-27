import "server-only";
import crypto from "crypto"

export function safe_compare(value1 : string, value2 : string) {
    const a = Buffer.from(value1);
    const b = Buffer.from(value2);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return false
    }else {
        return true
    }
}