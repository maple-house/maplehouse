"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: Props) => {
  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col bg-brown text-white">
      <p className="text-3xl font-bold font-serif tracking-wider">
        Error Encountered !
      </p>
      <p>{error.message}</p>
    </div>
  );
};

export default GlobalError;
