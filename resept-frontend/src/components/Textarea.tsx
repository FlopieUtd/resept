import { forwardRef, useImperativeHandle, useRef } from "react";
import { useAutoGrowTextarea } from "../hooks/useAutoGrowTextarea";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const autoGrowRef = useAutoGrowTextarea();
    const internalRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => autoGrowRef.current || internalRef.current!);

    const baseClasses =
      "w-full border border-neutral-400 focus:border-black rounded-[4px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black bg-white resize-none overflow-hidden";
    const errorClasses = error ? "border-red-500 focus:ring-red-500" : "";
    const combinedClasses =
      `${baseClasses} ${errorClasses} ${className}`.trim();

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea ref={autoGrowRef} className={combinedClasses} {...props} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
