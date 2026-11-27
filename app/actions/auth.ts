import { getSessionCookie } from "../lib/auth/cookies";
import { readSessionByToken } from "../lib/auth/session";

type TypeGetUserRole = {
    auth : false,
    role : null,
    user_id : null
} | {
    auth : true,
    role : "admin" | "client",
    user_id : bigint
}


export async function GetUserRole() : Promise<TypeGetUserRole> {
    //Session Token
    const session_token = await getSessionCookie(); // Get cookies
    
    if(session_token === null) {
        return {auth : false, role : null, user_id : null}
    }
    
    //Read Session from the session store
    const session_info = await readSessionByToken(session_token); //Get session info from cookies

    if(session_info === null) {
        return {auth : false, role : null, user_id : null}
    }

    if(session_info.auth_state !== "complete") {
        return {auth : false, role : null, user_id : null}
    }

    return {auth : true, role : session_info.user_type, user_id : session_info.user_id}

    
}