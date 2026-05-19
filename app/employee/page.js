'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { toast, Toaster } from 'sonner';
import {
  User, Lock, LogIn, LogOut, Activity, Calendar, Clock,
  CheckCircle2, AlertCircle, X, Bell, Star, Upload, Image as ImageIcon,
  Check, XCircle, FileText, Send, ListTodo, Wallet, Home, Award,
  Wrench, ShoppingCart, BadgeCheck, Users, Camera
} from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const getToken = () => {
  try {
    const s = typeof window !== 'undefined' ? localStorage.getItem('emp_session') : null;
    return s ? (JSON.parse(s).token || '') : '';
  } catch { return ''; }
};
const api = async (path, opts = {}) => {
  const headers = { 'Content-Type': 'application/json', 'X-Emp-Token': getToken(), ...(opts.headers || {}) };
  const r = await fetch(`/api/${path}`, { ...opts, headers });
  return r.json();
};
const uploadFile = async (file) => {
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch('/api/upload', { method: 'POST', body: fd, headers: { 'X-Emp-Token': getToken() } });
  return r.json();
};

// ============================== LOGIN ==============================
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!username || !password) { toast.error('املأ الحقول'); return; }
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
          <p className="text-[10px] text-center text-muted-foreground">
            تواصل مع المدير للحصول على بيانات الدخول
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================== NOTIFICATIONS BELL ==============================
function NotificationsBell({ employeeId, onTaskClick }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const load = async () => {
    if (!employeeId) return;
    const data = await api(`notifications?userId=${employeeId}`);
    if (Array.isArray(data)) setItems(data);
  };
  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, [employeeId]);
  const unread = items.filter(n => !n.read).length;
  const markRead = async (id) => { await api(`notifications/${id}/read`, { method: 'POST' }); load(); };
  const markAllRead = async () => { await api('notifications/read-all', { method: 'POST', body: JSON.stringify({ userId: employeeId }) }); load(); };
  return (
    <div className="relative">
      <Button onClick={() => setOpen(!open)} variant="ghost" size="icon" className="relative">
        <Bell className="w-5 h-5 text-gold" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{unread}</span>
        )}
      </Button>
      {open && (
        <div className="absolute top-12 left-0 w-80 max-h-96 overflow-y-auto glass-strong border border-gold/30 rounded-xl shadow-2xl z-50">
          <div className="p-3 border-b border-gold-soft flex justify-between items-center">
            <p className="text-sm font-bold gold-text">الإشعارات</p>
            {unread > 0 && <button onClick={markAllRead} className="text-[10px] text-cyan-400 hover:underline">قراءة الكل</button>}
          </div>
          {items.length === 0 ? (
            <p className="p-6 text-xs text-center text-muted-foreground">لا توجد إشعارات</p>
          ) : items.map(n => (
            <div key={n.id} onClick={() => { markRead(n.id); if (n.taskId && onTaskClick) onTaskClick(n.taskId); setOpen(false); }}
              className={`p-3 border-b border-gold-soft/30 cursor-pointer hover:bg-input/20 ${!n.read ? 'bg-cyan-500/5' : ''}`}>
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1 w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-xs font-bold">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString('ar-IQ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================== TASK CARD ==============================
const STATUS_META = {
  pending: { label: 'بانتظار القبول', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  new: { label: 'بانتظار القبول', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  in_progress: { label: 'جاري العمل', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  pending_review: { label: 'بانتظار مراجعة المدير', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  completed: { label: '✅ مقبولة', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rejected_by_employee: { label: 'رفضتَها', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  rejected_by_manager: { label: '❌ مرفوضة من المدير', color: 'bg-red-500/30 text-red-300 border-red-500/40' },
  revision: { label: '🔄 إعادة تعديل', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};
const PRIORITY_META = {
  high: { label: '🔴 عالية', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  medium: { label: '🟡 متوسطة', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  low: { label: '🟢 منخفضة', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

function TaskCard({ task, onAccept, onReject, onComplete }) {
  const meta = STATUS_META[task.status] || STATUS_META.pending;
  const prio = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  return (
    <Card className="glass-card border-gold-soft">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-base">{task.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          </div>
          <Badge className={prio.color + ' text-[10px] whitespace-nowrap'}>{prio.label}</Badge>
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>📅 {task.dueDate}</span>
          <span>👤 من: {task.createdBy}</span>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1"><span>التقدم</span><span className="font-bold">{task.progress || 0}%</span></div>
          <Progress value={task.progress || 0} className="h-2" />
        </div>

        <Badge className={meta.color + ' w-full justify-center py-2 text-xs'}>{meta.label}</Badge>

        {/* Pending → Accept/Reject */}
        {(task.status === 'pending' || task.status === 'new') && (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onAccept(task)} className="btn-gold h-9 text-xs"><Check className="w-3 h-3 ml-1" /> قبول</Button>
            <Button onClick={() => onReject(task)} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-9 text-xs"><XCircle className="w-3 h-3 ml-1" /> رفض</Button>
          </div>
        )}

        {/* In progress → Complete */}
        {(task.status === 'in_progress' || task.status === 'revision') && (
          <Button onClick={() => onComplete(task)} className="btn-neon w-full"><Send className="w-4 h-4 ml-1" /> إنهاء المهمة وإرسال التقرير</Button>
        )}

        {/* Show revision notes */}
        {task.status === 'revision' && task.review?.notes && (
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs">
            <p className="font-bold text-orange-400 mb-1">📝 ملاحظات المدير:</p>
            <p>{task.review.notes}</p>
          </div>
        )}

        {/* Rejection reason (own) */}
        {task.status === 'rejected_by_employee' && task.rejectionReason && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs">
            <p className="font-bold text-red-400 mb-1">سبب رفضك:</p>
            <p>{task.rejectionReason}</p>
          </div>
        )}

        {/* Manager review */}
        {(task.status === 'completed' || task.status === 'rejected_by_manager') && task.review && (
          <div className="p-2 rounded-lg bg-input/30 border border-gold-soft text-xs space-y-1">
            <p className="font-bold gold-text">📋 تقييم المدير</p>
            {task.review.notes && <p className="text-muted-foreground">{task.review.notes}</p>}
            {task.review.rating && (
              <div className="grid grid-cols-2 gap-1 mt-2 text-[10px]">
                <div className="flex justify-between"><span>السرعة:</span> <span className="font-bold">{'⭐'.repeat(task.review.rating.speed || 0)}</span></div>
                <div className="flex justify-between"><span>الجودة:</span> <span className="font-bold">{'⭐'.repeat(task.review.rating.quality || 0)}</span></div>
                <div className="flex justify-between"><span>الالتزام:</span> <span className="font-bold">{'⭐'.repeat(task.review.rating.commitment || 0)}</span></div>
                <div className="flex justify-between"><span>عدم التأخير:</span> <span className="font-bold">{'⭐'.repeat(task.review.rating.delay || 0)}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Submitted report preview */}
        {task.status === 'pending_review' && task.report && (
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs">
            <p className="font-bold text-purple-400 mb-1">📤 تقريرك أُرسل</p>
            <p className="text-muted-foreground line-clamp-2">{task.report.summary}</p>
            {task.report.attachments?.length > 0 && <p className="text-[10px] mt-1">📎 {task.report.attachments.length} مرفق</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================== REJECT DIALOG ==============================
function RejectDialog({ task, open, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (open) setReason(''); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-gold/40">
        <DialogHeader><DialogTitle className="text-red-400">رفض المهمة</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">المهمة: <span className="font-bold">{task?.title}</span></p>
        <div>
          <Label className="text-xs">سبب الرفض *</Label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} className="bg-input/30 border-gold/20 h-24 mt-1" placeholder="اشرح بشكل واضح سبب عدم قدرتك على تنفيذ المهمة..." />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => { if (reason.trim().length < 3) { toast.error('السبب قصير جداً'); return; } onSubmit(reason); }} className="bg-red-500 hover:bg-red-600 text-white">إرسال الرفض</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================== COMPLETE TASK DIALOG ==============================
function CompleteDialog({ task, open, onClose, onSubmit }) {
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [problems, setProblems] = useState('');
  const [progress, setProgress] = useState(100);
  const [files, setFiles] = useState([]); // [{url,name,size}]
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  useEffect(() => { if (open) { setSummary(''); setNotes(''); setProblems(''); setProgress(task?.progress || 100); setFiles([]); } }, [open, task]);

  const handleFiles = async (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setUploading(true);
    for (const f of list) {
      const r = await uploadFile(f);
      if (r.error) toast.error('فشل رفع: ' + f.name);
      else setFiles(prev => [...prev, { url: r.url, name: r.name, size: r.size }]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };
  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-gold/40 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="gold-text">إنهاء المهمة - تقرير الإنجاز</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">المهمة: <span className="font-bold">{task?.title}</span></p>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">شرح ما تم إنجازه *</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} className="bg-input/30 border-gold/20 h-20 mt-1" placeholder="اشرح بالتفصيل ما أنجزته..." />
          </div>
          <div>
            <Label className="text-xs">ملاحظات إضافية</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-input/30 border-gold/20 h-16 mt-1" placeholder="ملاحظات للمدير..." />
          </div>
          <div>
            <Label className="text-xs">المشاكل التي واجهتك</Label>
            <Textarea value={problems} onChange={e => setProblems(e.target.value)} className="bg-input/30 border-gold/20 h-16 mt-1" placeholder="عوائق، مواد ناقصة، تأخير..." />
          </div>
          <div>
            <Label className="text-xs">نسبة الإنجاز: <span className="font-bold gold-text">{progress}%</span></Label>
            <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full mt-2 accent-amber-500" />
          </div>

          <div>
            <Label className="text-xs flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> صور / ملفات الإنجاز
            </Label>
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf,.doc,.docx" onChange={handleFiles} className="hidden" />
            <Button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline" className="w-full mt-1 border-gold/30 hover:bg-gold/10">
              <Upload className="w-4 h-4 ml-1" /> {uploading ? 'جاري الرفع...' : 'اختر ملفات (صور قبل/بعد، توقيع، PDF)'}
            </Button>
            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="relative p-2 rounded-lg bg-input/30 border border-gold/20 group">
                    {f.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                      <img src={f.url} alt={f.name} className="w-full h-20 object-cover rounded" />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center"><FileText className="w-8 h-8 text-cyan-400" /></div>
                    )}
                    <p className="text-[9px] truncate mt-1">{f.name}</p>
                    <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3 text-white" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            onClick={() => {
              if (summary.trim().length < 3) { toast.error('شرح الإنجاز مطلوب'); return; }
              onSubmit({ summary, notes, problems, progress, attachments: files });
            }}
            className="btn-gold flex-1">
            <Send className="w-4 h-4 ml-1" /> إرسال التقرير
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================== TASKS SECTION ==============================
function TasksSection({ employeeId }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [rejectTask, setRejectTask] = useState(null);
  const [completeTask, setCompleteTask] = useState(null);

  const load = async () => {
    const t = await api(`employees/${employeeId}/tasks`);
    if (Array.isArray(t)) setTasks(t);
  };
  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [employeeId]);

  const accept = async (task) => {
    const r = await api(`tasks/${task.id}/accept`, { method: 'POST', body: JSON.stringify({ employeeId }) });
    if (r.error) toast.error(r.error); else { toast.success('✅ تم قبول المهمة'); load(); }
  };
  const submitReject = async (reason) => {
    const r = await api(`tasks/${rejectTask.id}/reject`, { method: 'POST', body: JSON.stringify({ employeeId, reason }) });
    if (r.error) toast.error(r.error); else { toast.success('تم إرسال الرفض للمدير'); setRejectTask(null); load(); }
  };
  const submitComplete = async (payload) => {
    const r = await api(`tasks/${completeTask.id}/complete`, { method: 'POST', body: JSON.stringify({ employeeId, ...payload }) });
    if (r.error) toast.error(r.error); else { toast.success('✅ تم إرسال التقرير للمدير'); setCompleteTask(null); load(); }
  };

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => ['pending', 'new'].includes(t.status)).length,
    in_progress: tasks.filter(t => ['in_progress', 'revision'].includes(t.status)).length,
    pending_review: tasks.filter(t => t.status === 'pending_review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    rejected: tasks.filter(t => ['rejected_by_employee', 'rejected_by_manager'].includes(t.status)).length,
  };
  const filtered = filter === 'all' ? tasks
    : filter === 'pending' ? tasks.filter(t => ['pending', 'new'].includes(t.status))
    : filter === 'in_progress' ? tasks.filter(t => ['in_progress', 'revision'].includes(t.status))
    : tasks.filter(t => t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { k: 'all', l: 'الكل', c: counts.all },
          { k: 'pending', l: '🟡 بانتظار القبول', c: counts.pending },
          { k: 'in_progress', l: '🔵 جاري العمل', c: counts.in_progress },
          { k: 'pending_review', l: '🟣 بانتظار المراجعة', c: counts.pending_review },
          { k: 'completed', l: '✅ مكتملة', c: counts.completed },
          { k: 'rejected', l: '❌ مرفوضة', c: counts.rejected },
        ].map(b => (
          <button key={b.k} onClick={() => setFilter(b.k)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${filter === b.k ? 'bg-gold/20 border-gold text-gold' : 'bg-input/30 border-gold-soft text-muted-foreground hover:text-gold'}`}>
            {b.l} ({b.c})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <ListTodo className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد مهام في هذه الفئة</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(t => (
            <TaskCard key={t.id} task={t}
              onAccept={accept}
              onReject={setRejectTask}
              onComplete={setCompleteTask}
            />
          ))}
        </div>
      )}

      <RejectDialog task={rejectTask} open={!!rejectTask} onClose={() => setRejectTask(null)} onSubmit={submitReject} />
      <CompleteDialog task={completeTask} open={!!completeTask} onClose={() => setCompleteTask(null)} onSubmit={submitComplete} />
    </div>
  );
}

// ============================== ATTENDANCE BANNER ==============================
function AttendanceBanner({ employee, todayAtt, onRefresh }) {
  const punchIn = async () => {
    const r = await api('attendance/checkin', { method: 'POST', body: JSON.stringify({ employeeId: employee.id }) });
    if (r.error) toast.error(r.error); else { toast.success(r.record?.isLate ? `⏰ حضور متأخر بـ ${r.record.lateMinutes} دقيقة` : '✅ تم تسجيل الحضور'); onRefresh(); }
  };
  const punchOut = async () => {
    const r = await api('attendance/checkout', { method: 'POST', body: JSON.stringify({ employeeId: employee.id }) });
    if (r.error) toast.error(r.error); else { toast.success(`✅ تم الانصراف - عملت ${r.hoursWorked} ساعة`); onRefresh(); }
  };
  if (!todayAtt) {
    return (
      <div className="bg-amber-500/10 border-y border-amber-500/30 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-amber-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> يجب تسجيل الحضور قبل البدء بالعمل</p>
        <Button onClick={punchIn} className="btn-gold"><Activity className="w-4 h-4 ml-1 animate-pulse" /> بصمة حضور</Button>
      </div>
    );
  }
  if (!todayAtt.checkOut) {
    return (
      <div className="bg-emerald-500/10 border-y border-emerald-500/30 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> أنت حالياً في الدوام - بدأت في {new Date(todayAtt.checkIn).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</p>
        <Button onClick={punchOut} className="btn-neon"><X className="w-4 h-4 ml-1" /> بصمة انصراف</Button>
      </div>
    );
  }
  return (
    <div className="bg-purple-500/10 border-y border-purple-500/30 px-4 py-3 text-center text-sm text-purple-400">
      ✅ تم إنهاء الدوام اليومي - شكراً لك!
    </div>
  );
}

// ============================== HOME ==============================
function HomeTab({ employee, todayAtt, tasks, payroll }) {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingAcceptance = tasks.filter(t => ['pending', 'new'].includes(t.status)).length;
  const activeTasks = tasks.filter(t => ['in_progress', 'revision'].includes(t.status)).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">ساعات اليوم</p><p className="text-2xl font-bold gold-text">{todayAtt?.hoursWorked || (todayAtt?.checkIn && !todayAtt?.checkOut ? ((Date.now() - new Date(todayAtt.checkIn)) / 3600000).toFixed(1) : 0)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">بانتظار القبول</p><p className="text-2xl font-bold text-amber-400">{pendingAcceptance}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">قيد العمل</p><p className="text-2xl font-bold neon-text">{activeTasks}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">منجزة</p><p className="text-2xl font-bold text-emerald-400">{completedTasks}</p></div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass-strong border-gold-soft">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-gold" /> سجل حضور اليوم</CardTitle></CardHeader>
          <CardContent>
            {todayAtt ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card rounded-lg p-3 text-center"><p className="text-[10px] text-muted-foreground">الدخول</p><p className="text-lg font-bold text-emerald-400 font-mono">{new Date(todayAtt.checkIn).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</p></div>
                <div className="glass-card rounded-lg p-3 text-center"><p className="text-[10px] text-muted-foreground">الخروج</p><p className="text-lg font-bold text-cyan-400 font-mono">{todayAtt.checkOut ? new Date(todayAtt.checkOut).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '—'}</p></div>
                <div className="glass-card rounded-lg p-3 text-center"><p className="text-[10px] text-muted-foreground">الحالة</p><Badge className={todayAtt.status === 'late' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}>{todayAtt.status === 'late' ? `متأخر ${todayAtt.lateMinutes}د` : 'حاضر'}</Badge></div>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-2">لم يتم تسجيل حضور بعد</p>}
          </CardContent>
        </Card>

        <Card className="glass-strong border-gold-soft">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4 text-purple-400" /> أدائي</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">KPI</span>
              <span className="text-2xl font-bold text-purple-400">{employee.kpi || 0}%</span>
            </div>
            <Progress value={employee.kpi || 0} className="h-2" />
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gold-soft">
              <div>
                <p className="text-muted-foreground">المهام المنجزة</p>
                <p className="font-bold text-emerald-400">{employee.tasksCompleted || completedTasks}</p>
              </div>
              <div>
                <p className="text-muted-foreground">نقاط التقييم</p>
                <p className="font-bold gold-text">{employee.ratingPoints || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-strong border-gold-soft">
        <CardHeader><CardTitle className="text-base">📋 مهام بحاجة لاهتمامك</CardTitle></CardHeader>
        <CardContent>
          {tasks.filter(t => ['pending', 'new', 'revision'].includes(t.status)).slice(0, 5).map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-input/30 border border-gold-soft mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-bold">{t.title}</h4>
                <p className="text-xs text-muted-foreground">📅 {t.dueDate}</p>
              </div>
              <Badge className={(STATUS_META[t.status] || STATUS_META.pending).color + ' text-[10px]'}>{(STATUS_META[t.status] || STATUS_META.pending).label}</Badge>
            </div>
          ))}
          {tasks.filter(t => ['pending', 'new', 'revision'].includes(t.status)).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">🎉 لا توجد مهام تحتاج اهتمامك!</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================== PAYROLL TAB (own only) ==============================
function PayrollTab({ payroll }) {
  if (!payroll) return <p className="text-sm text-muted-foreground text-center py-8">جاري التحميل...</p>;
  return (
    <div className="space-y-4">
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
          {(payroll.entries || []).length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">لا توجد قيود</p> :
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
    </div>
  );
}

// ============================== REAL EMPLOYEE PAGES ==============================

// 1) POS - record sale + view own sales
function MyPOSSection({ employee }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customer, setCustomer] = useState('');
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);

  const load = async () => {
    const [p, s] = await Promise.all([api('products'), api(`employees/${employee.id}/sales`)]);
    setProducts(Array.isArray(p) ? p : []);
    if (s && !s.error) { setSales(s.sales || []); setTotal(s.total || 0); }
  };
  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search));
  const addItem = (p) => {
    setCart(prev => {
      const ex = prev.find(x => x.id === p.id);
      if (ex) return prev.map(x => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
  };
  const removeItem = (id) => setCart(prev => prev.filter(x => x.id !== id));
  const changeQty = (id, q) => setCart(prev => prev.map(x => x.id === id ? { ...x, quantity: Math.max(1, q) } : x));
  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discount);

  const checkout = async () => {
    if (cart.length === 0) { toast.error('السلة فارغة'); return; }
    const r = await api(`employees/${employee.id}/sales`, { method: 'POST', body: JSON.stringify({ items: cart, discount, paymentMethod, customer }) });
    if (r.error) toast.error(r.error);
    else { toast.success(`✅ تم الدفع - ${r.invoiceNumber}`); setCart([]); setDiscount(0); setCustomer(''); load(); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <Input placeholder="🔍 ابحث عن منتج أو باركود..." value={search} onChange={e => setSearch(e.target.value)} className="bg-input/30 border-gold/20" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
          {filtered.slice(0, 30).map(p => (
            <Card key={p.id} onClick={() => addItem(p)} className="glass-card border-gold-soft hover:border-gold cursor-pointer transition-all">
              <CardContent className="p-3">
                <p className="text-xs font-bold truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.barcode}</p>
                <p className="text-sm gold-text font-bold mt-1">{fmt(p.price)} د.ع</p>
                <p className="text-[9px] text-muted-foreground">المخزون: {p.stock}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-strong border-gold-soft">
          <CardHeader><CardTitle className="text-sm">📊 مبيعاتي ({sales.length} - إجمالي {fmt(total)} د.ع)</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-48 overflow-y-auto">
            {sales.slice(0, 10).map(s => (
              <div key={s.id} className="flex justify-between text-xs py-1 border-b border-gold-soft/30">
                <span className="font-mono">{s.invoiceNumber}</span>
                <span className="gold-text font-bold">{fmt(s.total)} د.ع</span>
                <span className="text-muted-foreground">{new Date(s.createdAt).toLocaleString('ar-IQ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
              </div>
            ))}
            {sales.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">لا توجد مبيعات</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-strong border-gold/40 h-fit sticky top-20">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-gold" /> السلة ({cart.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {cart.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">السلة فارغة</p>
          ) : cart.map(it => (
            <div key={it.id} className="flex items-center gap-2 text-xs">
              <button onClick={() => removeItem(it.id)} className="text-red-400"><X className="w-3 h-3" /></button>
              <div className="flex-1">
                <p className="font-bold truncate">{it.name}</p>
                <p className="text-[10px] text-muted-foreground">{fmt(it.price)} د.ع</p>
              </div>
              <Input type="number" min="1" value={it.quantity} onChange={e => changeQty(it.id, Number(e.target.value))} className="w-14 h-7 text-xs bg-input/30 border-gold/20" />
              <span className="w-16 text-left font-bold gold-text">{fmt(it.price * it.quantity)}</span>
            </div>
          ))}

          <div className="border-t border-gold-soft pt-2 space-y-2">
            <Input type="number" placeholder="خصم" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="bg-input/30 border-gold/20 h-8 text-xs" />
            <Input placeholder="اسم الزبون (اختياري)" value={customer} onChange={e => setCustomer(e.target.value)} className="bg-input/30 border-gold/20 h-8 text-xs" />
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-input/30 border-gold/20 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="master">ماستركارد</SelectItem>
                <SelectItem value="fastpay">FastPay</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-between text-xs"><span>المجموع</span><span className="font-bold">{fmt(subtotal)} د.ع</span></div>
            <div className="flex justify-between text-base font-bold gold-text"><span>الإجمالي</span><span>{fmt(finalTotal)} د.ع</span></div>
            <Button onClick={checkout} className="btn-gold w-full">دفع وإصدار فاتورة</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 2) Repairs - my tickets, update status
function MyRepairsSection({ employee }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const load = async () => {
    const r = await api(`employees/${employee.id}/repairs`);
    if (Array.isArray(r)) setItems(r);
    else if (r.error) toast.error(r.error);
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter(r => r.status === filter);

  const updateStatus = async (id, status) => {
    const r = await api(`employees/${employee.id}/repairs/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (r.error) toast.error(r.error);
    else { toast.success('✅ تم التحديث'); load(); }
  };

  const statusCls = {
    pending: 'bg-amber-500/20 text-amber-400',
    in_progress: 'bg-cyan-500/20 text-cyan-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };
  const statusLabel = { pending: 'بالانتظار', in_progress: 'جاري الصيانة', completed: 'مكتمل', cancelled: 'ملغي' };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'in_progress', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs border ${filter === s ? 'bg-gold/20 border-gold text-gold' : 'bg-input/30 border-gold-soft text-muted-foreground'}`}>
            {s === 'all' ? `📋 الكل (${items.length})` : `${statusLabel[s]} (${items.filter(x => x.status === s).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12"><Wrench className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">لا توجد تذاكر صيانة مخصصة لك</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(r => (
            <Card key={r.id} className="glass-card border-gold-soft">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-mono text-sm gold-text">{r.ticketNumber}</p>
                    <p className="text-xs font-bold mt-1">{r.device}</p>
                  </div>
                  <Badge className={statusCls[r.status] || 'bg-muted'}>{statusLabel[r.status] || r.status}</Badge>
                </div>
                <div className="text-xs space-y-1">
                  <p><span className="text-muted-foreground">العميل:</span> {r.customerName}</p>
                  <p><span className="text-muted-foreground">المشكلة:</span> {r.issue}</p>
                  <p><span className="text-muted-foreground">التكلفة:</span> <span className="gold-text font-bold">{fmt(r.cost)} د.ع</span></p>
                </div>
                {r.status !== 'completed' && r.status !== 'cancelled' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gold-soft">
                    {r.status === 'pending' && <Button onClick={() => updateStatus(r.id, 'in_progress')} size="sm" className="btn-neon h-8 text-xs">بدء العمل</Button>}
                    {r.status === 'in_progress' && <Button onClick={() => updateStatus(r.id, 'completed')} size="sm" className="btn-gold h-8 text-xs">✅ إنهاء</Button>}
                    <Button onClick={() => updateStatus(r.id, 'cancelled')} variant="outline" size="sm" className="border-red-500/30 text-red-400 h-8 text-xs">إلغاء</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// 3) Reports - personal performance
function MyReportsSection({ employee }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api(`employees/${employee.id}/report?month=${month}`).then(r => {
      if (r.error) { setErr(r.error); setData(null); }
      else { setErr(null); setData(r); }
    });
  }, [month]);

  if (err) return <div className="text-center py-12 text-red-400">{err}</div>;
  if (!data) return <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-lg font-bold gold-text">📊 تقرير الأداء الشخصي</h2>
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-44 bg-input/30 border-gold/20" />
      </div>

      <Card className="glass-strong border-gold/40">
        <CardContent className="pt-6 text-center">
          <p className="text-xs text-muted-foreground">نقاط الأداء الكلي (KPI)</p>
          <p className="text-6xl font-black gold-text mt-2">{data.kpi}<span className="text-2xl">%</span></p>
          <p className="text-[10px] text-muted-foreground mt-2">نقاط التقييم: <span className="font-bold gold-text">{data.ratingPoints}</span> · مهام منجزة كلياً: <span className="font-bold">{data.tasksCompletedAllTime}</span></p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card className="glass-card border-gold-soft">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> الحضور</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-muted-foreground">حاضر</p><p className="font-bold text-emerald-400 text-lg">{data.attendance.present}</p></div>
            <div><p className="text-muted-foreground">متأخر</p><p className="font-bold text-amber-400 text-lg">{data.attendance.late}</p></div>
            <div><p className="text-muted-foreground">غياب</p><p className="font-bold text-red-400 text-lg">{data.attendance.absent}</p></div>
            <div><p className="text-muted-foreground">الساعات</p><p className="font-bold gold-text text-lg">{data.attendance.totalHours}</p></div>
          </CardContent>
        </Card>

        <Card className="glass-card border-gold-soft">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ListTodo className="w-4 h-4 text-purple-400" /> المهام</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-muted-foreground">منجزة</p><p className="font-bold text-emerald-400 text-lg">{data.tasks.completed}</p></div>
            <div><p className="text-muted-foreground">قيد العمل</p><p className="font-bold text-cyan-400 text-lg">{data.tasks.inProgress}</p></div>
            <div><p className="text-muted-foreground">بانتظار القبول</p><p className="font-bold text-amber-400 text-lg">{data.tasks.pending}</p></div>
            <div><p className="text-muted-foreground">قيد المراجعة</p><p className="font-bold text-purple-400 text-lg">{data.tasks.underReview}</p></div>
          </CardContent>
        </Card>

        <Card className="glass-card border-gold-soft">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-emerald-400" /> المبيعات</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">عدد الفواتير</p>
            <p className="font-bold text-2xl">{data.sales.count}</p>
            <p className="text-xs text-muted-foreground mt-2">الإجمالي</p>
            <p className="font-bold gold-text text-lg">{fmt(data.sales.total)} د.ع</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-gold-soft">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-400" /> الصيانة</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-muted-foreground">منجزة</p><p className="font-bold text-emerald-400 text-lg">{data.repairs.completed}</p></div>
            <div><p className="text-muted-foreground">معلقة</p><p className="font-bold text-amber-400 text-lg">{data.repairs.pending}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-gold-soft">
        <CardHeader><CardTitle className="text-sm">💰 الراتب لهذا الشهر</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">مكافآت</p>
            <p className="text-lg font-bold text-emerald-400">+{fmt(data.payroll.bonuses)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">خصومات</p>
            <p className="text-lg font-bold text-red-400">-{fmt(data.payroll.deductions)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 4) ISP - read-only zones/networks
function MyIspSection({ employee }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    api(`employees/${employee.id}/isp`).then(r => {
      if (r.error) { setErr(r.error); }
      else setData(r);
    });
  }, []);
  if (err) return <div className="text-center py-12 text-red-400">{err}</div>;
  if (!data) return <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">الزونات</p><p className="text-2xl font-bold gold-text">{data.zones.length}</p></div>
        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">شبكات نشطة</p><p className="text-2xl font-bold text-emerald-400">{data.networks.filter(n => n.status === 'active').length}</p></div>
        <div className="stat-card text-center"><p className="text-xs text-muted-foreground">شبكات معطلة</p><p className="text-2xl font-bold text-red-400">{data.networks.filter(n => n.status !== 'active').length}</p></div>
      </div>
      <Card className="glass-strong border-gold-soft">
        <CardHeader><CardTitle className="text-sm">🌐 الزونات</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-2">
          {data.zones.map(z => (
            <div key={z.id} className="flex justify-between items-center p-2 rounded bg-input/30 border border-gold-soft">
              <div>
                <p className="text-sm font-bold">{z.name}</p>
                <p className="text-[10px] text-muted-foreground">{z.fats || 0} فاتة · {z.subscribers || 0} مشترك</p>
              </div>
              <Badge className={z.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : z.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}>{z.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="glass-strong border-gold-soft">
        <CardHeader><CardTitle className="text-sm">🔌 الشبكات / الفاتات</CardTitle></CardHeader>
        <CardContent className="max-h-96 overflow-y-auto space-y-1">
          {data.networks.slice(0, 50).map(n => (
            <div key={n.id} className="flex justify-between text-xs p-2 border-b border-gold-soft/30">
              <span className="font-mono">{n.number}</span>
              <span>{n.zoneName}</span>
              <span>{n.subscribers}/{n.capacity}</span>
              <Badge className={n.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 text-[9px]' : 'bg-amber-500/20 text-amber-400 text-[9px]'}>{n.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// 5) Subscribers - read-only filtered by me
function MySubscribersSection({ employee }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);
  useEffect(() => {
    api(`employees/${employee.id}/subscribers`).then(r => {
      if (r.error) setErr(r.error);
      else if (Array.isArray(r)) setItems(r);
    });
  }, []);
  if (err) return <div className="text-center py-12 text-red-400">{err}</div>;
  if (items.length === 0) return <div className="text-center py-12"><Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">لا يوجد مشتركون مخصصون لك</p></div>;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {items.map(s => (
        <Card key={s.id} className="glass-card border-gold-soft">
          <CardContent className="p-4 space-y-1">
            <div className="flex justify-between">
              <p className="font-bold">{s.name}</p>
              <Badge className={s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>{s.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{s.zoneName} · {s.fatNumber}</p>
            <p className="text-xs">السرعة: <span className="font-bold">{s.speed || '-'}</span></p>
            <p className="text-xs">انتهاء: <span className="gold-text">{s.dueDate || '-'}</span></p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 6) Unauthorized fallback
function Unauthorized({ permission }) {
  return (
    <div className="text-center py-16">
      <Lock className="w-20 h-20 mx-auto text-red-500/40 mb-4" />
      <h3 className="text-2xl font-bold text-red-400">⛔ غير مصرح لك</h3>
      <p className="text-sm text-muted-foreground mt-2">لا تملك صلاحية الوصول إلى قسم <span className="font-bold gold-text">{permission}</span></p>
      <p className="text-xs text-muted-foreground mt-1">تواصل مع المدير للحصول على الصلاحية</p>
    </div>
  );
}

// ============================== PERMISSION-BASED PLACEHOLDER TABS ==============================
function PermissionPlaceholder({ icon: Icon, label, hint }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-16 h-16 mx-auto text-gold/40 mb-4" />
      <h3 className="text-lg font-bold gold-text">{label}</h3>
      <p className="text-xs text-muted-foreground mt-2">{hint}</p>
    </div>
  );
}

// ============================== DASHBOARD ==============================
function EmployeeDashboard({ employee, onLogout }) {
  const [tab, setTab] = useState('home');
  const [todayAtt, setTodayAtt] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [selfData, setSelfData] = useState(employee);

  const loadAll = async () => {
    const [att, ts, pr, self] = await Promise.all([
      api('attendance/today').then(r => Array.isArray(r) ? r.find(x => x.employeeId === employee.id) : null),
      api(`employees/${employee.id}/tasks`),
      api(`employees/${employee.id}/payroll?month=${new Date().toISOString().slice(0, 7)}`),
      api(`employees/${employee.id}/self`),
    ]);
    setTodayAtt(att); setTasks(Array.isArray(ts) ? ts : []); setPayroll(pr);
    if (self && !self.error) {
      setSelfData(self);
      // Preserve the existing token in localStorage; only update employee object
      try {
        const cur = JSON.parse(localStorage.getItem('emp_session') || '{}');
        localStorage.setItem('emp_session', JSON.stringify({ ...cur, employee: self }));
      } catch {}
    }
  };
  useEffect(() => { loadAll(); const i = setInterval(loadAll, 30000); return () => clearInterval(i); }, []);

  const requireAttendance = !todayAtt;
  const perms = selfData.permissions || ['tasks'];

  // Build dynamic tabs based on permissions
  const allTabs = [
    { key: 'home', label: 'الرئيسية', icon: Home, perm: null }, // always
    { key: 'tasks', label: 'المهام', icon: ListTodo, perm: 'tasks', badge: tasks.filter(t => ['pending', 'new'].includes(t.status)).length },
    { key: 'payroll', label: 'راتبي', icon: Wallet, perm: null }, // always for self
    { key: 'pos', label: 'نقاط البيع', icon: ShoppingCart, perm: 'pos' },
    { key: 'repairs', label: 'الصيانة', icon: Wrench, perm: 'repairs' },
    { key: 'isp', label: 'الإنترنت', icon: Activity, perm: 'isp' },
    { key: 'subscribers', label: 'مشتركيني', icon: Users, perm: 'subscribers' },
    { key: 'reports', label: 'تقاريري', icon: BadgeCheck, perm: 'reports' },
  ];
  const visibleTabs = allTabs.filter(t => !t.perm || perms.includes(t.perm) || perms.includes('all'));
  const hasPerm = (p) => perms.includes(p) || perms.includes('all');

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="glass-strong border-b border-gold-soft px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-xl">{selfData.photo || '👤'}</div>
          <div>
            <p className="text-sm font-bold gold-text">{selfData.name}</p>
            <p className="text-[10px] text-muted-foreground">{selfData.employeeId} · {selfData.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsBell employeeId={employee.id} onTaskClick={() => setTab('tasks')} />
          <Button onClick={onLogout} variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            <LogOut className="w-3 h-3 ml-1" /> خروج
          </Button>
        </div>
      </header>

      <AttendanceBanner employee={selfData} todayAtt={todayAtt} onRefresh={loadAll} />

      <main className="p-4 max-w-7xl mx-auto">
        {requireAttendance ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gold-gradient flex items-center justify-center text-4xl animate-float mb-4">⏰</div>
            <h2 className="text-xl font-bold gold-text mb-2">سجّل حضورك للبدء</h2>
            <p className="text-sm text-muted-foreground">لن تتمكن من الوصول لمهامك حتى تسجل الحضور</p>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-input/30 border border-gold-soft w-full flex flex-wrap h-auto gap-1">
              {visibleTabs.map(t => {
                const Icon = t.icon;
                return (
                  <TabsTrigger key={t.key} value={t.key} className="text-xs gap-1 flex-1 min-w-[100px]">
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                    {t.badge > 0 && <Badge className="bg-red-500 text-white text-[9px] h-4 px-1.5 ml-1">{t.badge}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="home" className="mt-4">
              <HomeTab employee={selfData} todayAtt={todayAtt} tasks={tasks} payroll={payroll} />
            </TabsContent>

            {hasPerm('tasks') ? (
              <TabsContent value="tasks" className="mt-4">
                <TasksSection employeeId={employee.id} />
              </TabsContent>
            ) : null}

            <TabsContent value="payroll" className="mt-4">
              <PayrollTab payroll={payroll} />
            </TabsContent>

            {hasPerm('pos') ? (
              <TabsContent value="pos" className="mt-4">
                <MyPOSSection employee={selfData} />
              </TabsContent>
            ) : null}

            {hasPerm('repairs') ? (
              <TabsContent value="repairs" className="mt-4">
                <MyRepairsSection employee={selfData} />
              </TabsContent>
            ) : null}

            {hasPerm('isp') ? (
              <TabsContent value="isp" className="mt-4">
                <MyIspSection employee={selfData} />
              </TabsContent>
            ) : null}

            {hasPerm('subscribers') ? (
              <TabsContent value="subscribers" className="mt-4">
                <MySubscribersSection employee={selfData} />
              </TabsContent>
            ) : null}

            {hasPerm('reports') ? (
              <TabsContent value="reports" className="mt-4">
                <MyReportsSection employee={selfData} />
              </TabsContent>
            ) : null}
          </Tabs>
        )}
      </main>
    </div>
  );
}

// ============================== ROOT ==============================
function EmployeePortal() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const s = typeof window !== 'undefined' ? localStorage.getItem('emp_session') : null;
    if (s) try { setEmployee(JSON.parse(s).employee); } catch {}
    setLoading(false);
  }, []);
  const logout = () => { localStorage.removeItem('emp_session'); setEmployee(null); };

  if (loading) return null;

  return (
    <>
      {employee ? <EmployeeDashboard employee={employee} onLogout={logout} /> : <LoginScreen onLogin={setEmployee} />}
      <Toaster position="top-center" theme="dark" richColors />
    </>
  );
}

export default EmployeePortal;
