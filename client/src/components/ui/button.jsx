import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-violet-400",
  {
    variants: {
      variant: {
        default: "bg-violet-600 text-white hover:bg-violet-700 shadow-sm hover:shadow-md dark:bg-violet-600 dark:text-white dark:hover:bg-violet-700",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md dark:bg-red-600 dark:text-white dark:hover:bg-red-700",
        outline:
          "border border-gray-200 bg-white hover:bg-gray-50 hover:border-violet-200 hover:text-violet-700 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-violet-400 dark:hover:border-violet-800",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
        ghost: "hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-gray-800 dark:hover:text-violet-400",
        link: "text-violet-600 underline-offset-4 hover:underline dark:text-violet-400",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md dark:bg-green-600 dark:text-white dark:hover:bg-green-700",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }