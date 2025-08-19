export const formatTime = (timeString: string) => {
  if (!timeString) return "0 min";

  const match = timeString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)M)?/);
  if (match) {
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");

    if (hours > 0 && minutes > 0) {
      return `${hours} uur ${minutes} min`;
    } else if (hours > 0) {
      return `${hours} uur`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else if (seconds > 0) {
      return `${seconds} sec`;
    }
  }

  if (
    timeString.includes("m") ||
    timeString.includes("h") ||
    timeString.includes("u")
  ) {
    return timeString;
  }

  return "0 min";
};
