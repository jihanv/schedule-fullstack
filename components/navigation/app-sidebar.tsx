"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import HeaderAuth from "./header-auth";
import LanguageInput from "../language/language-input";
import { Briefcase, CalendarPlus, ListChecks, NotebookPen } from "lucide-react";
import { Link } from "@/i18n/navigation";
const platformItems = [
  {
    title: "Time Period",
    icon: CalendarPlus,
    url: "/dashboard/timeperiod/",
    active: true,
  },
  { title: "Attendance", icon: ListChecks, url: "#" },
  { title: "Documentation", icon: NotebookPen, url: "#" },
];
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      {/* Top (company/workspace) */}
      <SidebarHeader>
        <HeaderAuth />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                <Briefcase className="size-4" />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Class Planner</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="group-data-[collapsible=icon]:hidden">
          <LanguageInput />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.active}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
