import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  Wrench, 
  BarChart3, 
  Users, 
  Settings,
  MessageSquare,
  ChevronDown,
  TrendingUp,
  LineChart,
  PieChart
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import type { Permission, Role } from "@/types/app/types";

interface MainItem {
  title: string;
  url: string;
  icon: any;
  permission?: Permission;
  roles?: Role[];
}

const mainItems: MainItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", url: "/jobs", icon: Briefcase, permission: "VIEW_JOBS" },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Tools", url: "/tools", icon: Wrench, permission: "VIEW_TOOLS" },
  { title: "Team", url: "/team", icon: Users, permission: "MANAGE_USERS" },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Settings", url: "/settings", icon: Settings, permission: "MANAGE_SETTINGS" },
];

const reportsItems = [
  { title: "Web Analytics", url: "/reports/web-analytics", icon: TrendingUp },
  { title: "KPI Analytics", url: "/reports/kpi-analytics", icon: LineChart },
  { title: "Performance", url: "/reports/performance", icon: PieChart },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { hasPermission, hasAnyRole } = useAuth();
  const [reportsOpen, setReportsOpen] = useState(true);

  const itemBase = cn(
    'flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
    open ? '' : 'justify-center px-2'
  );
  const subItemBase = cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
    open ? '' : 'justify-center px-2'
  );

  const visibleMainItems = mainItems.filter(item => {
    const hasPerm = !item.permission || hasPermission(item.permission);
    const hasRole = !item.roles || item.roles.length === 0 || hasAnyRole(item.roles);
    return hasPerm && hasRole;
  });

  const canViewReports = hasPermission("VIEW_REPORTS");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 uppercase text-xs">
            {open && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={itemBase}
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {canViewReports && (
                <Collapsible open={reportsOpen} onOpenChange={setReportsOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className={itemBase}>
                        <BarChart3 className="h-5 w-5 shrink-0" />
                        {open && (
                          <>
                            <span className="flex-1">Reports</span>
                            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {reportsItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={subItem.url}
                                className={subItemBase}
                                activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                              >
                                <subItem.icon className="h-4 w-4 shrink-0" />
                                {open && <span>{subItem.title}</span>}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
