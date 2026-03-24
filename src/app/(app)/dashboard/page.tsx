"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { GraduationCap, Users, BookOpen, BarChart3, Calendar, Megaphone } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface DashboardData {
  stats: { students: number; catechists: number; classes: number; attendanceRate: number };
  upcomingEvents: Array<{ id: string; title: string; startDate: string; eventType: string; location?: string }>;
  recentAnnouncements: Array<{ id: string; title: string; body: string; createdAt: string; author: { name: string } }>;
}

const eventTypeColors: Record<string, string> = {
  SACRAMENT: "badge-gold",
  RETREAT: "badge-blue",
  SERVICE: "badge-green",
  PARISH: "badge-blue",
  OTHER: "badge-gray",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4f7c] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#c9a227] flex items-center justify-center">
            <span className="text-white font-bold">HF</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {greeting()}, {session?.user?.name?.split(" ")[0]}!
            </h2>
            <p className="text-blue-200 text-sm">Holy Face Church Faith Formation · Great Mills, MD</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Students" value={data?.stats.students ?? 0} icon={GraduationCap} color="blue" />
          <StatCard title="Catechists" value={data?.stats.catechists ?? 0} icon={Users} color="gold" />
          <StatCard title="Classes" value={data?.stats.classes ?? 0} icon={BookOpen} color="green" />
          <StatCard title="Attendance Rate" value={`${data?.stats.attendanceRate ?? 0}%`} icon={BarChart3} color="purple" subtitle="Last 30 sessions" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1e3a5f] flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Upcoming Events
            </h3>
            <Link href="/calendar" className="text-sm text-[#1e3a5f] hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : data?.upcomingEvents.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {data?.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                  <div className="text-center min-w-[40px]">
                    <div className="text-xs text-gray-400 uppercase">
                      {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div className="text-lg font-bold text-[#1e3a5f] leading-none">
                      {new Date(event.startDate).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm truncate">{event.title}</div>
                    {event.location && <div className="text-xs text-gray-500 truncate">{event.location}</div>}
                  </div>
                  <span className={`${eventTypeColors[event.eventType] ?? "badge-gray"} badge flex-shrink-0`}>
                    {event.eventType.charAt(0) + event.eventType.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1e3a5f] flex items-center gap-2">
              <Megaphone className="w-5 h-5" /> Recent Announcements
            </h3>
            <Link href="/announcements" className="text-sm text-[#1e3a5f] hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : data?.recentAnnouncements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {data?.recentAnnouncements.map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-gray-50">
                  <div className="font-medium text-gray-800 text-sm">{a.title}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{a.body}</div>
                  <div className="text-xs text-gray-400 mt-1">By {a.author.name} · {formatDate(a.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card">
        <h3 className="font-bold text-[#1e3a5f] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/students", label: "Add Student", icon: GraduationCap, color: "bg-blue-50 text-[#1e3a5f]" },
            { href: "/attendance", label: "Take Attendance", icon: BarChart3, color: "bg-green-50 text-green-700" },
            { href: "/classes", label: "Manage Classes", icon: BookOpen, color: "bg-yellow-50 text-[#c9a227]" },
            { href: "/announcements", label: "Send Announcement", icon: Megaphone, color: "bg-purple-50 text-purple-700" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
