import { getSessionCookie } from "./cookies";
import { readSessionByToken } from "./session";

type HandlePermissionResponse<T extends string> = {
    user : {
        user_id : bigint, user_type : "owner" | "employee" , tenant_id : bigint, role_id : bigint , permission : T | "master"
    },
    error : undefined
} |  {
    error : string,
    user : undefined
}

export type HandlePermissionInput<T extends string> = {
    required_permission : {
        name : T,
        permissions : string[]
    }[]
}


export async function handlePermission<T extends string>({ required_permission } : HandlePermissionInput<T>) : Promise<HandlePermissionResponse<T>> {

    const token = await getSessionCookie();

    if(token === null) {
        return {error : "Please login", user : undefined}
    }

    const session_info = await readSessionByToken(token);

    if(session_info === null) {
        return {error : "Please login", user : undefined}
    }

    const {auth_state, user_id, user_type, tenant_id, role_id, permissions } = session_info;

    if(auth_state !== "complete") {
        return {error : "Please complete login", user : undefined}
    }

    if(permissions.includes("master") || user_type === "owner") {
        return {user : {
            user_id : user_id,
            user_type : user_type,
            tenant_id : tenant_id!,
            role_id : role_id!,
            permission : "master",
        }, error : undefined}
    }

    required_permission.sort((x,y) => y.permissions.length - x.permissions.length);

    required_permission.forEach((x) => {

        const current_permission = x.permissions;

        const is_subset = permissions.every(x => current_permission.includes(x));

        if(is_subset) {
            return {user : { user_id, user_type, tenant_id, role_id, permission : x.name}, error : undefined}
        }
    })

    return {error : "Required permissions not available", user : undefined}
    
}