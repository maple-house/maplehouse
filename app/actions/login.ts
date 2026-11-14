"use server";
import { eq } from "drizzle-orm";
import { db } from "../lib/drizzle/config";
import { UserTable } from "../lib/drizzle/schema";
import { validation_wrapper } from "../utils/wrappers/validation_wrapper";
import {
  LoginEmailValidationSchema,
  LoginOTPValidationSchema,
  TypeLoginEmailValidationSchema,
  TypeLoginOTPValidationSchema,
} from "../validation/login";
import { AppError } from "../utils/error/AppError";
import logger from "../lib/logger/config";
import { deleteSessionCookie, getSessionCookie, setSessionCookie } from "../lib/auth/cookies";
import {
  createSession,
  invalidateSession,
  readSessionByToken,
  updateSession,
} from "../lib/auth/session";
import { createOTP, verifyOTP } from "../lib/auth/otp";
import { revalidatePath } from "next/cache";

export async function LoginEmailAction(
  formState: TypeLoginEmailValidationSchema,
) {
  try {
    //Validate Session //

    const session_token = await getSessionCookie(); // Get cookies

    //If session exists
    if (session_token !== null) {
      const session_info = await readSessionByToken(session_token); //Get session info from cookies

      //Check if the user is already logged in
      if (session_info !== null && session_info.auth_state === "complete") {
        throw new AppError("User already logged in", true);
      }
    }

    // Validate form data and get cleaned email //
    const { email } = validation_wrapper(LoginEmailValidationSchema, formState);

    // Login Logic //

    //Get user from db
    const user = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));

    //User doesn't exist
    if (user.length === 0) {
      throw new AppError("User not found", true);
    }

    //User is archived
    if (user[0].archived === true) {
      throw new AppError("User not found", true);
    }

    //More than 1 user exists for same email
    if (user.length >= 2) {
      throw new AppError(`User email conflict : ${email}`, false);
    }

    //Generate OTP
    const { otp } = await createOTP(user[0].email);

    console.log(otp);

    //Create Partial Session
    const { token } = await createSession({
      user_id: user[0].id,
      user_type: user[0].role,
      auth_state: "otp",
      expiry_time: 12 * 60 * 60 * 1000, //12 Hours
    });

    //Send Cookie
    await setSessionCookie(
      token,
      new Date(new Date().getTime() + 12 * 60 * 60 * 1000),
    );

    //User has cleared this stage
    return {
      message: "Success",
    };
  } catch (error: any) {
    if (
      typeof error.isOperational === "undefined" ||
      error.isOperational === false
    ) {
      logger.error(`LoginEmailAction : ${error.message}`);
      return { error: "Server Error" };
    } else {
      return {
        error: error.message ? (error.message as string) : "Server Error",
      };
    }
  }
}

export async function LoginOTPAction(formState: TypeLoginOTPValidationSchema) {
  try {
    //Validate Session //

    const session_token = await getSessionCookie(); // Get cookies


    if (session_token === null) {
      throw new AppError("Enter email first", true);
    }

    const session_info = await readSessionByToken(session_token);

    if (session_info === null) {
      throw new AppError("Enter email first", true);
    }

    if (session_info.auth_state === "complete") {
      throw new AppError("User already logged in", true);
    }

    //Validation
    const { otp } = validation_wrapper(LoginOTPValidationSchema, formState);

    const user = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, session_info.user_id));

    if (user.length === 0) {
      throw new AppError("User not found", true);
    }

    //More than 1 user exists for same id
    if (user.length >= 2) {
      throw new AppError(`User id conflict : ${session_info.user_id}`, false);
    }

    await verifyOTP(otp, user[0].email);

    await updateSession(session_token, {
      auth_state: "complete",
    });

    return {
      message: "Success",
    };
  } catch (error: any) {
    if (
      typeof error.isOperational === "undefined" ||
      error.isOperational === false
    ) {
      logger.error(`LoginOTPAction : ${error.message}`);
      return { error: "Server Error" };
    } else {
      return {
        error: error.message ? (error.message as string) : "Server Error",
      };
    }
  }finally {
    revalidatePath("/login")
  }
}

export async  function LoginResendOTPAction() {
  try {
    
    const session_token = await getSessionCookie(); // Get cookies


    if (session_token === null) {
      throw new AppError("Enter email first", true);
    }

    const session_info = await readSessionByToken(session_token);

    if (session_info === null) {
      throw new AppError("Enter email first", true);
    }

    if (session_info.auth_state === "complete") {
      throw new AppError("User already logged in", true);
    }

    if (session_info.auth_state !== "otp") {
      throw new AppError("Enter email first", true);
    }

     const user = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, session_info.user_id));

    if (user.length === 0) {
      throw new AppError("User not found", true);
    }

    //More than 1 user exists for same id
    if (user.length >= 2) {
      throw new AppError(`User id conflict : ${session_info.user_id}`, false);
    }

    //Send OTP
    //Generate OTP
    const {otp} = await createOTP(user[0].email);

    console.log(otp);

    return {
      message : "Success"
    }


  } catch (error : any) {
    if (
      typeof error.isOperational === "undefined" ||
      error.isOperational === false
    ) {
      logger.error(`LoginResendOTPAction : ${error.message}`);
      return { error: "Server Error" };
    } else {
      return {
        error: error.message ? (error.message as string) : "Server Error",
      };
    }
  }finally {
    revalidatePath("/login")
  }
}



export async function LogoutAction() {
  try {
    
    const session_token = await getSessionCookie(); // Get cookies


    if (session_token === null) {
      throw new AppError("Login first", true);
    }

    const session_info = await readSessionByToken(session_token);

    if (session_info === null) {
      throw new AppError("Login first", true);
    }

    if (session_info.auth_state === "otp") {
      throw new AppError("Login first", true);
    }

    await invalidateSession(session_token); 

    await deleteSessionCookie();

    return {
      message : "Success"
    }


  } catch (error : any) {
    if (
      typeof error.isOperational === "undefined" ||
      error.isOperational === false
    ) {
      logger.error(`LogoutAction : ${error.message}`);
      return { error: "Server Error" };
    } else {
      return {
        error: error.message ? (error.message as string) : "Server Error",
      };
    }
  }
}