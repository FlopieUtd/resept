import { Link } from "react-router-dom";

export const Home = () => {
  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] mx-[24px] my-[48px] flex-col font-bold text-[4vw]">
        Geen reclames.
        <br />
        Geen levensverhalen.
        <br />
        <Link to="/recipes" className="underline">
          {" "}
          Alleen resepten.
        </Link>
      </div>
    </div>
  );
};
