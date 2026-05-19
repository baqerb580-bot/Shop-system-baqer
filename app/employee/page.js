'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast, Toaster } from 'sonner';
import {
  User, Lock, LogIn, LogOut, Activity, Calendar, Clock,
  CheckCircle2, AlertCircle, Sparkles, BarChart3, X, Bell
} from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const api = async (path, opts = {}) => {
  const r = await fetch(`/api/${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  return r.json();
};

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    const r = await api('employees/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setLoading(false);
    if (r.error) { toast.error(r.error); return; }
    localStorage.setItem('emp_session', JSON.stringify({ employee: r.employee, token: r.token }));
    toast.success('✅ تم الدخول');
    onLogin(r.employee);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-pattern p-4">
      <Card className="glass-strong border-gold/40 w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gold-gradient flex items-center justify-center text-3xl font-black animate-pulse-glow mb-3">غ</div>
          <CardTitle className="gold-text text-2xl">لوحة الموظف</CardTitle>
          <p className="text-xs text-muted-foreground">مركز الغزلان - HR Portal</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div>
            <Label className="text-xs">اسم المستخدم</Label>
            <div className="relative mt-1">
              <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gold" />
              <Input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="username" className="pr-10 bg-input/30 border-gold/20 font-mono" dir="ltr" />
            </div>
          </div>
          <div>
            <Label className="text-xs">كلمة المرور</Label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gold" />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="password" className="pr-10 bg-input/30 border-gold/20 font-mono" dir="ltr" />
            </div>
          </div>
          <Button onClick={submit} disabled={loading} className="btn-gold w-full h-12">
            {loading ? 'جاري الدخول...' : <><LogIn className="w-4 h-4 ml-2" /> دخول</>}
          </Button>
          <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs space-y-1">
            <p className="text-cyan-400 font-bold">📌 حسابات تجريبية:</p>
            <p className="font-mono text-[10px]">emp1 / pass123 → مدير عام</p>
            <p className="font-mono text-[10px]">emp2 / pass123 → فني صيانة</p>
          </div>
          <a href="/" className="block text-center text-xs text-muted-foreground hover:text-gold underline">العودة للنظام الرئيسي</a>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeDashboard({ employee, onLogout }) {
  const [tab, setTab] = useState('home');
  const [todayAtt, setTodayAtt] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [payroll, setPayroll] = useState(null);

  const loadAll = async () => {
    const [att, ts, pr] = await Promise.all([
      api('attendance/today').then(r => Array.isArray(r) ? r.find(x => x.employeeId === employee.id) : null),
      api(`employees/${employee.id}/tasks`),
      api(`employees/${employee.id}/payroll?month=${new Date().toISOString().slice(0, 7)}`),
    ]);
    setTodayAtt(att); setTasks(ts); setPayroll(pr);
  };
  useEffect(() => { loadAll(); const i = setInterval(loadAll, 30000); return () => clearInterval(i); }, []);

  const punchIn = async () => {
    const r = await api('attendance/checkin', { method: 'POST', body: JSON.stringify({ employeeId: employee.id }) });
    if (r.error) toast.error(r.error); else { toast.success(r.record?.isLate ? `⏰ حضور متأخر بـ ${r.record.lateMinutes} دقيقة` : '✅ تم تسجيل الحضور'); loadAll(); }
  };
  const punchOut = async () => {
    const r = await api('attendance/checkout', { method: 'POST', body: JSON.stringify({ employeeId: employee.id }) });
    if (r.error) toast.error(r.error); else { toast.success(`✅ تم الانصراف - عملت ${r.hoursWorked} ساعة`); loadAll(); }
  };

  const updateTask = async (taskId, updates) => {
    const r = await api(`tasks/${taskId}/update`, { method: 'POST', body: JSON.stringify(updates) });
    if (r.error) toast.error(r.error); else { toast.success('✅ تم التحديث'); loadAll(); }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const requireAttendance = !todayAtt;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="glass-strong border-b border-gold-soft px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-xl">{employee.photo || '👤'}</div>
          <div>
            <p className="text-sm font-bold gold-text">{employee.name}</p>
            <p className="text-[10px] text-muted-foreground">{employee.employeeId} · {employee.role}</p>
          </div>
        </div>
        <Button onClick={onLogout} variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
          <LogOut className="w-3 h-3 ml-1" /> خروج
        </Button>
      </header>

      {/* Punch In/Out Banner */}
      {requireAttendance ? (
        <div className="bg-amber-500/10 border-y border-amber-500/30 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-amber-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> يجب تسجيل الحضور قبل البدء بالعمل</p>
          <Button onClick={punchIn} className="btn-gold"><Activity className="w-4 h-4 ml-1 animate-pulse" /> بصمة حضور</Button>
        </div>
      ) : todayAtt && !todayAtt.checkOut ? (
        <div className="bg-emerald-500/10 border-y border-emerald-500/30 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> أنت حالياً في الدوام - بدأت في {new Date(todayAtt.checkIn).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</p>
          <Button onClick={punchOut} className="btn-neon"><X className="w-4 h-4 ml-1" /> بصمة انصراف</Button>
        </div>
      ) : (
        <div className="bg-purple-500/10 border-y border-purple-500/30 px-4 py-3 text-center text-sm text-purple-400">
          ✅ تم إنهاء الدوام اليومي - شكراً لك!
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 max-w-7xl mx-auto">
        {requireAttendance ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gold-gradient flex items-center justify-center text-4xl animate-float mb-4">⏰</div>
            <h2 className="text-xl font-bold gold-text mb-2">سجّل حضورك للبدء</h2>
            <p className="text-sm text-muted-foreground">لن تتمكن من الوصول لمهامك حتى تسجل الحضور</p>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-input/30 border border-gold-soft w-full grid grid-cols-3">
              <TabsTrigger value="home">🏠 الرئيسية</TabsTrigger>
              <TabsTrigger value="tasks">📋 مهامي ({pendingTasks})</TabsTrigger>
              <TabsTrigger value="payroll">💰 راتبي</TabsTrigger>
            </TabsList>

            {/* HOME */}
            <TabsContent value="home" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-card"><p className="text-xs text-muted-foreground">ساعات اليوم</p><p className="text-2xl font-bold gold-text">{todayAtt?.hoursWorked || (todayAtt?.checkIn && !todayAtt?.checkOut ? ((Date.now() - new Date(todayAtt.checkIn)) / 3600000).toFixed(1) : 0)}</p></div>
                <div className="stat-card"><p className="text-xs text-muted-foreground">مهام نشطة</p><p className="text-2xl font-bold neon-text">{pendingTasks}</p></div>
                <div className="stat-card"><p className="text-xs text-muted-foreground">مهام منجزة</p><p className="text-2xl font-bold text-emerald-400">{completedTasks}</p></div>
                <div className="stat-card"><p className="text-xs text-muted-foreground">KPI</p><p className="text-2xl font-bold text-purple-400">{employee.kpi || 0}%</p></div>
              </div>

              <Card className="glass-strong border-gold-soft">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-gold" /> سجل حضور اليوم</CardTitle></CardHeader>
                <CardContent>
                  {todayAtt ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="glass-card rounded-lg p-3 text-center"><p className="text-[10px] text-muted-foreground">الدخول</p><p className="text-lg font-bold text-emerald-400 font-mono">{new Date(todayAtt.checkIn).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</p></div>
                      <div className="glass-card rounded-lg p-3 text-center"><p className="text-[10px] text-muted-foreground">الخروج</p><p className="text-lg font-bold text-cyan-400 font-mono">{todayAtt.checkOut ? new Date(todayAtt.checkOut).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
                      <div className="glass-card rounded-lg p-3 text-center"><p className="text-[10px] text-muted-foreground">الحالة</p><Badge className={todayAtt.status === 'late' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}>{todayAtt.status === 'late' ? `متأخر ${todayAtt.lateMinutes}د` : 'حاضر'}</Badge></div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground text-center">لا توجد بيانات</p>}
                </CardContent>
              </Card>

              <Card className="glass-strong border-gold-soft">
                <CardHeader><CardTitle className="text-base">📋 مهامك القادمة</CardTitle></CardHeader>
                <CardContent>
                  {tasks.filter(t => t.status !== 'completed').slice(0, 3).map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-input/30 border border-gold-soft mb-2">
                      <div className="flex justify-between mb-1"><h4 className="text-sm font-bold">{t.title}</h4><Badge className="text-[10px]">{t.priority}</Badge></div>
                      <p className="text-xs text-muted-foreground">📅 {t.dueDate} · التقدم: {t.progress || 0}%</p>
                    </div>
                  ))}
                  {tasks.filter(t => t.status !== 'completed').length === 0 && <p className="text-sm text-muted-foreground text-center py-4">🎉 لا توجد مهام معلقة!</p>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TASKS */}
            <TabsContent value="tasks" className="mt-4 space-y-3">
              {tasks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">لا توجد مهام مخصصة لك</p> : tasks.map(t => (
                <Card key={t.id} className="glass-card border-gold-soft">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold">{t.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                      </div>
                      <Badge className={t.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' : t.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}>{t.priority}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between"><span>📅 {t.dueDate}</span><span>👤 {t.createdBy}</span></div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>التقدم</span><span className="font-bold">{t.progress || 0}%</span></div>
                      <Progress value={t.progress || 0} className="h-2" />
                    </div>
                    {t.status !== 'completed' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={t.status} onValueChange={v => updateTask(t.id, { status: v })}>
                          <SelectTrigger className="h-9 text-xs bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">جديدة</SelectItem>
                            <SelectItem value="in_progress">جاري العمل</SelectItem>
                            <SelectItem value="completed">✅ مكتملة</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" min="0" max="100" value={t.progress || 0} onChange={e => updateTask(t.id, { progress: Number(e.target.value) })} placeholder="التقدم %" className="h-9 text-xs bg-input/30 border-gold/20" />
                      </div>
                    )}
                    {t.status === 'completed' && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 w-full justify-center py-2">✅ مكتملة</Badge>}
                    {t.notes && <p className="text-xs p-2 bg-input/30 rounded">📝 {t.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* PAYROLL */}
            <TabsContent value="payroll" className="mt-4 space-y-4">
              {payroll && (
                <>
                  <Card className="glass-strong border-gold-soft">
                    <CardContent className="pt-6 text-center space-y-3">
                      <p className="text-xs text-muted-foreground">راتب شهر {payroll.month}</p>
                      <p className="text-5xl font-black gold-text">{fmt(payroll.finalSalary)}</p>
                      <p className="text-xs text-muted-foreground">د.ع</p>
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">الراتب الأساسي</p><p className="text-base font-bold">{fmt(payroll.baseSalary)}</p></div>
                    <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">مكافآت</p><p className="text-base font-bold text-emerald-400">+{fmt(payroll.bonuses)}</p></div>
                    <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">خصومات</p><p className="text-base font-bold text-red-400">-{fmt(payroll.deductions)}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">حضور</p><p className="text-base font-bold text-emerald-400">{payroll.presentDays}</p></div>
                    <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">تأخير</p><p className="text-base font-bold text-amber-400">{payroll.lateDays}</p></div>
                    <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">غياب</p><p className="text-base font-bold text-red-400">{payroll.absentDays}</p></div>
                  </div>
                  <Card className="glass-strong border-gold-soft">
                    <CardHeader><CardTitle className="text-sm">قيود الشهر</CardTitle></CardHeader>
                    <CardContent>
                      {payroll.entries.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">لا توجد قيود</p> :
                      payroll.entries.map(e => (
                        <div key={e.id} className="flex justify-between items-center p-2 border-b border-gold-soft/30">
                          <div>
                            <p className="text-xs font-bold">{e.reason}</p>
                            <p className="text-[10px] text-muted-foreground">{e.date}</p>
                          </div>
                          <span className={`font-bold ${e.type === 'bonus' ? 'text-emerald-400' : 'text-red-400'}`}>{e.type === 'bonus' ? '+' : '-'}{fmt(e.amount)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function EmployeePortal() {
  const [employee, setEmployee] = useState(null);
  useEffect(() => {
    const s = typeof window !== 'undefined' ? localStorage.getItem('emp_session') : null;
    if (s) try { setEmployee(JSON.parse(s).employee); } catch {}
  }, []);
  const logout = () => { localStorage.removeItem('emp_session'); setEmployee(null); };

  return (
    <>
      {employee ? <EmployeeDashboard employee={employee} onLogout={logout} /> : <LoginScreen onLogin={setEmployee} />}
      <Toaster position="top-center" theme="dark" richColors />
    </>
  );
}

export default EmployeePortal;
