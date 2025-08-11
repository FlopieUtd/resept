import lemonImage from "../assets/lemon.png";

export const Loading = () => {
  return (
    <div className="flex w-full h-full justify-center items-center">
      <img
        src={lemonImage}
        alt="Loading..."
        className="w-16 h-16"
        style={{
          animation: "spin 4s steps(12) infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
