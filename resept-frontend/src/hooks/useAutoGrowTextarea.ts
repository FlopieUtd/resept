import { useRef, useEffect } from "react";

export const useAutoGrowTextarea = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    adjustHeight();

    textarea.addEventListener("input", adjustHeight);
    textarea.addEventListener("paste", adjustHeight);

    return () => {
      textarea.removeEventListener("input", adjustHeight);
      textarea.removeEventListener("paste", adjustHeight);
    };
  }, []);

  return textareaRef;
};
