import garlicImage from "../assets/garlic.png";

export const Loading = () => {
  return (
    <div className="flex w-full h-full justify-center items-center">
      <img
        src={garlicImage}
        alt="Loading..."
        className="w-16"
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
