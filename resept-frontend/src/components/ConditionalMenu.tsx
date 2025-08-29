import { Menu } from "./Menu";
import { useFullscreen } from "../contexts/FullscreenContext";

export const ConditionalMenu = () => {
  const { isFullscreen } = useFullscreen();

  if (isFullscreen) {
    return null;
  }

  return <Menu />;
};
