"use client"

import { useEffect } from "react"
import {
  EllipsisVertical,
  LogOut,
  UserRound,
  Wallet,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function NavUser({
  user,
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-2xl group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:cursor-pointer"
              tooltip={user.name + " | " + user.email}
            >
              <Avatar className="h-8 w-8 rounded-lg -ml-0.5 group-data-[collapsible=icon]:m-0 shadow">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{user.name.split(" ").map(name => name[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.public_id}
                </span>
              </div>
              <EllipsisVertical className="ml-auto mr-0.5 size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/home/settings/profile")}>
                <UserRound />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/home/settings/subscription")}>
                <Wallet />
                Subscription
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => {
              localStorage.removeItem("userInfo")
              toast.success("Logged out successfully")
              window.location.href = "/login"
            }}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}