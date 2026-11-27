"use client";

import Logo from "./components/Logo";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: Props) => {
  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col bg-main">
      <Logo classname="w-50 h-auto" />
      <p className="text-accent font-bold text-3xl font-aelo mt-5 tracking-widest">
        MAPLE HOUSE
      </p>
      <p className="text-lg tracking-widest text-accent font-aelo">
        Interior and Decor Studio
      </p>
      <p className="text-xl font-bold tracking-wider text-accent mt-10">
        Error Encountered !
      </p>
      <p className="tracking-wider font-medium text-accent">{error.message}</p>
      <button
        onClick={() => reset()}
        className="underline bg-main text-accent mt-5 cursor-pointer"
      >
        Reload
      </button>
    </div>
  );
};

export default GlobalError;
