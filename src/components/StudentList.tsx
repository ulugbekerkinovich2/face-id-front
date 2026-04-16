import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trash2 } from 'lucide-react';
import AddStudentDialog from './AddStudentDialog';
import { toast } from '@/hooks/use-toast';

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  group_name: string | null;
  phone: string | null;
  is_active: boolean;
}

const StudentList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('full_name');
    if (data) setStudents(data);
  };

  const deleteStudent = async (id: string) => {
    await supabase.from('students').delete().eq('id', id);
    toast({ title: "Talaba o'chirildi" });
    fetchStudents();
  };

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Talaba qo'shish
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ism</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Guruh</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.full_name}</TableCell>
                <TableCell className="font-mono text-sm">{s.student_id}</TableCell>
                <TableCell>{s.group_name || '—'}</TableCell>
                <TableCell>{s.phone || '—'}</TableCell>
                <TableCell>
                  <Badge variant={s.is_active ? 'default' : 'secondary'}>
                    {s.is_active ? 'Faol' : 'Nofaol'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteStudent(s.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Talabalar topilmadi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddStudentDialog open={showAdd} onOpenChange={setShowAdd} onAdded={fetchStudents} />
    </div>
  );
};

export default StudentList;
