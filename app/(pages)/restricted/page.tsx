"use client";
import Logo from "@/app/components/Logo";
import { useRouter } from "next/navigation";

const RestrictedPage = () => {
  const router = useRouter();

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col bg-main">
      <Logo classname="w-50 h-auto" />
      <p className="text-accent font-bold text-3xl font-aelo mt-5 tracking-widest">
        MAPLE HOUSE
      </p>
      <p className="text-lg tracking-widest text-accent font-aelo">
        Interior and Decor Studio
      </p>
      <p className="mt-10 font-medium text-accent text-xl tracking-wide">
        403 Access Denied !
      </p>
      <p className="font-medium text-accent tracking-wide">
        Your are not allowed to view this page.
      </p>
      <button
        onClick={() => router.back()}
        className="underline bg-main text-accent mt-5 cursor-pointer"
      >
        Go Back
      </button>
    </div>
  );
};

export default RestrictedPage;
