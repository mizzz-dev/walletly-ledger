import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses: Record<ButtonVariant, string> = {
      default: "bg-primary text-white hover:opacity-90",
      outline: "border border-border bg-transparent hover:bg-muted",
      ghost: "hover:bg-muted",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
