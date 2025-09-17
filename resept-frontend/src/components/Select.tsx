import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      className = "",
      children,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "w-full border border-neutral-400 hover:border-black focus:border-black rounded-[4px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black bg-white h-[39px]";
    const errorClasses = error ? "border-red-500 focus:ring-red-500" : "";
    const combinedClasses =
      `${baseClasses} ${errorClasses} ${className}`.trim();

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (!containerRef.current) return;
        if (containerRef.current.contains(e.target as Node)) return;
        setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
      if (typeof ref === "function") {
        ref(selectRef.current as HTMLSelectElement);
      } else if (
        ref &&
        "current" in (ref as unknown as { current: HTMLSelectElement | null })
      ) {
        (ref as unknown as { current: HTMLSelectElement | null }).current =
          selectRef.current as HTMLSelectElement | null;
      }
    }, [ref]);

    const options = useMemo(() => {
      const result: { label: string; value: string }[] = [];
      const childrenArray = Children.toArray(children);
      childrenArray.forEach((child) => {
        if (!isValidElement(child)) return;
        const props = child.props as {
          value?: string | number;
          children?: React.ReactNode;
        };
        const v = props.value ?? "";
        const l = props.children ?? "";
        result.push({ label: String(l), value: String(v) });
      });
      return result;
    }, [children]);

    const selected = options.find((o) => String(o.value) === String(value));

    const emitChange = (nextValue: string) => {
      if (!onChange) return;
      const event = {
        target: { value: nextValue },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    };

    return (
      <div className="w-full text-[14px]" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1 text-[14px]">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            ref={buttonRef}
            className={combinedClasses}
            onClick={() => !disabled && setOpen((o) => !o)}
            disabled={disabled}
          >
            <span className="truncate text-left inline-block w-full">
              {selected ? selected.label : ""}
            </span>
          </button>
          <select
            ref={selectRef}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="hidden"
            {...props}
          >
            {children}
          </select>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-neutral-300 rounded-[6px] shadow-lg min-w-full w-max max-w-[90vw] overflow-hidden">
              <ul className="max-h-64 overflow-auto outline-none">
                {options.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 whitespace-normal break-words ${
                        String(value) === String(opt.value) ? "bg-gray-50" : ""
                      }`}
                      onClick={() => {
                        emitChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
