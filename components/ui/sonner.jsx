"use client"

import { BellDotIcon, CheckIcon, CircleXIcon, OctagonAlertIcon } from "lucide-react";
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import { Loader } from "./loader";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)"
        }
      }
      position="bottom-right"
      richColors
      gap={12}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: "!h-fit !p-4.5 !py-3 !flex !items-start !gap-2 !rounded-xl !shadow-md",
          title: "!text-sm !font-medium",
          description: "!text-sm !opacity-70 !font-normal",
          icon: "!static !block !size-fit [&>svg]:!size-4.5 !shrink-0",
          default: "!border-border",
          success: "!border-green-200 !text-green-600 dark:!border-green-950",
          error: "!border-red-200 !text-red-600 dark:!border-red-950",
          info: "!border-blue-200 !text-blue-600 dark:!border-blue-950",
          warning: "!border-yellow-200 !text-yellow-600 dark:!border-yellow-950",
          loader: "!static translate-2.5 [&>svg]:!size-4.5"
        }
      }}
      icons={{
        success: <CheckIcon />,
        error: <CircleXIcon />,
        info: <BellDotIcon />,
        warning: <OctagonAlertIcon />,
        loading: <Loader />
      }}
      {...props} />
  );
}

export { Toaster }
