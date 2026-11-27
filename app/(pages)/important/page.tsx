import { GetUserRole } from "@/app/actions/auth";
import { redirect } from "next/navigation";

async function ImportantPage() {
  const { auth, role, user_id } = await GetUserRole();

  if (!auth) {
    redirect("/login");
  }

  if (role !== "admin") {
    redirect("/restricted");
  }

  return <div>Can only be accessed by admins</div>;
}

export default ImportantPage;
