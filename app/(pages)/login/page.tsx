import { getSessionCookie } from "@/app/lib/auth/cookies";
import EmailLoginForm from "./EmailLoginForm";
import OTPLoginForm from "./OTPLoginForm";
import { readSessionByToken } from "@/app/lib/auth/session";
import { getOTPState } from "@/app/lib/auth/otp";
import { db } from "@/app/lib/drizzle/config";
import { UserTable } from "@/app/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import Logo from "@/app/components/Logo";
import { redirect } from "next/navigation";

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
      redirect("/dashboard");
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
      <div className="w-1/2 bg-main text-white flex items-center justify-center flex-col">
        <Logo classname="w-50 h-auto" />
        <p className="text-accent font-bold text-3xl font-aelo mt-5 tracking-widest">
          MAPLE HOUSE
        </p>
        <p className="text-lg tracking-widest text-accent font-aelo">
          Interior and Decor Studio
        </p>
      </div>
      <div className="w-1/2 bg-white flex items-center justify-center font-sans">
        {getPageState()}
      </div>
    </div>
  );
}

export default LoginPage;
