import { useEffect, useState } from "react";
import garlicImage from "../assets/garlic.png";

export const Loading = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setVisible(true);
    }, 200);
    return () => {
      clearTimeout(delayTimer);
    };
  }, []);

  return (
    <div
      className="flex w-full h-full justify-center items-center transition-opacity duration-[300ms]"
      style={{ opacity: visible ? 1 : 0 }}
    >
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
