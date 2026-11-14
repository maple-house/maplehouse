"use client";
import { toast } from "sonner";
import { LogoutAction } from "../actions/login";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const LogoutButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      const { error } = await LogoutAction();

      if (error) {
        toast.error(error, { position: "top-center" });
        setLoading(false);
      } else {
        router.push("/login");
        toast.success("Logged Out", { position: "top-center" });
      }
    } catch (e) {
      toast.error("Something went wrong", { position: "top-center" });
      setLoading(false);
    }
  }

  return (
    <Button className="mt-2" disabled={loading} onClick={() => logout()}>
      Logout {loading ? <Spinner /> : <LogOut />}
    </Button>
  );
};

export default LogoutButton;
