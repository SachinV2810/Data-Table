"use client";
import { Users, UserCheck, UserX, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchResult } from "@/lib/search-engine";

interface StatsCardsProps {
  stats: SearchResult["stats"];
  filteredCount: number;
}

const CARDS = [
  { key: "total" as const,       label: "Total Students", icon: Users,       iconBg: "bg-indigo-100",  iconColor: "text-indigo-600",  valueBg: "text-indigo-700" },
  { key: "active" as const,      label: "Active",         icon: UserCheck,   iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueBg: "text-emerald-700" },
  { key: "inactive" as const,    label: "Inactive",       icon: UserX,       iconBg: "bg-rose-100",    iconColor: "text-rose-600",    valueBg: "text-rose-700" },
  { key: "departments" as const, label: "Departments",    icon: Building2,   iconBg: "bg-violet-100",  iconColor: "text-violet-600",  valueBg: "text-violet-700" },
];

export function StatsCards({ stats, filteredCount }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map(({ key, label, icon: Icon, iconBg, iconColor, valueBg }) => (
        <Card key={key} className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${valueBg}`}>{Number(stats[key]).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
