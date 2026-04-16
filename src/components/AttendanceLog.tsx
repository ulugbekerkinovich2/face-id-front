import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogIn, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LogEntry {
  id: string;
  student_id: string;
  action: 'entry' | 'exit';
  recorded_at: string;
  students: { full_name: string; student_id: string } | null;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
}

const AttendanceLog = ({ onRecorded }: { onRecorded?: () => void }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchStudents();
  }, []);

  const fetchLogs = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('attendance_logs')
      .select('*, students(full_name, student_id)')
      .gte('recorded_at', today)
      .order('recorded_at', { ascending: false })
      .limit(50);
    if (data) setLogs(data as unknown as LogEntry[]);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('id, full_name, student_id').eq('is_active', true).order('full_name');
    if (data) setStudents(data);
  };

  const recordAction = async (action: 'entry' | 'exit') => {
    if (!selectedStudent) {
      toast({ title: "Talabani tanlang", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('attendance_logs').insert({
      student_id: selectedStudent,
      action,
    });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === 'entry' ? "Kirish qayd etildi" : "Chiqish qayd etildi" });
      setSelectedStudent('');
      fetchLogs();
      onRecorded?.();
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Kirish/Chiqish qayd etish</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Talabani tanlang..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name} ({s.student_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={() => recordAction('entry')} className="bg-[hsl(var(--entry))] hover:bg-[hsl(var(--entry))]/90">
              <LogIn className="w-4 h-4 mr-2" />
              Kirish
            </Button>
            <Button onClick={() => recordAction('exit')} variant="destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Chiqish
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Talaba</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Harakat</TableHead>
              <TableHead>Vaqt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.students?.full_name ?? '—'}</TableCell>
                <TableCell className="font-mono text-sm">{log.students?.student_id ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={log.action === 'entry' ? 'default' : 'destructive'}>
                    {log.action === 'entry' ? 'Kirish' : 'Chiqish'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(log.recorded_at).toLocaleTimeString('uz-UZ')}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Bugun hech qanday yozuv yo'q
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendanceLog;
