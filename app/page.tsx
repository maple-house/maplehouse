import Link from "next/link";
import Logo from "./components/Logo";

export default function Home() {
  return (
    <div className="w-screen h-screen bg-main flex items-center justify-center flex-col">
      <Logo classname="w-50 h-auto" />
      <p className="text-accent font-bold text-3xl font-aelo mt-5 tracking-widest">
        MAPLE HOUSE
      </p>
      <p className="text-lg tracking-widest text-accent font-aelo">
        Interior and Decor Studio
      </p>
      <p className="tracking-widest text-accent font-aelo mt-5">
        Site under development. Proceed to{" "}
        <Link href="/login" className="underline">
          Login
        </Link>
        .
      </p>
    </div>
  );
}
