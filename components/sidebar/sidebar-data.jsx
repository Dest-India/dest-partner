import {
  Gauge,
  MessageSquareShare,
  LandPlot,
  UsersRound,
  GraduationCap,
  ClipboardIcon,
  Home,
  ChevronsRight,
  Settings,
  Dumbbell,
  TicketCheck,
} from "lucide-react"
import React from "react";
import { create } from 'zustand'
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"

const userDetails = () => {
  let user = null;
  if (typeof window !== 'undefined') {
    try {
      user = JSON.parse(localStorage.getItem('userInfo'));
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }
  return user
}

// Get dynamic sidebar sections based on user role
const getSidebarSections = () => {
  const user = userDetails();
  const userRole = (user?.role || 'Academy').toLowerCase();

  const sections = {
    primary: [],
    turf: [],
    navSecondary: [
      {
        id: "settings",
        title: "Settings",
        url: "/home/settings",
        icon: Settings,
      },
      {
        id: "support",
        title: "Support",
        url: "/home/support",
        icon: MessageSquareShare,
      }
    ]
  };

  // Academy role - primary sections only
  if (userRole === 'academy') {
    sections.primary = [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/home/dashboard",
        icon: Gauge,
      },
      {
        id: "coaches",
        title: "Coaches",
        url: "/home/coaches",
        icon: UsersRound,
      },
      {
        id: "courses",
        title: "Courses",
        url: "/home/courses",
        icon: GraduationCap,
      },
      {
        id: "students",
        title: "Students",
        url: "/home/students",
        icon: ClipboardIcon,
      },
    ];
  }
  
  // GYM role - only primary section with gym terminology
  else if (userRole === 'gym') {
    sections.primary = [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/home/dashboard",
        icon: Gauge,
      },
      {
        id: "trainers",
        title: "Trainers",
        url: "/home/trainers",
        icon: UsersRound,
      },
      {
        id: "programs",
        title: "Programs",
        url: "/home/programs",
        icon: Dumbbell,
      },
      {
        id: "members",
        title: "Members",
        url: "/home/members",
        icon: ClipboardIcon,
      },
    ];
  }
  
  // Turf role - only turf section
  else if (userRole === 'turf') {
    sections.turf = [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/home/dashboard",
        icon: Gauge,
      },
      {
        id: "turfs",
        title: "Turfs",
        url: "/home/turfs",
        icon: LandPlot,
      },
      {
        id: "turfs-bookings",
        title: "Turfs Bookings",
        url: "/home/turfs/bookings",
        icon: TicketCheck,
      },
    ];
  }

  return sections;
}

export const useSidebarStore = create((set, get) => ({
  sidebarData: {
    user: {
      id: "user",
      name: userDetails()?.name || "Unknown User",
      public_id: userDetails()?.public_id || "unknown",
      avatar: userDetails()?.logo_image || "",
    },
    ...getSidebarSections()
  },
  // Store custom breadcrumb elements
  customBreadcrumbs: [],

  // Set active sidebar item
  setActiveSidebarItem: (itemId) => 
    set((state) => {
      const sections = ['primary', 'turf', 'navSecondary'];
      const updatedData = { ...state.sidebarData };
      
      sections.forEach(section => {
        updatedData[section] = updatedData[section].map(item => ({
          ...item,
          isActive: item.id === itemId
        }));
      });

      return { 
        sidebarData: updatedData,
        // Clear custom breadcrumbs when changing active item
        customBreadcrumbs: [] 
      };
    }),

  // Get Breadcrumb component with current path
  getBreadcrumb: () => {
    const state = get();
    const sections = ['primary', 'turf', 'navSecondary'];
    let activeItem = null;

    // Find active item
    for (const section of sections) {
      activeItem = state.sidebarData[section]?.find(item => item.isActive);
      if (activeItem) break;
    }

    // Build all breadcrumb items
    const allItems = [
      {
        title: 'Home',
        href: '/home',
        type: 'link'
      },
      ...(activeItem ? [{
        title: activeItem.title,
        href: activeItem.url,
        type: 'link'
      }] : []),
      ...state.customBreadcrumbs
    ];

    return (
      <Breadcrumb>
        <BreadcrumbList className="hidden sm:flex sm:items-center">
          {/* Desktop View */}
            {allItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.type === 'link' ? (
                    <BreadcrumbLink href={item.href}>
                      {item.title}
                    </BreadcrumbLink>
                  ) : (
                    item
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
            </BreadcrumbList>



          {/* Mobile View */}
          <BreadcrumbList className="flex items-center sm:hidden">
            {/* First Item (Home) */}
            <BreadcrumbItem>
              <BreadcrumbLink href="/home"><Home className="size-4.5" /></BreadcrumbLink>
            </BreadcrumbItem>

            {/* Last Item */}
            {allItems.length > 1 && (
              <>
                <ChevronsRight className="size-4 mx-0.5" />
                <BreadcrumbItem>
                  {(() => {
                    const lastItem = allItems[allItems.length - 1];
                    return lastItem.type === 'link' ? (
                      <BreadcrumbLink href={lastItem.href}>
                        {lastItem.title}
                      </BreadcrumbLink>
                    ) : (
                      lastItem
                    );
                  })()}
                </BreadcrumbItem>
              </>
            )}
        </BreadcrumbList>
      </Breadcrumb>
    );
  },

  // Add custom breadcrumb element (accepts JSX)
  addBreadcrumbItem: (element) => 
    set((state) => ({
      customBreadcrumbs: [...state.customBreadcrumbs, element]
    })),

  // Clear custom breadcrumbs
  clearCustomBreadcrumbs: () => 
    set(() => ({
      customBreadcrumbs: []
    })),

  // Update sidebar data dynamically
  updateSectionData: (section, newData) =>
    set((state) => ({
      sidebarData: {
        ...state.sidebarData,
        [section]: newData
      }
    })),

  // Refresh sidebar data based on current user info
  refreshSidebarData: () =>
    set(() => ({
      sidebarData: {
        user: {
          id: "user",
          name: userDetails()?.name || "Unknown User",
          email: userDetails()?.email || "unknown@example.com",
          avatar: userDetails()?.logo_image || "https://ui.shadcn.com/avatars/shadcn.jpg",
        },
        ...getSidebarSections()
      },
      customBreadcrumbs: [] // Clear breadcrumbs when refreshing
    }))
}));
