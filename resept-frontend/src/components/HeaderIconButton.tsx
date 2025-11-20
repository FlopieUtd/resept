import type { ComponentType, MouseEvent } from "react";
import { Link } from "react-router-dom";

interface HeaderIconButtonProps {
  icon: ComponentType<{ className?: string }>;
  to?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
  iconClassName?: string;
}

const baseClasses =
  "bg-white text-black p-[4px] sm:p-[8px] rounded-lg hover:bg-gray-200 transition-colors";

const baseIconClasses = "w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]";

export const HeaderIconButton = ({
  icon: Icon,
  to,
  onClick,
  className = "",
  iconClassName = "",
}: HeaderIconButtonProps) => {
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={`${baseClasses} ${className}`}>
        <Icon className={`${baseIconClasses} ${iconClassName}`} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${className}`}
    >
      <Icon className={`${baseIconClasses} ${iconClassName}`} />
    </button>
  );
};
