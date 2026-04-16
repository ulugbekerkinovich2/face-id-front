import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Login from './Login';
import Dashboard from '@/components/Dashboard';
import StudentList from '@/components/StudentList';
import AttendanceLog from '@/components/AttendanceLog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, LayoutDashboard, Users, ClipboardList } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [dashKey, setDashKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Turniket</h1>
              <p className="text-xs text-muted-foreground">Nazorat tizimi</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Chiqish
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Dashboard key={dashKey} />

        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attendance" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Davomat
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" />
              Talabalar
            </TabsTrigger>
          </TabsList>
          <TabsContent value="attendance">
            <AttendanceLog onRecorded={() => setDashKey(k => k + 1)} />
          </TabsContent>
          <TabsContent value="students">
            <StudentList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
