import LogoutButton from "@/app/components/LogoutButton";
import { getSessionCookie } from "@/app/lib/auth/cookies";
import { readSessionByToken } from "@/app/lib/auth/session";
import { db } from "@/app/lib/drizzle/config";
import { UserTable } from "@/app/lib/drizzle/schema";
import { eq } from "drizzle-orm";

async function DashboardPage() {
  //Session Token
  const session_token = await getSessionCookie(); // Get cookies

  if (session_token === null) {
    throw new Error("Please login");
  }

  //Read Session from the session store
  const session_info = await readSessionByToken(session_token); //Get session info from cookies

  if (session_info === null) {
    throw new Error("Please login");
  }

  //User
  const user = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.id, session_info.user_id));

  return (
    <div className="flex items-center justify-center w-screen h-screen flex-col">
      <p>
        {" "}
        {`Hello ${user[0].first_name} ${user[0].last_name} - ${session_info.user_type}`}
      </p>
      <LogoutButton />
    </div>
  );
}

export default DashboardPage;
