import Logo from "./components/Logo";

const GlobalLoading = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col bg-main">
      <Logo classname="w-50 h-auto" />
      <p className="text-accent font-bold text-3xl font-aelo mt-5 tracking-widest">
        MAPLE HOUSE
      </p>
      <p className="text-lg tracking-widest text-accent font-aelo">
        Interior and Decor Studio
      </p>
      <>
        <style>{`
        @keyframes loader-wobble {
          0%, 100% { transform: translateX(-90%); }
          50%      { transform: translateX(90%); }
        }
      `}</style>

        <div
          role="progressbar"
          aria-label="Loading"
          aria-busy="true"
          className="
          relative flex items-center justify-center overflow-hidden select-none
          h-[1em] w-[7.3em] text-[4em]
          [filter:drop-shadow(0_0_0.05em_#ffffff40)]
        "
        >
          {/* line */}
          <div
            className="
            relative flex items-center justify-center overflow-hidden
            h-[0.05em] w-[2em] mt-2 rounded-[0.05em]
 
            before:content-[''] before:absolute before:h-full before:w-full
            before:bg-accent before:opacity-30
 
            after:content-[''] after:absolute after:h-full after:w-full
            after:bg-accent after:rounded-[0.05em]
            after:animate-[loader-wobble_2s_cubic-bezier(0.5,0.8,0.5,0.2)_infinite]
          "
          />
        </div>
      </>
    </div>
  );
};

export default GlobalLoading;
