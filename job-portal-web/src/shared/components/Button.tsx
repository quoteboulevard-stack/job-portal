import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; fullWidth?: boolean; ariaLabel?: string };

const variantStyles = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400",
  success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
};
const sizeStyles = { sm: "px-3 py-2 text-sm", md: "px-4 py-2.5 text-base", lg: "px-6 py-3 text-lg" };

export default function Button({ children, variant = "primary", size = "md", loading = false, disabled, fullWidth = false, ariaLabel, className = "", type = "button", ...props }: Props) {
  const computedLabel = ariaLabel || (typeof children === "string" ? children : "button");
  return (
    <button {...props} type={type} aria-label={computedLabel} aria-busy={loading} disabled={disabled || loading} className={`${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,box-shadow,transform] duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none active:scale-95 ${className}`.trim()}>
      {loading ? <><span aria-hidden="true">{"\u2026"}</span><span>Loading{"\u2026"}</span><span className="sr-only">{`${computedLabel} loading`}</span></> : children}
    </button>
  );
}
