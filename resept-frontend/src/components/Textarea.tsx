import { forwardRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const baseClasses =
      "w-full border border-black rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black bg-white resize-vertical";
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
        <textarea ref={ref} className={combinedClasses} {...props} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
