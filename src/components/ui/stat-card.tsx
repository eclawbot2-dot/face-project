import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "gold" | "green" | "purple";
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, color = "blue", subtitle }: StatCardProps) {
  const colors = {
    blue: "bg-blue-50 text-[#1e3a5f]",
    gold: "bg-yellow-50 text-[#c9a227]",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="card flex items-start gap-4">
      <div className={cn("p-3 rounded-xl", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
