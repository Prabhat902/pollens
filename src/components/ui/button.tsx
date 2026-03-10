import * as React from "react"
// import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
// Note: I didn't verify if @radix-ui/react-slot is installed, but it's common. 
// If not, I'll just use a standard button for now to avoid extra installs, creating a simple version.

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            {
                "bg-sky-500 text-white shadow hover:bg-sky-600": variant === "default",
                "bg-white/10 text-white border border-white/10 hover:bg-white/20": variant === "secondary",
                "h-9 px-4 py-2": size === "default",
                "h-8 rounded-md px-3 text-xs": size === "sm",
                "h-10 rounded-md px-8": size === "lg",
            },
            className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
