import { GetUserRole } from "@/app/actions/auth";
import LogoutButton from "@/app/components/LogoutButton";
import { db } from "@/app/lib/drizzle/config";
import { UserTable } from "@/app/lib/drizzle/schema";
import { wait } from "@/app/utils/miscellaneous/wait";
import { Button } from "@/components/ui/button";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

async function DashboardPage() {
  const { auth, user_id, role } = await GetUserRole();

  if (auth === false) {
    redirect("/login");
  }

  //User
  const user = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.id, user_id));

  return (
    <>
      <p className="font-heading">
        {" "}
        {`Hello ${user[0].first_name} ${user[0].last_name} - ${role}`}
      </p>
      <LogoutButton />
      <Link
        href="/important"
        className="mt-5 text-blue-600 underline cursor-pointer font-heading"
      >
        Important Page
      </Link>
    </>
  );
}

export default DashboardPage;
