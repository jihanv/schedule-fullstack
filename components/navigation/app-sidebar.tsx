"use client";

import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
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
import { Link, usePathname } from "@/i18n/navigation";

const platformItems = [
  {
    labelKey: "items.timePeriod",
    icon: CalendarPlus,
    url: "/dashboard/timeperiod/",
  },
  {
    labelKey: "items.attendance",
    icon: ListChecks,
    url: "/dashboard/attendance/",
  },
  {
    labelKey: "items.documentation",
    icon: NotebookPen,
    url: "/dashboard/lessonplan/",
  },
] as const;

export function AppSidebar() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  function normalizePath(path: string) {
    if (path === "/") return "/";
    return path.replace(/\/+$/, ""); // removes trailing slash(es)
  }
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <HeaderAuth />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                <Briefcase className="size-4" />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{t("appName")}</span>
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
          <SidebarGroupLabel>{t("platformLabel")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.labelKey}>
                  <SidebarMenuButton asChild isActive={normalizePath(pathname) === normalizePath(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{t(item.labelKey)}</span>
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