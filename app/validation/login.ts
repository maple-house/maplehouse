import z from "zod";

const LoginEmailValidationSchema = z.object({
    email : z.email({error : "Invalid Email"})
})

type TypeLoginEmailValidationSchema = z.infer<typeof LoginEmailValidationSchema>;


const LoginOTPValidationSchema = z.object({
    otp : z.string().length(6,{error : "Invalid OTP"}).regex(/^\d+$/,{error : "Invalid OTP"}),
})

type TypeLoginOTPValidationSchema = z.infer<typeof LoginOTPValidationSchema>;

export {LoginEmailValidationSchema, LoginOTPValidationSchema}

export type {TypeLoginEmailValidationSchema, TypeLoginOTPValidationSchema}