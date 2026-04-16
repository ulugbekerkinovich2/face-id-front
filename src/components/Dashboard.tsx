import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, LogIn, LogOut, Activity } from 'lucide-react';

interface Stats {
  totalStudents: number;
  todayEntries: number;
  todayExits: number;
  currentlyInside: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, todayEntries: 0, todayExits: 0, currentlyInside: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [studentsRes, entriesRes, exitsRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('action', 'entry').gte('recorded_at', today),
      supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('action', 'exit').gte('recorded_at', today),
    ]);

    const entries = entriesRes.count ?? 0;
    const exits = exitsRes.count ?? 0;

    setStats({
      totalStudents: studentsRes.count ?? 0,
      todayEntries: entries,
      todayExits: exits,
      currentlyInside: entries - exits,
    });
  };

  const cards = [
    { label: "Jami talabalar", value: stats.totalStudents, icon: Users, color: "text-primary" },
    { label: "Bugun kirish", value: stats.todayEntries, icon: LogIn, color: "text-[hsl(var(--entry))]" },
    { label: "Bugun chiqish", value: stats.todayExits, icon: LogOut, color: "text-[hsl(var(--exit))]" },
    { label: "Hozir ichkarida", value: stats.currentlyInside, icon: Activity, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className="text-3xl font-bold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
