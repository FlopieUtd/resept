export const isDurationEmpty = (
  duration: string | null | undefined
): boolean => {
  if (!duration) return true;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return true;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours === 0 && minutes === 0 && seconds === 0;
};
