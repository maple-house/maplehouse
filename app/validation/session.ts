import z, { ipv6 } from "zod";
import { validate_big_int } from "./general";


export const InsertSessionSchema = z.object({
    user_id : validate_big_int(),
    user_type : z.enum(["admin","client"]),
    auth_state : z.enum(["otp" , "complete"], {error : "Invalid Auth State"}),
    expiry_time : z.number({error : "Invalid Expiry"}).int({error : "Invalid Expiry"}).min(1, {error : "Invalid Expiry"})
})

export type TypeInsertSessionSchema = z.infer<typeof InsertSessionSchema>;