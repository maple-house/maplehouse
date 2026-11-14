import { InsertSessionSchema, TypeInsertSessionSchema } from "@/app/validation/session";
import redis from "../redis/config";
import { AppError } from "@/app/utils/error/AppError";
import crypto from "crypto";
import { JSONParser, JSONSerializer } from "@/app/utils/security/safe_parse_JSON";

/**
 *  Whenever the session token (SSID) is created it is hashed and then stored in the redis session store.
 *  Session token length is 32bytes or 256 bit.
 *  So session can be accessed via token though hashing first token from cookie ---> hash the token ---> find session data via hash in redis session store
 *  Hence hash acts a unique identifier for session data.
 *  Along with the hash another important lookup mechanism is added.
 *  In redis hash set an entry is added with user_id and the key and hash of the token as value.
 *  This enables search of finding the hash (and thus session_data if needed) via user_id.
 *  session is stored as key - session:<hash>, value - session_data
 *  user_id lookup hash is stored as key - user_sessions:<user_id>, value - hash
 */


//Constants
const SESSION_PREFIX = "session:"; //Prefix by which session are stored in redis
const TOKEN_BYTES = 32; //32 bytes or 256 bit size of the token
const USER_INDEX_PREFIX = "user_sessions:"; //Prefix by which user hash are stored in redis

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}


type SessionRecord =  {
        user_id: bigint;
        user_type : "admin" | "client"
        created_at: number;
        expires_at: number;
        auth_state: "otp" | "complete";
    };

/** Generates the token that goes in the cookie. Never stored anywhere. */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  // base64url is compact and cookie-safe without percent-encoding.
  return Buffer.from(bytes).toString("base64url");
}
 
/** One-way transform from token -> DB primary key. */
async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function createSession(session : TypeInsertSessionSchema) {

    //Validate Information
    const result = InsertSessionSchema.safeParse(session);

    //Check if validation is successful
    if(!result.success) {
        throw new AppError("Invalid Request", true);
    }
    //Get data out of the validation
    const { auth_state, user_id, user_type,expiry_time } = result.data;

    const token = generateSessionToken(); //Get a token
    const hash = await hashToken(token); //Hash the token
    const now = Date.now(); //Get current time

    //Generate session data
    const data : SessionRecord = {
        user_id,
        user_type,
        created_at : now,
        expires_at : now + expiry_time,
        auth_state,
    }

    //Serialized data 

    const serialized_data = JSONSerializer(data)

    if(typeof serialized_data === "undefined") {
      throw new AppError("Corrupted Data", false);
    }

    //Store session data in redis
    const pipeline = redis.pipeline(); //Initiates a pipeline of commands
    pipeline.set(SESSION_PREFIX + hash, serialized_data,"EX",expiry_time); //Sets session with hash as the key
    pipeline.sadd(USER_INDEX_PREFIX + user_id + user_type, hash); //Sets user_id as the key to the hash in redis set, if session from user_id is required
    pipeline.expire(USER_INDEX_PREFIX + user_id + user_type, expiry_time);//Sets expiry on for the corresponding redis set key
    await pipeline.exec(); //Execute the commands

    return {token , data} //Returns token and session data

}


export async function readSessionByToken(token : string) {

    const hash = await hashToken(token); // Hashes token

    const raw_session_data = await redis.get(SESSION_PREFIX + hash); //Gets Session Data

    if(raw_session_data === null) {
        return null
    }

    const session_data = JSONParser(raw_session_data); //Parse Session Data

    return session_data as SessionRecord;

}


export async function invalidateSession(token: string): Promise<void> {

  const hash = await hashToken(token); //Hashes Token

  const raw = await redis.get(SESSION_PREFIX + hash); // Get Session Data

  await redis.del(SESSION_PREFIX + hash); //Deletes Session


  if (raw !== null) {
    const { user_id, user_type } = JSON.parse(raw) as SessionRecord;  //Get the user_id from Session Data
    await redis.srem(USER_INDEX_PREFIX + user_id + user_type, hash); //Delete the set key from redis
  }
}


export async function invalidateAllSessionsForUser(
  userId: string,
  userType : "employee" | "owner"
): Promise<void> {
  const indexKey = USER_INDEX_PREFIX + userId + userType;
  const hashes = await redis.smembers(indexKey);
  if (hashes.length === 0) return;
 
  const pipeline = redis.pipeline();
  for (const hash of hashes) {
    pipeline.del(SESSION_PREFIX + hash);
  }
  pipeline.del(indexKey);
  await pipeline.exec();
}

export async function updateSession(
  token: string,
  patch: Partial<SessionRecord>
): Promise<void> {
  const hash = await hashToken(token);
  const key = SESSION_PREFIX + hash;

  const raw = await redis.get(key);
  if (raw === null) {
    throw new AppError("Invalid User", true);
  }

  const session_data = JSONParser(raw) as SessionRecord | null;
  if (session_data === null) {
    throw new AppError("Corrupted Session", true);
  }

  const updated: SessionRecord = { ...session_data, ...patch };

  const serialized_data = JSONSerializer(updated);

  if(typeof serialized_data === "undefined") {
    throw new AppError("Corrupted Data", false);
  }


  // KEEPTTL — auth_state changes (e.g. step-up re-verification for a
  // sensitive action) shouldn't reset how much time is left on the session.
  await redis.set(key, serialized_data, "KEEPTTL");
}