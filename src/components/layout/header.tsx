"use client";

import { useSession, signOut } from "next-auth/react";
import { roleLabel } from "@/lib/utils";
import { Bell, LogOut, User, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

export function Header({
  title,
  onMenuToggle,
}: {
  title?: string;
  onMenuToggle?: () => void;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = (session?.user as { role?: string })?.role ?? "PARENT";

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-[#1e3a5f] rounded-lg hover:bg-gray-100 flex-shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile branding */}
        <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#c9a227] flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">HF</span>
          </div>
          <span className="font-bold text-sm text-[#1e3a5f]">Holy Face</span>
        </div>

        {title && (
          <h1 className="text-lg sm:text-xl font-bold text-[#1e3a5f] hidden lg:block truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <button className="relative p-2 text-gray-500 hover:text-[#1e3a5f] rounded-lg hover:bg-gray-100">
          <Bell className="w-5 h-5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-gray-800">
                {session?.user?.name}
              </div>
              <div className="text-xs text-gray-500">{roleLabel(role)}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>
          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium">
                    {session?.user?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session?.user?.email}
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
