"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebarStore } from "@/components/sidebar/sidebar-data"
import Notifications from "./ui/notifications"

export function SiteHeader() {
  const { getBreadcrumb } = useSidebarStore();
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-3 px-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger />
          </TooltipTrigger>
          <TooltipContent side="right">
            Toggle sidebar
          </TooltipContent>
        </Tooltip>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-5"
        />
        <div className="flex-1 ml-1">
          {getBreadcrumb()}
        </div>
      </div>
      {/* <div className="mx-4">
      </div> */}
    </header>
  )
}