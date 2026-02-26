"use client"

import * as React from "react"
import { useSidebarStore } from "./sidebar-data"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useNetworkStatus } from "@/hooks/use-network-status";
import { WifiOff } from "lucide-react";

export function NavSecondary({
  items,
  ...props
}) {
  const setActiveSidebarItem = useSidebarStore(state => state.setActiveSidebarItem);
  const isOnline = useNetworkStatus();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {!isOnline && <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-destructive bg-destructive/6 hover:bg-destructive/6 hover:text-destructive active:text-destructive active:bg-destructive/6" onClick={() => setActiveSidebarItem("offline")} tooltip="You are offline">
              <a>
                <WifiOff />
                <span>You are offline.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>}
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}