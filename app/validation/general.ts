import z from "zod"

export function validate_mobile_number() { 
  return z
    .string()
    .regex(/^\d+$/, { error : "Invalid Phone Number"})
    .length(10, { message: "Invalid Phone Number" })
}


export function validate_big_int() {
  return z.bigint({error : "Invalid Id"}).min(BigInt(1), {error : "Invalid Id"})
}

export function validate_sort(fields : string[]) {
  return z.object({
    field : z.enum(fields),
    order : z.enum(["asc","desc"])
  }).optional()
}

export function validate_pagination() {
  return z.object({
    page : z.number().int().min(1),
    size : z.number().int().min(1),
  }).optional()
}