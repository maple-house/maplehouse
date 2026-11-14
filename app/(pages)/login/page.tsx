import { getSessionCookie } from "@/app/lib/auth/cookies";
import EmailLoginForm from "./EmailLoginForm";
import OTPLoginForm from "./OTPLoginForm";
import { readSessionByToken } from "@/app/lib/auth/session";
import LoggedIn from "./LoggedIn";
import { getOTPState } from "@/app/lib/auth/otp";
import { db } from "@/app/lib/drizzle/config";
import { UserTable } from "@/app/lib/drizzle/schema";
import { eq } from "drizzle-orm";

async function LoginPage() {
  async function getPageState() {
    //Get Session Token
    const session_token = await getSessionCookie(); // Get cookies

    if (session_token === null) {
      return <EmailLoginForm />;
    }

    //Read Session from the session store
    const session_info = await readSessionByToken(session_token); //Get session info from cookies

    if (session_info === null) {
      return <EmailLoginForm />;
    }

    if (session_info.auth_state === "complete") {
      return <LoggedIn />;
    }

    if (session_info.auth_state === "otp") {
      const user = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, session_info.user_id));

      const otp_data = await getOTPState(user[0].email);

      return <OTPLoginForm {...otp_data} />;
    }

    return <EmailLoginForm />;
  }

  return (
    <div className="w-screen h-screen flex">
      <div className="w-1/2 bg-brown text-white flex items-center justify-center flex-col">
        <p className="text-4xl font-bold font-serif tracking-wide">
          Maple House
        </p>
        <p className="text-lg font-light tracking-widest">
          Interior and Decor Studio
        </p>
      </div>
      <div className="w-1/2 bg-white flex items-center justify-center">
        {getPageState()}
      </div>
    </div>
  );
}

export default LoginPage;
