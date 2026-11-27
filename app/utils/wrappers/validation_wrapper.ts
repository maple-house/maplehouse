import z from "zod";
import { AppError } from "../error/AppError";


export function validation_wrapper<Schema extends z.ZodObject,
  FormType extends z.infer<Schema>,>(schema : Schema, form_state : FormType)  {

    const {success,data} = schema.safeParse(form_state);

    if(!success) {
        throw new AppError("Invalid Request", true);
    }

    return data
}