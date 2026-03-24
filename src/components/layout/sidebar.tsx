"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Cross,
  Calendar,
  Megaphone,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "DIRECTOR", "CATECHIST", "PARENT"] },
  { href: "/students", label: "Students", icon: GraduationCap, roles: ["ADMIN", "DIRECTOR", "CATECHIST"] },
  { href: "/catechists", label: "Catechists", icon: Users, roles: ["ADMIN", "DIRECTOR"] },
  { href: "/classes", label: "Classes", icon: BookOpen, roles: ["ADMIN", "DIRECTOR", "CATECHIST"] },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["ADMIN", "DIRECTOR", "CATECHIST"] },
  { href: "/sacraments", label: "Sacraments", icon: Cross, roles: ["ADMIN", "DIRECTOR", "CATECHIST"] },
  { href: "/calendar", label: "Calendar", icon: Calendar, roles: ["ADMIN", "DIRECTOR", "CATECHIST", "PARENT"] },
  { href: "/announcements", label: "Announcements", icon: Megaphone, roles: ["ADMIN", "DIRECTOR", "CATECHIST", "PARENT"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "DIRECTOR"] },
  { href: "/admin", label: "Admin Panel", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const role = (session?.user as { role?: string })?.role ?? "PARENT";

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div
      className={cn(
        "flex flex-col bg-[#1e3a5f] text-white transition-all duration-300 min-h-screen",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center px-4 py-5 border-b border-white/10", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">HF</span>
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm leading-tight">Holy Face</div>
            <div className="text-xs text-blue-200 leading-tight">Faith Formation</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-[#c9a227] text-white font-medium"
                  : "text-blue-100 hover:bg-white/10",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-white/10 hover:bg-white/10 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}
