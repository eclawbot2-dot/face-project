"use client";

import { useSession, signOut } from "next-auth/react";
import { roleLabel } from "@/lib/utils";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = (session?.user as { role?: string })?.role ?? "PARENT";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        {title && <h1 className="text-xl font-bold text-[#1e3a5f]">{title}</h1>}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-[#1e3a5f] rounded-lg hover:bg-gray-100">
          <Bell className="w-5 h-5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-gray-800">{session?.user?.name}</div>
              <div className="text-xs text-gray-500">{roleLabel(role)}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-medium">{session?.user?.name}</div>
                <div className="text-xs text-gray-500">{session?.user?.email}</div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
