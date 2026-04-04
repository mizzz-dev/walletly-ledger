import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary",
      className,
    )}
    {...props}
  />
);
