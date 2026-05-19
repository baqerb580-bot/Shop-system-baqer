'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  LayoutDashboard, ShoppingCart, Package, Wrench, Users, Network, Camera,
  BarChart3, Sparkles, Settings, Search, Plus, Trash2, Edit2, Phone,
  Wifi, MapPin, Activity, AlertTriangle, TrendingUp, DollarSign, Zap,
  Send, Bot, Menu, Bell, ChevronLeft, Box, CreditCard, FileText, X,
  CheckCircle2, Clock, AlertCircle, Globe, Smartphone, Headphones,
  HardDrive, Plug, Battery, ScanLine, Receipt, ShoppingBag, UserCheck,
  Building2, BarChart, PieChart as PieIcon, Boxes, ChevronDown
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart as RBarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadialBarChart, RadialBar
} from 'recharts';

// ============ HELPERS ============
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const fmtCurrency = (n) => `${fmt(n)} د.ع`;
const api = async (path, opts = {}) => {
  const r = await fetch(`/api/${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  return r.json();
};

const MENU = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, color: 'gold' },
  { id: 'pos', label: 'نقطة البيع POS', icon: ShoppingCart, color: 'gold' },
  { id: 'products', label: 'المنتجات والمخزون', icon: Package, color: 'neon' },
  { id: 'subscribers', label: 'مشتركو الإنترنت', icon: Wifi, color: 'neon' },
  { id: 'activations', label: 'سجل التفعيلات', icon: CheckCircle2, color: 'gold' },
  { id: 'agents', label: 'الوكلاء', icon: UserCheck, color: 'neon' },
  { id: 'networks', label: 'الشبكات / الفاتات', icon: Plug, color: 'neon' },
  { id: 'zones', label: 'الزونات', icon: Network, color: 'neon' },
  { id: 'noc', label: 'مراقبة الشبكة NOC', icon: Activity, color: 'neon' },
  { id: 'whatsapp', label: 'سجل الواتساب', icon: Send, color: 'gold' },
  { id: 'repairs', label: 'صيانة الهواتف', icon: Wrench, color: 'gold' },
  { id: 'cameras', label: 'الكاميرات', icon: Camera, color: 'gold' },
  { id: 'employees', label: 'الموظفون', icon: Users, color: 'gold' },
  { id: 'reports', label: 'التقارير والتحليلات', icon: BarChart3, color: 'neon' },
  { id: 'ai', label: 'المساعد الذكي AI', icon: Sparkles, color: 'gold' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'neon' },
];

// ============ MAIN APP ============
function App() {
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-background grid-pattern">
      {/* Sidebar */}
      <Sidebar active={active} setActive={setActive} open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar setActive={setActive} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto scrollbar-thin p-6">
          {active === 'dashboard' && <Dashboard setActive={setActive} />}
          {active === 'pos' && <POS />}
          {active === 'products' && <Products />}
          {active === 'subscribers' && <Subscribers />}
          {active === 'activations' && <ActivationsLog />}
          {active === 'agents' && <Agents />}
          {active === 'networks' && <Networks />}
          {active === 'zones' && <Zones />}
          {active === 'noc' && <NOC />}
          {active === 'whatsapp' && <WhatsAppLog />}
          {active === 'repairs' && <Repairs />}
          {active === 'cameras' && <Cameras />}
          {active === 'employees' && <Employees />}
          {active === 'reports' && <Reports />}
          {active === 'ai' && <AIAssistant />}
          {active === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

// ============ SIDEBAR ============
function Sidebar({ active, setActive, open, setOpen }) {
  return (
    <aside className={`glass-strong border-l border-gold-soft transition-all duration-300 ${open ? 'w-72' : 'w-20'} flex flex-col`}>
      {/* Logo */}
      <div className="p-5 border-b border-gold-soft flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold-glow animate-pulse-glow">
          <span className="text-2xl font-black text-background">غ</span>
        </div>
        {open && (
          <div>
            <h1 className="text-lg font-black gold-text leading-tight">مركز الغزلان</h1>
            <p className="text-[10px] text-muted-foreground">ERP · NOC · POS · AI</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {MENU.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`sidebar-item ${isActive ? 'active' : ''} ${!open ? 'justify-center' : ''}`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gold' : ''}`} />
                {open && <span className="truncate">{item.label}</span>}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-gold-soft">
        <div className={`glass-card rounded-xl p-3 ${!open && 'text-center'}`}>
          <div className={`flex items-center gap-2 ${!open && 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-neon-gradient flex items-center justify-center">
              <span className="text-sm font-bold">ك</span>
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">كرار الغزلان</p>
                <p className="text-[10px] text-muted-foreground">مدير عام</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ============ TOP BAR ============
function TopBar({ setActive, sidebarOpen, setSidebarOpen }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);

  return (
    <header className="glass-strong border-b border-gold-soft px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hover:bg-gold/10">
          <Menu className="w-5 h-5 text-gold" />
        </Button>
        <div>
          <h2 className="text-lg font-bold gold-text">منصة إدارة الأعمال الذكية</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            النظام يعمل · {time}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 glass-card rounded-xl">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث سريع..." className="border-0 bg-transparent w-48 focus-visible:ring-0" />
        </div>
        <Button variant="ghost" size="icon" className="relative hover:bg-gold/10" onClick={() => setActive('ai')}>
          <Sparkles className="w-5 h-5 text-gold" />
        </Button>
        <Button variant="ghost" size="icon" className="relative hover:bg-gold/10">
          <Bell className="w-5 h-5 text-gold" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </Button>
      </div>
    </header>
  );
}

// ============ DASHBOARD ============
function Dashboard({ setActive }) {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  useEffect(() => {
    api('dashboard/stats').then(setStats);
    api('ai/insights').then(d => setInsights(d.insights || []));
  }, []);

  if (!stats) return <LoadingScreen />;

  const cards = [
    { label: 'إجمالي المشتركين', value: stats.totalSubscribers, sub: `${stats.activeSubscribers} نشط`, icon: Wifi, color: 'from-amber-500 to-yellow-600', glow: 'shadow-gold-glow' },
    { label: 'دخل الاشتراكات/شهر', value: fmtCurrency(stats.monthlyIncome), icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
    { label: 'مبيعات POS', value: fmtCurrency(stats.totalRevenue), icon: ShoppingCart, color: 'from-cyan-500 to-blue-600', glow: 'shadow-neon-glow' },
    { label: 'الزونات النشطة', value: `${stats.onlineZones}/${stats.totalZones}`, icon: Network, color: 'from-purple-500 to-pink-600' },
    { label: 'صيانات قيد التنفيذ', value: stats.pendingRepairs, sub: `من ${stats.totalRepairs} إجمالي`, icon: Wrench, color: 'from-orange-500 to-red-600' },
    { label: 'منتجات بالمخزون', value: stats.totalProducts, sub: `${stats.lowStockCount} نواقص`, icon: Package, color: 'from-indigo-500 to-purple-600' },
    { label: 'إجمالي الديون', value: fmtCurrency(stats.totalDebt), icon: AlertCircle, color: 'from-rose-500 to-red-600' },
    { label: 'الموظفون', value: stats.totalEmployees, icon: Users, color: 'from-fuchsia-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Hero */}
      <div className="glass-strong rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gold/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-black gold-text mb-2">أهلاً بك في مركز الغزلان</h1>
          <p className="text-muted-foreground">منصة ERP متكاملة - مبيعات، شبكات، صيانة، وذكاء اصطناعي في مكان واحد</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={() => setActive('pos')} className="btn-gold">
              <ShoppingCart className="w-4 h-4 ml-2" /> فتح نقطة البيع
            </Button>
            <Button onClick={() => setActive('ai')} className="btn-neon">
              <Sparkles className="w-4 h-4 ml-2" /> اسأل المساعد الذكي
            </Button>
            <Button onClick={() => setActive('noc')} variant="outline" className="border-gold/30 hover:border-gold">
              <Activity className="w-4 h-4 ml-2" /> مراقبة الشبكة
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`stat-card group cursor-pointer ${c.glow || ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className="text-xl font-bold text-foreground truncate">{c.value}</p>
              {c.sub && <p className="text-[10px] text-muted-foreground mt-1">{c.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="glass-strong border-gold-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gold-text">
              <Sparkles className="w-5 h-5" /> تنبيهات وتوصيات ذكية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((ins, i) => (
                <div key={i} className={`glass-card rounded-xl p-4 border ${
                  ins.type === 'critical' ? 'border-red-500/40' :
                  ins.type === 'warning' ? 'border-amber-500/40' :
                  ins.type === 'success' ? 'border-emerald-500/40' : 'border-cyan-500/40'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ins.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1">{ins.title}</h4>
                      <p className="text-xs text-muted-foreground">{ins.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 glass-strong border-gold-soft">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BarChart className="w-4 h-4 text-gold" /> مبيعات آخر 7 أيام</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.salesChart}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,215,0,0.1)" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="sales" stroke="#FFD700" fillOpacity={1} fill="url(#gold)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong border-gold-soft">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Boxes className="w-4 h-4 text-gold" /> منتجات على وشك النفاد</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">المخزون بحالة ممتازة ✓</p>
            ) : (
              <div className="space-y-3">
                {stats.lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.image}</span>
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                    <Badge variant="destructive">{p.stock} متبقي</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ POS ============
function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customer, setCustomer] = useState('');
  const [showInvoice, setShowInvoice] = useState(null);
  const barcodeRef = useRef(null);

  useEffect(() => { api('products').then(setProducts); }, []);

  const filtered = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search) || p.barcode?.includes(search))
  , [products, search]);

  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  const addToCart = (p) => {
    if (p.stock <= 0) { toast.error('المنتج نفد من المخزون'); return; }
    setCart(prev => {
      const ex = prev.find(x => x.id === p.id);
      if (ex) return prev.map(x => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const checkout = async () => {
    if (cart.length === 0) { toast.error('السلة فارغة'); return; }
    const r = await api('pos/checkout', { method: 'POST', body: JSON.stringify({ items: cart, discount: Number(discount), paymentMethod, customer: customer || 'زبون نقدي' }) });
    if (r.error) { toast.error(r.error); return; }
    toast.success('تم إصدار الفاتورة بنجاح');
    setShowInvoice(r);
    setCart([]); setDiscount(0); setCustomer('');
    api('products').then(setProducts);
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const code = barcodeRef.current.value.trim();
    if (!code) return;
    const p = await api(`products/barcode/${code}`);
    if (p.error) toast.error(p.error);
    else { addToCart(p); barcodeRef.current.value = ''; }
  };

  return (
    <div className="max-w-[1600px] mx-auto grid lg:grid-cols-3 gap-4 h-full">
      {/* Products */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="glass-strong border-gold-soft">
          <CardContent className="pt-6 space-y-3">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gold" />
                <Input ref={barcodeRef} placeholder="امسح الباركود أو أدخله..." className="pr-10 bg-input/30 border-gold/20" autoFocus />
              </div>
              <Button type="submit" className="btn-neon">إضافة</Button>
            </form>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو SKU..." className="pr-10 bg-input/30 border-gold/20" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="glass-card rounded-xl p-3 cursor-pointer hover:border-gold/50 hover:scale-105 transition-all">
              <div className="text-4xl text-center mb-2">{p.image || '📦'}</div>
              <p className="text-xs font-semibold truncate">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">{p.sku}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-gold">{fmt(p.price)}</span>
                <Badge variant={p.stock <= p.lowStockAlert ? 'destructive' : 'secondary'} className="text-[9px]">{p.stock}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart */}
      <Card className="glass-strong border-gold-soft flex flex-col max-h-[calc(100vh-150px)]">
        <CardHeader className="pb-3 border-b border-gold-soft">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-gold" /> السلة</span>
            <Badge className="bg-gold text-background">{cart.length}</Badge>
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 px-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">السلة فارغة - اضغط على منتج للإضافة</p>
            </div>
          ) : (
            <div className="space-y-2 py-3">
              {cart.map((it, i) => (
                <div key={i} className="glass-card rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{it.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCart(c => c.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setCart(c => c.map((x, idx) => idx === i ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))}>-</Button>
                      <span className="w-8 text-center text-sm">{it.quantity}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => setCart(c => c.map((x, idx) => idx === i ? { ...x, quantity: x.quantity + 1 } : x))}>+</Button>
                    </div>
                    <span className="text-sm font-bold text-gold">{fmt(it.price * it.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-gold-soft p-4 space-y-3">
          <Input placeholder="اسم الزبون (اختياري)" value={customer} onChange={e => setCustomer(e.target.value)} className="bg-input/30 border-gold/20" />
          <div className="flex gap-2">
            <Input type="number" placeholder="خصم" value={discount} onChange={e => setDiscount(e.target.value)} className="bg-input/30 border-gold/20" />
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقد</SelectItem>
                <SelectItem value="card">بطاقة</SelectItem>
                <SelectItem value="transfer">حوالة</SelectItem>
                <SelectItem value="debt">آجل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>المجموع الفرعي:</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>الخصم:</span><span>-{fmt(discount || 0)}</span></div>
            <div className="flex justify-between text-lg font-bold gold-text"><span>الإجمالي:</span><span>{fmtCurrency(total)}</span></div>
          </div>
          <Button onClick={checkout} className="w-full btn-gold h-12 text-base">
            <Receipt className="w-4 h-4 ml-2" /> إصدار الفاتورة
          </Button>
        </div>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={!!showInvoice} onOpenChange={() => setShowInvoice(null)}>
        <DialogContent className="glass-strong border-gold/40">
          <DialogHeader><DialogTitle className="gold-text text-center text-xl">فاتورة مبيعات</DialogTitle></DialogHeader>
          {showInvoice && (
            <div className="space-y-3 font-mono text-sm">
              <div className="text-center border-b border-gold-soft pb-2">
                <p className="text-lg font-bold gold-text">مركز الغزلان</p>
                <p className="text-xs text-muted-foreground">رقم الفاتورة: {showInvoice.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">{new Date(showInvoice.createdAt).toLocaleString('ar-IQ')}</p>
              </div>
              <div className="text-xs">الزبون: {showInvoice.customer}</div>
              <div className="border-t border-b border-gold-soft py-2 space-y-1">
                {showInvoice.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{it.name} × {it.quantity}</span>
                    <span>{fmt(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>المجموع:</span><span>{fmt(showInvoice.subtotal)}</span></div>
                <div className="flex justify-between"><span>الخصم:</span><span>{fmt(showInvoice.discount)}</span></div>
                <div className="flex justify-between text-base font-bold gold-text border-t border-gold-soft pt-1"><span>الإجمالي:</span><span>{fmtCurrency(showInvoice.total)}</span></div>
              </div>
              <p className="text-center text-xs text-muted-foreground">شكراً لزيارتكم 🙏</p>
              <Button onClick={() => window.print()} className="w-full btn-neon">طباعة</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ PRODUCTS ============
function Products() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', barcode: '', category: 'accessories', price: 0, cost: 0, stock: 0, lowStockAlert: 5, image: '📦' });

  const load = () => api('products').then(setItems);
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  const save = async () => {
    if (!form.name) { toast.error('الاسم مطلوب'); return; }
    if (editing) {
      await api(`products/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...form, price: Number(form.price), cost: Number(form.cost), stock: Number(form.stock), lowStockAlert: Number(form.lowStockAlert) }) });
      toast.success('تم التحديث');
    } else {
      await api('products', { method: 'POST', body: JSON.stringify({ ...form, price: Number(form.price), cost: Number(form.cost), stock: Number(form.stock), lowStockAlert: Number(form.lowStockAlert) }) });
      toast.success('تمت الإضافة');
    }
    setOpen(false); setEditing(null);
    setForm({ name: '', sku: '', barcode: '', category: 'accessories', price: 0, cost: 0, stock: 0, lowStockAlert: 5, image: '📦' });
    load();
  };

  const remove = async (id) => {
    await api(`products/${id}`, { method: 'DELETE' });
    toast.success('تم الحذف'); load();
  };

  const startEdit = (p) => { setEditing(p); setForm(p); setOpen(true); };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold gold-text">المنتجات والمخزون</h1>
        <div className="flex gap-2 flex-wrap">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              <SelectItem value="phones">الهواتف</SelectItem>
              <SelectItem value="accessories">الإكسسوارات</SelectItem>
              <SelectItem value="spare_parts">قطع الغيار</SelectItem>
              <SelectItem value="cameras">الكاميرات</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditing(null); setForm({ name: '', sku: '', barcode: '', category: 'accessories', price: 0, cost: 0, stock: 0, lowStockAlert: 5, image: '📦' }); setOpen(true); }} className="btn-gold">
            <Plus className="w-4 h-4 ml-1" /> منتج جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(p => (
          <Card key={p.id} className="glass-card border-gold-soft hover:border-gold/50 transition-all group">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="text-5xl">{p.image}</div>
                <Badge variant={p.stock <= p.lowStockAlert ? 'destructive' : 'secondary'}>{p.stock} قطعة</Badge>
              </div>
              <div>
                <h3 className="font-bold text-sm">{p.name}</h3>
                <p className="text-xs text-muted-foreground">SKU: {p.sku} · {p.barcode}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gold-soft">
                <div>
                  <p className="text-xs text-muted-foreground">السعر</p>
                  <p className="text-sm font-bold gold-text">{fmt(p.price)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(p)}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-500" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40 max-w-lg">
          <DialogHeader><DialogTitle className="gold-text">{editing ? 'تعديل المنتج' : 'منتج جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>اسم المنتج</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الباركود</Label><Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div className="col-span-2"><Label>الفئة</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phones">📱 الهواتف</SelectItem>
                  <SelectItem value="accessories">🎧 الإكسسوارات</SelectItem>
                  <SelectItem value="spare_parts">🔧 قطع الغيار</SelectItem>
                  <SelectItem value="cameras">📹 الكاميرات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>سعر البيع</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>سعر التكلفة</Label><Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الكمية</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>تنبيه نقص</Label><Input type="number" value={form.lowStockAlert} onChange={e => setForm({ ...form, lowStockAlert: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div className="col-span-2"><Label>الإيموجي</Label><Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="📱" className="bg-input/30 border-gold/20" /></div>
          </div>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SUBSCRIBERS ============
function Subscribers() {
  const [items, setItems] = useState([]);
  const [zones, setZones] = useState([]);
  const [agents, setAgents] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [networkFilter, setNetworkFilter] = useState('all');
  const [fatFilter, setFatFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activatingSub, setActivatingSub] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', username: '', address: '', zoneId: '', networkId: '', fatNumber: '', agentId: '', package: '50 Mbps', fee: 35000, ipAddress: '', macAddress: '', status: 'active', debt: 0, dueDate: '', userLat: 33.31, userLng: 44.40, cabinetLat: 33.31, cabinetLng: 44.40 });

  const load = async () => {
    const [s, z, a, n, p] = await Promise.all([
      api('subscribers'), api('zones'), api('agents'), api('networks'), api('packages')
    ]);
    setItems(s); setZones(z); setAgents(a); setNetworks(n); setPackages(p);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    (statusFilter === 'all' || i.status === statusFilter) &&
    (zoneFilter === 'all' || i.zoneId === zoneFilter) &&
    (agentFilter === 'all' || i.agentId === agentFilter) &&
    (networkFilter === 'all' || i.networkId === networkFilter) &&
    (!fatFilter || (i.fatNumber || '').toLowerCase().includes(fatFilter.toLowerCase())) &&
    (!search ||
      i.name?.includes(search) ||
      i.username?.toLowerCase().includes(search.toLowerCase()) ||
      i.phone?.includes(search) ||
      i.ipAddress?.includes(search) ||
      i.zoneNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.fatNumber?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const save = async () => {
    const zone = zones.find(z => z.id === form.zoneId);
    const network = networks.find(n => n.id === form.networkId);
    const agent = agents.find(a => a.id === form.agentId);
    const payload = {
      ...form,
      zoneName: zone?.name,
      zoneNumber: zone?.number,
      fatNumber: network?.number || form.fatNumber,
      agentName: agent?.name,
      fee: Number(form.fee),
      debt: Number(form.debt),
      userLat: form.userLat ? Number(form.userLat) : null,
      userLng: form.userLng ? Number(form.userLng) : null,
      cabinetLat: form.cabinetLat ? Number(form.cabinetLat) : null,
      cabinetLng: form.cabinetLng ? Number(form.cabinetLng) : null,
    };
    if (editing) await api(`subscribers/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('subscribers', { method: 'POST', body: JSON.stringify(payload) });
    toast.success('تم الحفظ'); setOpen(false); setEditing(null); load();
  };
  const remove = async (id) => { await api(`subscribers/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); load(); };
  const startEdit = (s) => { setEditing(s); setForm({ ...s, userLat: s.userLat || 33.31, userLng: s.userLng || 44.40, cabinetLat: s.cabinetLat || 33.31, cabinetLng: s.cabinetLng || 44.40 }); setOpen(true); };

  const activeCount = items.filter(i => i.status === 'active').length;
  const totalDebt = items.reduce((s, x) => s + (x.debt || 0), 0);
  const monthlyIncome = items.filter(i => i.status === 'active').reduce((s, x) => s + (x.fee || 0), 0);

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setZoneFilter('all'); setAgentFilter('all'); setNetworkFilter('all'); setFatFilter(''); };
  const hasActiveFilters = search || statusFilter !== 'all' || zoneFilter !== 'all' || agentFilter !== 'all' || networkFilter !== 'all' || fatFilter;

  const formZoneNetworks = networks.filter(n => !form.zoneId || n.zoneId === form.zoneId);
  const filterZoneNetworks = networks.filter(n => zoneFilter === 'all' || n.zoneId === zoneFilter);

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold gold-text">مشتركو الإنترنت</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', phone: '', username: '', address: '', zoneId: zones[0]?.id || '', networkId: '', fatNumber: '', agentId: agents[0]?.id || '', package: '50 Mbps', fee: 35000, ipAddress: '', macAddress: '', status: 'active', debt: 0, dueDate: '', userLat: 33.31, userLng: 44.40, cabinetLat: 33.31, cabinetLng: 44.40 }); setOpen(true); }} className="btn-gold">
          <Plus className="w-4 h-4 ml-1" /> مشترك جديد
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي المشتركين</p><p className="text-2xl font-bold gold-text">{items.length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">نشط</p><p className="text-2xl font-bold text-emerald-400">{activeCount}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">الدخل الشهري</p><p className="text-xl font-bold neon-text">{fmtCurrency(monthlyIncome)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي الديون</p><p className="text-xl font-bold text-red-400">{fmtCurrency(totalDebt)}</p></div>
      </div>

      <Card className="glass-strong border-gold-soft">
        <CardContent className="pt-6 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث شامل: اسم/يوزر/هاتف/IP/زون/فاتة..." className="pr-10 bg-input/30 border-gold/20" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 rounded-xl bg-gold/5 border border-gold-soft">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">رقم الزون</Label>
              <Select value={zoneFilter} onValueChange={(v) => { setZoneFilter(v); setNetworkFilter('all'); }}>
                <SelectTrigger className="bg-input/30 border-gold/20 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {zones.map(z => <SelectItem key={z.id} value={z.id}><span className="font-mono text-gold">{z.number}</span> · {z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">الشبكة/الفاتة</Label>
              <Select value={networkFilter} onValueChange={setNetworkFilter}>
                <SelectTrigger className="bg-input/30 border-gold/20 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="all">الكل</SelectItem>
                  {filterZoneNetworks.map(n => <SelectItem key={n.id} value={n.id}><span className="font-mono text-purple-400">{n.number}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">رقم الفاتة (نص)</Label>
              <Input value={fatFilter} onChange={e => setFatFilter(e.target.value)} placeholder="F-01" className="bg-input/30 border-gold/20 h-9 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">الوكيل</Label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="bg-input/30 border-gold/20 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">الحالة</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-input/30 border-gold/20 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="suspended">موقف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" size="sm" disabled={!hasActiveFilters} className="w-full h-9 text-xs border-gold/30 disabled:opacity-40">
                <X className="w-3 h-3 ml-1" /> مسح
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">عدد النتائج: <span className="text-gold font-bold">{filtered.length}</span> من {items.length}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-soft text-right text-xs text-muted-foreground">
                  <th className="p-2">المشترك / اليوزر</th><th>الهاتف</th><th>الباقة</th><th>الزون</th><th>الفاتة</th><th>الوكيل</th><th>IP</th><th>الحالة</th><th>ينتهي</th><th>الدين</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="11" className="text-center py-8 text-muted-foreground">لا توجد نتائج 🔍</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="border-b border-gold-soft/30 hover:bg-gold/5">
                    <td className="p-2">
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400">@{s.username || '—'}</div>
                    </td>
                    <td className="text-xs">{s.phone}</td>
                    <td><Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">{s.package}</Badge></td>
                    <td><span className="font-mono text-xs text-gold">{s.zoneNumber || '—'}</span></td>
                    <td><Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-[10px]">{s.fatNumber || '—'}</Badge></td>
                    <td className="text-[10px] text-muted-foreground">{s.agentName || '—'}</td>
                    <td className="text-xs font-mono">{s.ipAddress}</td>
                    <td><Badge className={s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>{s.status === 'active' ? 'نشط' : 'موقف'}</Badge></td>
                    <td className="text-[10px] text-muted-foreground">{s.dueDate || '—'}</td>
                    <td className={s.debt > 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}>{fmt(s.debt)}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => setActivatingSub(s)} className="h-7 text-[10px] btn-gold px-2"><Zap className="w-3 h-3 ml-1" /> تفعيل</Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}><Edit2 className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-500" onClick={() => remove(s.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="gold-text">{editing ? 'تعديل المشترك' : 'مشترك جديد'}</DialogTitle></DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-3 bg-input/30">
              <TabsTrigger value="basic">معلومات أساسية</TabsTrigger>
              <TabsTrigger value="network">الشبكة</TabsTrigger>
              <TabsTrigger value="location">المواقع GPS</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="grid grid-cols-2 gap-3 mt-3">
              <div className="col-span-2"><Label>الاسم</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-input/30 border-gold/20" /></div>
              <div><Label>اليوزر</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="user_1234" className="bg-input/30 border-gold/20 font-mono" /></div>
              <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-input/30 border-gold/20" /></div>
              <div className="col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="bg-input/30 border-gold/20" /></div>
              <div><Label>الباقة</Label>
                <Select value={form.package} onValueChange={v => setForm({ ...form, package: v, fee: v === '25 Mbps' ? 25000 : v === '50 Mbps' ? 35000 : v === '100 Mbps' ? 50000 : 75000 })}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25 Mbps">25 Mbps</SelectItem>
                    <SelectItem value="50 Mbps">50 Mbps</SelectItem>
                    <SelectItem value="100 Mbps">100 Mbps</SelectItem>
                    <SelectItem value="200 Mbps">200 Mbps</SelectItem>
                    <SelectItem value="500 Mbps">500 Mbps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الرسوم الشهرية</Label><Input type="number" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} className="bg-input/30 border-gold/20" /></div>
              <div><Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="suspended">موقف</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>الدين</Label><Input type="number" value={form.debt} onChange={e => setForm({ ...form, debt: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            </TabsContent>
            <TabsContent value="network" className="grid grid-cols-2 gap-3 mt-3">
              <div><Label>الوكيل</Label>
                <Select value={form.agentId} onValueChange={v => setForm({ ...form, agentId: v })}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue placeholder="اختر وكيل" /></SelectTrigger>
                  <SelectContent>{agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>الزون</Label>
                <Select value={form.zoneId} onValueChange={v => setForm({ ...form, zoneId: v, networkId: '' })}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue placeholder="اختر زون" /></SelectTrigger>
                  <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}><span className="font-mono text-gold">{z.number}</span> · {z.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>الشبكة / الفاتة</Label>
                <Select value={form.networkId} onValueChange={v => { const n = networks.find(x => x.id === v); setForm({ ...form, networkId: v, fatNumber: n?.number || '', cabinetLat: n?.lat || form.cabinetLat, cabinetLng: n?.lng || form.cabinetLng }); }}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue placeholder="اختر فاتة" /></SelectTrigger>
                  <SelectContent className="max-h-80">{formZoneNetworks.map(n => <SelectItem key={n.id} value={n.id}><span className="font-mono text-purple-400">{n.number}</span> · {n.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>IP Address</Label><Input value={form.ipAddress} onChange={e => setForm({ ...form, ipAddress: e.target.value })} placeholder="10.10.1.1" className="bg-input/30 border-gold/20 font-mono" /></div>
              <div><Label>MAC Address</Label><Input value={form.macAddress} onChange={e => setForm({ ...form, macAddress: e.target.value })} className="bg-input/30 border-gold/20 font-mono" /></div>
            </TabsContent>
            <TabsContent value="location" className="grid grid-cols-2 gap-3 mt-3">
              <div className="col-span-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> موقع المشترك (اليوز)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[10px]">خط العرض (Lat)</Label><Input type="number" step="0.000001" value={form.userLat} onChange={e => setForm({ ...form, userLat: e.target.value })} className="bg-input/30 border-gold/20 font-mono text-xs" /></div>
                  <div><Label className="text-[10px]">خط الطول (Lng)</Label><Input type="number" step="0.000001" value={form.userLng} onChange={e => setForm({ ...form, userLng: e.target.value })} className="bg-input/30 border-gold/20 font-mono text-xs" /></div>
                </div>
                <Button size="sm" type="button" onClick={() => navigator.geolocation?.getCurrentPosition(p => setForm(f => ({ ...f, userLat: p.coords.latitude, userLng: p.coords.longitude })))} className="mt-2 w-full text-[10px] h-7 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30">
                  <MapPin className="w-3 h-3 ml-1" /> استخدم موقعي الحالي
                </Button>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <p className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1"><Plug className="w-3 h-3" /> موقع الكابينة / الفاتة</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[10px]">خط العرض (Lat)</Label><Input type="number" step="0.000001" value={form.cabinetLat} onChange={e => setForm({ ...form, cabinetLat: e.target.value })} className="bg-input/30 border-gold/20 font-mono text-xs" /></div>
                  <div><Label className="text-[10px]">خط الطول (Lng)</Label><Input type="number" step="0.000001" value={form.cabinetLng} onChange={e => setForm({ ...form, cabinetLng: e.target.value })} className="bg-input/30 border-gold/20 font-mono text-xs" /></div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">💡 يتم تعبئته تلقائياً عند اختيار الفاتة</p>
              </div>
              {(form.userLat && form.userLng) && (
                <a href={`https://www.openstreetmap.org/?mlat=${form.userLat}&mlon=${form.userLng}#map=17/${form.userLat}/${form.userLng}`} target="_blank" rel="noreferrer" className="col-span-2 text-center text-xs text-cyan-400 underline hover:text-cyan-300">🗺️ عرض موقع المشترك على الخريطة</a>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ActivationDialog
        subscriber={activatingSub}
        packages={packages}
        agents={agents}
        onClose={() => setActivatingSub(null)}
        onDone={() => { setActivatingSub(null); load(); }}
      />
    </div>
  );
}

// ============ ACTIVATION DIALOG ============
function ActivationDialog({ subscriber, packages, agents, onClose, onDone }) {
  const [pkgId, setPkgId] = useState('');
  const [speed, setSpeed] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [durationMonths, setDurationMonths] = useState(1);
  const [agentId, setAgentId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (subscriber) {
      setPkgId(''); setSpeed(subscriber.package || ''); setAmount(subscriber.fee || 0);
      setPaymentMethod('cash'); setDurationMonths(1);
      setAgentId(subscriber.agentId || (agents[0]?.id) || '');
      setNotes(''); setResult(null);
    }
  }, [subscriber, agents]);

  if (!subscriber) return null;

  const onPkgChange = (id) => {
    setPkgId(id);
    const p = packages.find(x => x.id === id);
    if (p) { setSpeed(p.speed); setAmount(p.monthlyFee * durationMonths); }
  };

  const onDurationChange = (m) => {
    setDurationMonths(Number(m));
    const p = packages.find(x => x.id === pkgId);
    if (p) setAmount(p.monthlyFee * Number(m));
  };

  const endDate = new Date(Date.now() + durationMonths * 30 * 86400000).toLocaleDateString('ar-IQ');

  const submit = async () => {
    setLoading(true);
    const r = await api(`subscribers/${subscriber.id}/activate`, {
      method: 'POST',
      body: JSON.stringify({ packageId: pkgId, speed, amount: Number(amount), paymentMethod, durationMonths, agentId: agentId || null, notes }),
    });
    setLoading(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success('✅ تم التفعيل بنجاح');
    setResult(r);
  };

  return (
    <Dialog open={!!subscriber} onOpenChange={(o) => { if (!o) { onClose(); if (result) onDone(); } }}>
      <DialogContent className="glass-strong border-gold/40 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gold-text flex items-center gap-2">
            <Zap className="w-5 h-5" /> تفعيل اشتراك - {subscriber.name}
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <>
            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs space-y-1">
              <p><strong>المشترك:</strong> {subscriber.name} · <span className="font-mono text-cyan-400">@{subscriber.username}</span></p>
              <p><strong>الهاتف:</strong> {subscriber.phone} · <strong>الزون:</strong> {subscriber.zoneName} · <strong>الفاتة:</strong> {subscriber.fatNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>اختر الباقة</Label>
                <Select value={pkgId} onValueChange={onPkgChange}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue placeholder="اختر باقة" /></SelectTrigger>
                  <SelectContent>
                    {packages.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-bold text-gold">{p.name}</span> · {p.speed} · {p.monthlyFee.toLocaleString()} د.ع
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>السرعة</Label><Input value={speed} onChange={e => setSpeed(e.target.value)} placeholder="50 Mbps" className="bg-input/30 border-gold/20" /></div>
              <div>
                <Label>المدة</Label>
                <Select value={String(durationMonths)} onValueChange={onDurationChange}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">شهر واحد</SelectItem>
                    <SelectItem value="3">3 أشهر</SelectItem>
                    <SelectItem value="6">6 أشهر</SelectItem>
                    <SelectItem value="12">سنة كاملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>المبلغ الإجمالي</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="bg-input/30 border-gold/20 text-lg font-bold gold-text" /></div>
              <div>
                <Label>طريقة الدفع</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 كاش</SelectItem>
                    <SelectItem value="master">💳 ماستر كارد</SelectItem>
                    <SelectItem value="fastpay">⚡ فاست باي</SelectItem>
                    <SelectItem value="transfer">🏦 تحويل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>الوكيل</Label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue placeholder="اختر الوكيل" /></SelectTrigger>
                  <SelectContent>
                    {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name} (عمولة {a.commission}%)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>ملاحظات</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-input/30 border-gold/20 h-16" placeholder="اختياري..." /></div>
              <div className="col-span-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400">
                ✅ تاريخ الانتهاء التلقائي: <strong className="text-emerald-300">{endDate}</strong>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={submit} disabled={loading || !amount} className="btn-gold w-full h-12 text-base">
                {loading ? 'جاري التفعيل...' : <><Zap className="w-4 h-4 ml-2" /> تفعيل الاشتراك وإرسال إشعار</>}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
              <h3 className="text-lg font-bold text-emerald-400">تم التفعيل بنجاح</h3>
              <p className="text-xs text-muted-foreground">تم حفظ التفعيل في السجل وإضافة رسالة واتساب للطابور</p>
            </div>
            <div className="p-3 rounded-lg bg-input/30 border border-gold-soft">
              <p className="text-[10px] text-muted-foreground mb-2">📱 رسالة الواتساب المرسلة:</p>
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{result.whatsappMessage}</pre>
            </div>
            <DialogFooter className="gap-2">
              <Button onClick={() => { navigator.clipboard?.writeText(result.whatsappMessage); toast.success('تم نسخ الرسالة'); }} variant="outline" className="border-gold/30">نسخ الرسالة</Button>
              <Button onClick={() => { onClose(); onDone(); }} className="btn-gold flex-1">إغلاق</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


// ============ ZONES ============
function Zones() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', lat: 33.3, lng: 44.4, status: 'online', fats: 1, utilization: 50 });

  const load = () => api('zones').then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...form, fats: Number(form.fats), utilization: Number(form.utilization), lat: Number(form.lat), lng: Number(form.lng) };
    if (editing) await api(`zones/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('zones', { method: 'POST', body: JSON.stringify(payload) });
    toast.success('تم الحفظ'); setOpen(false); setEditing(null); load();
  };
  const remove = async (id) => { await api(`zones/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); load(); };
  const startEdit = (z) => { setEditing(z); setForm(z); setOpen(true); };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gold-text">الزونات والشبكات</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', location: '', lat: 33.3, lng: 44.4, status: 'online', fats: 1, utilization: 50 }); setOpen(true); }} className="btn-gold">
          <Plus className="w-4 h-4 ml-1" /> زون جديد
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(z => (
          <Card key={z.id} className={`glass-card border ${z.status === 'online' ? 'border-emerald-500/30' : z.status === 'warning' ? 'border-amber-500/40' : 'border-red-500/40'} hover:scale-[1.02] transition-all`}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{z.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {z.location}</p>
                </div>
                <Badge className={
                  z.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  z.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }>
                  {z.status === 'online' ? '🟢 متصل' : z.status === 'warning' ? '🟡 تحذير' : '🔴 مفصول'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="glass-card rounded-lg p-2"><p className="text-[10px] text-muted-foreground">مشتركين</p><p className="text-lg font-bold gold-text">{z.subscribers}</p></div>
                <div className="glass-card rounded-lg p-2"><p className="text-[10px] text-muted-foreground">فاتات</p><p className="text-lg font-bold neon-text">{z.fats}</p></div>
                <div className="glass-card rounded-lg p-2"><p className="text-[10px] text-muted-foreground">الاستهلاك</p><p className={`text-lg font-bold ${z.utilization > 85 ? 'text-red-400' : 'text-emerald-400'}`}>{z.utilization}%</p></div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">نسبة الضغط</span><span>{z.utilization}%</span></div>
                <Progress value={z.utilization} className="h-2" />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gold-soft">
                <Button size="sm" variant="outline" className="flex-1 border-gold/30" onClick={() => startEdit(z)}><Edit2 className="w-3 h-3 ml-1" />تعديل</Button>
                <Button size="sm" variant="outline" className="border-red-500/30 hover:bg-red-500/10" onClick={() => remove(z.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40">
          <DialogHeader><DialogTitle className="gold-text">{editing ? 'تعديل الزون' : 'زون جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>اسم الزون</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div className="col-span-2"><Label>الموقع</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>خط العرض</Label><Input type="number" step="0.0001" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>خط الطول</Label><Input type="number" step="0.0001" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="online">متصل</SelectItem><SelectItem value="warning">تحذير</SelectItem><SelectItem value="offline">مفصول</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>عدد الفاتات</Label><Input type="number" value={form.fats} onChange={e => setForm({ ...form, fats: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div className="col-span-2"><Label>الاستهلاك (%)</Label><Input type="number" value={form.utilization} onChange={e => setForm({ ...form, utilization: e.target.value })} className="bg-input/30 border-gold/20" /></div>
          </div>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ NOC - Network Operations Center ============
function NOC() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const fetch = () => api('noc/status').then(setData);
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, []);

  if (!data) return <LoadingScreen />;

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold gold-text flex items-center gap-2"><Activity className="w-6 h-6 animate-pulse" /> مركز عمليات الشبكة - LIVE</h1>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-2"></span> تحديث مباشر كل 5 ثوان
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">اتصالات نشطة</p><p className="text-2xl font-bold neon-text">{data.activeConnections}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي الترافيك</p><p className="text-2xl font-bold gold-text">{fmt(data.totalTraffic)} Mbps</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">الزونات</p><p className="text-2xl font-bold">{data.zones.length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">تنبيهات نشطة</p><p className="text-2xl font-bold text-red-400">{data.alerts.length}</p></div>
      </div>

      {data.alerts.length > 0 && (
        <Card className="glass-strong border-red-500/30">
          <CardHeader><CardTitle className="text-red-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> تنبيهات حرجة</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg border ${a.type === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'} flex items-center justify-between`}>
                  <span className="text-sm">{a.message}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.time).toLocaleTimeString('ar-IQ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {data.zones.map(z => (
          <Card key={z.id} className={`glass-card border ${z.status === 'online' ? 'border-emerald-500/30' : z.status === 'warning' ? 'border-amber-500/30' : 'border-red-500/30'}`}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${z.status === 'online' ? 'bg-emerald-400' : z.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                  <h3 className="font-bold">{z.name}</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{z.lat.toFixed(4)}°N, {z.lng.toFixed(4)}°E</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="glass-card rounded p-2"><p className="text-[9px] text-muted-foreground">Ping</p><p className="text-sm font-bold neon-text">{z.ping}ms</p></div>
                <div className="glass-card rounded p-2"><p className="text-[9px] text-muted-foreground">Loss</p><p className={`text-sm font-bold ${z.packetLoss > 5 ? 'text-red-400' : 'text-emerald-400'}`}>{z.packetLoss.toFixed(1)}%</p></div>
                <div className="glass-card rounded p-2"><p className="text-[9px] text-muted-foreground">↑ UL</p><p className="text-sm font-bold gold-text">{z.uplink}</p></div>
                <div className="glass-card rounded p-2"><p className="text-[9px] text-muted-foreground">↓ DL</p><p className="text-sm font-bold gold-text">{z.downlink}</p></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">الضغط: {z.utilization}%</span><span>{z.subscribers} مشترك</span></div>
                <Progress value={z.utilization} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ REPAIRS ============
function Repairs() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ customerName: '', phone: '', device: '', imei: '', issue: '', technician: '', status: 'pending', cost: 0, partsCost: 0 });

  const load = () => api('repairs').then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...form, cost: Number(form.cost), partsCost: Number(form.partsCost), receivedAt: form.receivedAt || new Date().toISOString() };
    if (editing) await api(`repairs/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('repairs', { method: 'POST', body: JSON.stringify(payload) });
    toast.success('تم الحفظ'); setOpen(false); setEditing(null); load();
  };
  const remove = async (id) => { await api(`repairs/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); load(); };

  const statusBadge = (s) => ({
    pending: { txt: '⏳ قيد الاستلام', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    in_progress: { txt: '🔧 قيد الإصلاح', cls: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    completed: { txt: '✅ مكتمل', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    delivered: { txt: '📦 مسلّم', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  }[s] || { txt: s, cls: '' });

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gold-text">صيانة الهواتف</h1>
        <Button onClick={() => { setEditing(null); setForm({ customerName: '', phone: '', device: '', imei: '', issue: '', technician: '', status: 'pending', cost: 0, partsCost: 0 }); setOpen(true); }} className="btn-gold">
          <Plus className="w-4 h-4 ml-1" /> استلام جهاز
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(r => {
          const sb = statusBadge(r.status);
          return (
            <Card key={r.id} className="glass-card border-gold-soft hover:border-gold/50 transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">رقم التذكرة</p>
                    <h3 className="text-xl font-black gold-text">{r.ticketNumber}</h3>
                  </div>
                  <Badge className={sb.cls}>{sb.txt}</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>{r.customerName}</strong> · {r.phone}</p>
                  <p className="text-muted-foreground">📱 {r.device}</p>
                  <p className="text-xs font-mono text-muted-foreground">IMEI: {r.imei}</p>
                  <p className="text-xs"><strong>المشكلة:</strong> {r.issue}</p>
                  <p className="text-xs"><strong>الفني:</strong> {r.technician}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gold-soft">
                  <div>
                    <p className="text-[10px] text-muted-foreground">التكلفة</p>
                    <p className="text-sm font-bold gold-text">{fmtCurrency(r.cost)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Select value={r.status} onValueChange={async (v) => { await api(`repairs/${r.id}`, { method: 'PUT', body: JSON.stringify({ status: v }) }); toast.success('تم التحديث'); load(); }}>
                      <SelectTrigger className="h-7 text-xs w-28 bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ قيد الاستلام</SelectItem>
                        <SelectItem value="in_progress">🔧 قيد الإصلاح</SelectItem>
                        <SelectItem value="completed">✅ مكتمل</SelectItem>
                        <SelectItem value="delivered">📦 مسلّم</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-500" onClick={() => remove(r.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40 max-w-lg">
          <DialogHeader><DialogTitle className="gold-text">استلام جهاز للصيانة</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>اسم الزبون</Label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الجهاز</Label><Input value={form.device} onChange={e => setForm({ ...form, device: e.target.value })} placeholder="iPhone 13 Pro" className="bg-input/30 border-gold/20" /></div>
            <div><Label>IMEI</Label><Input value={form.imei} onChange={e => setForm({ ...form, imei: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div className="col-span-2"><Label>وصف العطل</Label><Textarea value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الفني المسؤول</Label><Input value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>تكلفة القطع</Label><Input type="number" value={form.partsCost} onChange={e => setForm({ ...form, partsCost: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div className="col-span-2"><Label>إجمالي التكلفة</Label><Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="bg-input/30 border-gold/20" /></div>
          </div>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">إنشاء تذكرة</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ CAMERAS ============
function Cameras() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client: '', location: '', cameras: 4, type: 'تركيب', value: 0, status: 'pending', startDate: new Date().toISOString().slice(0, 10) });

  const load = () => api('camera-contracts').then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    await api('camera-contracts', { method: 'POST', body: JSON.stringify({ ...form, cameras: Number(form.cameras), value: Number(form.value) }) });
    toast.success('تم إنشاء العقد'); setOpen(false); load();
  };
  const remove = async (id) => { await api(`camera-contracts/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); load(); };

  const totalValue = items.reduce((s, x) => s + (x.value || 0), 0);
  const totalCams = items.reduce((s, x) => s + (x.cameras || 0), 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gold-text">الكاميرات والمراقبة</h1>
        <Button onClick={() => setOpen(true)} className="btn-gold"><Plus className="w-4 h-4 ml-1" /> عقد جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي العقود</p><p className="text-2xl font-bold gold-text">{items.length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">كاميرات منصوبة</p><p className="text-2xl font-bold neon-text">{totalCams}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">القيمة الإجمالية</p><p className="text-xl font-bold text-emerald-400">{fmtCurrency(totalValue)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">عقود نشطة</p><p className="text-2xl font-bold">{items.filter(i => i.status === 'active').length}</p></div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map(c => (
          <Card key={c.id} className="glass-card border-gold-soft hover:border-gold/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Camera className="w-6 h-6 text-white" /></div>
                  <div>
                    <h3 className="font-bold">{c.client}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</p>
                  </div>
                </div>
                <Badge className={c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                  {c.status === 'active' ? 'نشط' : 'معلق'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="glass-card rounded p-2"><p className="text-[10px] text-muted-foreground">عدد الكاميرات</p><p className="font-bold neon-text">{c.cameras}</p></div>
                <div className="glass-card rounded p-2"><p className="text-[10px] text-muted-foreground">النوع</p><p className="text-xs">{c.type}</p></div>
                <div className="glass-card rounded p-2"><p className="text-[10px] text-muted-foreground">القيمة</p><p className="font-bold gold-text text-xs">{fmt(c.value)}</p></div>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-gold-soft">
                <span>📅 {c.startDate}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-500" onClick={() => remove(c.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40">
          <DialogHeader><DialogTitle className="gold-text">عقد كاميرات جديد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>اسم العميل</Label><Input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div className="col-span-2"><Label>الموقع</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>عدد الكاميرات</Label><Input type="number" value={form.cameras} onChange={e => setForm({ ...form, cameras: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>القيمة</Label><Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>نوع الخدمة</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="تركيب">تركيب</SelectItem>
                  <SelectItem value="تركيب + صيانة">تركيب + صيانة</SelectItem>
                  <SelectItem value="تركيب + صيانة سنوية">تركيب + صيانة سنوية</SelectItem>
                  <SelectItem value="صيانة فقط">صيانة فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="pending">معلق</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ EMPLOYEES ============
function Employees() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', phone: '', salary: 500000, kpi: 80, attendance: 'present' });

  const load = () => api('employees').then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    await api('employees', { method: 'POST', body: JSON.stringify({ ...form, salary: Number(form.salary), kpi: Number(form.kpi) }) });
    toast.success('تمت الإضافة'); setOpen(false); load();
  };
  const remove = async (id) => { await api(`employees/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); load(); };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gold-text">الموظفون</h1>
        <Button onClick={() => setOpen(true)} className="btn-gold"><Plus className="w-4 h-4 ml-1" /> موظف جديد</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(e => (
          <Card key={e.id} className="glass-card border-gold-soft">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gold-gradient flex items-center justify-center text-2xl font-black text-background">{e.name[0]}</div>
                <div className="flex-1">
                  <h3 className="font-bold">{e.name}</h3>
                  <p className="text-xs text-muted-foreground">{e.role}</p>
                  <p className="text-xs">{e.phone}</p>
                </div>
                <Badge className={e.attendance === 'present' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : e.attendance === 'late' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                  {e.attendance === 'present' ? 'حاضر' : e.attendance === 'late' ? 'متأخر' : 'غائب'}
                </Badge>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">KPI الأداء</span><span className="font-bold">{e.kpi}%</span></div>
                <Progress value={e.kpi} className="h-2" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gold-soft">
                <div><p className="text-[10px] text-muted-foreground">الراتب</p><p className="text-sm font-bold gold-text">{fmtCurrency(e.salary)}</p></div>
                <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-500" onClick={() => remove(e.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40">
          <DialogHeader><DialogTitle className="gold-text">موظف جديد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>الاسم</Label><Input value={form.name} onChange={ev => setForm({ ...form, name: ev.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الوظيفة</Label><Input value={form.role} onChange={ev => setForm({ ...form, role: ev.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الهاتف</Label><Input value={form.phone} onChange={ev => setForm({ ...form, phone: ev.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الراتب</Label><Input type="number" value={form.salary} onChange={ev => setForm({ ...form, salary: ev.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>KPI %</Label><Input type="number" value={form.kpi} onChange={ev => setForm({ ...form, kpi: ev.target.value })} className="bg-input/30 border-gold/20" /></div>
          </div>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ REPORTS ============
function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api('reports/summary').then(setData); }, []);
  if (!data) return <LoadingScreen />;

  const COLORS = ['#FFD700', '#00D4FF', '#B061FF', '#39FF14', '#FF10F0'];

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <h1 className="text-2xl font-bold gold-text">التقارير والتحليلات</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي الإيرادات</p><p className="text-xl font-bold gold-text">{fmtCurrency(data.totalRevenue)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">مبيعات POS</p><p className="text-xl font-bold neon-text">{fmtCurrency(data.totalSales)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">اشتراكات ISP</p><p className="text-xl font-bold text-emerald-400">{fmtCurrency(data.ispRevenue)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">صيانة</p><p className="text-xl font-bold text-purple-400">{fmtCurrency(data.repairRevenue)}</p></div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass-strong border-gold-soft">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieIcon className="w-4 h-4 text-gold" /> مصادر الإيرادات</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${fmt(e.value)}`}>
                  {data.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,215,0,0.3)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong border-gold-soft">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart className="w-4 h-4 text-gold" /> توزيع المخزون</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RBarChart data={data.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,215,0,0.1)" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,215,0,0.3)' }} />
                <Bar dataKey="value" fill="#00D4FF" radius={[8, 8, 0, 0]} />
              </RBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-strong border-gold-soft">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Box className="w-4 h-4 text-gold" /> قيمة المخزون الإجمالية</CardTitle></CardHeader>
        <CardContent>
          <p className="text-4xl font-black gold-text">{fmtCurrency(data.inventoryValue)}</p>
          <p className="text-sm text-muted-foreground mt-1">القيمة الكلية للمنتجات في المستودع بسعر التكلفة</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ AI ASSISTANT ============
function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'أهلاً! أنا "غزلان AI" - مساعدك الذكي. اسألني أي شيء عن شركتك:\n• تحليل المبيعات والأرباح\n• حالة الشبكة والمشتركين\n• توقعات الأعطال والمخزون\n• اقتراحات للقرارات الاستراتيجية' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(''); setLoading(true);
    try {
      const r = await api('ai/chat', { method: 'POST', body: JSON.stringify({ message: input, history: newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })) }) });
      if (r.error) { toast.error(r.error); setMessages([...newMessages, { role: 'assistant', content: '⚠️ ' + r.error }]); }
      else setMessages([...newMessages, { role: 'assistant', content: r.reply }]);
    } catch (e) {
      toast.error('خطأ في الاتصال');
    }
    setLoading(false);
  };

  const suggestions = [
    'كم عدد المشتركين النشطين؟',
    'ما المنتجات التي بحاجة لإعادة طلب؟',
    'حلل أداء الشبكة وقدم اقتراحات',
    'ما إجمالي الديون المستحقة؟',
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-130px)] flex flex-col">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-3 glass-strong rounded-2xl px-6 py-3 mb-2">
          <Sparkles className="w-6 h-6 text-gold animate-pulse" />
          <h1 className="text-2xl font-black gold-text">غزلان AI</h1>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Online</Badge>
        </div>
        <p className="text-sm text-muted-foreground">مساعد ذكي يعرف بيانات شركتك ويقدم تحليلات فورية</p>
      </div>

      <Card className="glass-strong border-gold-soft flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-neon-gradient' : 'bg-gold-gradient'}`}>
                  {m.role === 'user' ? <span className="text-sm font-bold">أنت</span> : <Bot className="w-5 h-5 text-background" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-3 ${m.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/30' : 'glass-card border border-gold-soft'}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center"><Bot className="w-5 h-5 text-background" /></div>
                <div className="glass-card border border-gold-soft rounded-2xl p-3 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} className="text-xs glass-card border border-gold-soft rounded-full px-3 py-1.5 hover:border-gold/50 transition-colors">{s}</button>
            ))}
          </div>
        )}

        <div className="border-t border-gold-soft p-3 flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="اسأل غزلان AI..." className="bg-input/30 border-gold/20" disabled={loading} />
          <Button onClick={send} className="btn-gold" disabled={loading}><Send className="w-4 h-4" /></Button>
        </div>
      </Card>
    </div>
  );
}

// ============ SETTINGS ============
// ============ SETTINGS PAGE - FULL FUNCTIONAL ============
const SETTINGS_SECTIONS = [
  { key: 'general', label: 'النظام العام', icon: Building2, color: 'from-amber-500 to-yellow-600' },
  { key: 'users', label: 'المستخدمون والصلاحيات', icon: Users, color: 'from-emerald-500 to-teal-600' },
  { key: 'agents', label: 'إعدادات الوكلاء', icon: UserCheck, color: 'from-cyan-500 to-blue-600' },
  { key: 'subscribers', label: 'إعدادات المشتركين', icon: Wifi, color: 'from-purple-500 to-pink-600' },
  { key: 'zones', label: 'الزونات والشبكات', icon: Network, color: 'from-orange-500 to-red-600' },
  { key: 'invoices', label: 'الفواتير والديون', icon: Receipt, color: 'from-indigo-500 to-purple-600' },
  { key: 'packages', label: 'التفعيل والباقات', icon: Zap, color: 'from-pink-500 to-rose-600' },
  { key: 'whatsapp', label: 'إعدادات الواتساب', icon: Phone, color: 'from-green-500 to-emerald-600' },
  { key: 'telegram', label: 'إعدادات التليجرام', icon: Send, color: 'from-sky-500 to-blue-600' },
  { key: 'notifications', label: 'الإشعارات والتنبيهات', icon: Bell, color: 'from-rose-500 to-red-600' },
  { key: 'maps', label: 'الخرائط والمواقع', icon: MapPin, color: 'from-teal-500 to-cyan-600' },
  { key: 'printing', label: 'الطباعة والوصولات', icon: Receipt, color: 'from-violet-500 to-purple-600' },
  { key: 'backup', label: 'النسخ الاحتياطي', icon: HardDrive, color: 'from-fuchsia-500 to-pink-600' },
  { key: 'security', label: 'الأمان وتسجيل الدخول', icon: Activity, color: 'from-red-500 to-orange-600' },
  { key: 'reports', label: 'التقارير والإحصائيات', icon: BarChart3, color: 'from-yellow-500 to-amber-600' },
  { key: 'employees', label: 'الموظفون والمهام', icon: Users, color: 'from-lime-500 to-green-600' },
];

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [activeSection, setActiveSection] = useState('general');
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const d = await api('settings');
    setSettings(d);
    setDraft(d);
  };
  useEffect(() => { load(); }, []);

  if (!settings) return <LoadingScreen />;

  const update = (section, field, value) => {
    setDraft(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };
  const updateNested = (section, subKey, field, value) => {
    setDraft(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subKey]: { ...(prev[section]?.[subKey] || {}), [field]: value }
      }
    }));
  };

  const sectionChanged = JSON.stringify(draft[activeSection]) !== JSON.stringify(settings[activeSection]);

  const saveSection = async () => {
    setSaving(true);
    const r = await api('settings', { method: 'PUT', body: JSON.stringify({ [activeSection]: draft[activeSection] }) });
    setSaving(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success('✅ تم حفظ الإعدادات');
    setSettings(r); setDraft(r);
  };

  const resetSection = async () => {
    if (!confirm('هل تريد إعادة ضبط هذا القسم للقيم الافتراضية؟')) return;
    const r = await api('settings/reset', { method: 'POST', body: JSON.stringify({ section: activeSection }) });
    if (r.error) { toast.error(r.error); return; }
    toast.success('✅ تم إعادة الضبط');
    await load();
  };

  const resetAll = async () => {
    if (!confirm('⚠️ هل أنت متأكد من إعادة ضبط جميع الإعدادات؟')) return;
    const r = await api('settings/reset', { method: 'POST', body: JSON.stringify({}) });
    if (r.error) { toast.error(r.error); return; }
    toast.success('✅ تم إعادة الضبط الكامل');
    await load();
  };

  const testWhatsApp = async () => {
    const r = await api('settings/test/whatsapp', { method: 'POST', body: JSON.stringify({ phone: draft.whatsapp?.managerPhone }) });
    if (r.error) toast.error(r.error); else toast.success(r.message);
  };
  const testTelegram = async () => {
    const r = await api('settings/test/telegram', { method: 'POST', body: JSON.stringify({}) });
    if (r.error) toast.error(r.error); else toast.success(r.message);
  };
  const runBackup = async () => {
    const r = await api('settings/backup/run', { method: 'POST', body: JSON.stringify({}) });
    if (r.error) toast.error(r.error); else { toast.success('✅ تم إنشاء النسخة الاحتياطية'); await load(); }
  };

  const section = SETTINGS_SECTIONS.find(s => s.key === activeSection);

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gold-text flex items-center gap-2"><Settings className="w-6 h-6" /> الإعدادات</h1>
          <p className="text-xs text-muted-foreground mt-1">آخر تحديث: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString('ar-IQ') : 'لم يحدث'}</p>
        </div>
        <Button onClick={resetAll} variant="outline" className="border-red-500/30 hover:bg-red-500/10 text-red-400">
          <Trash2 className="w-4 h-4 ml-1" /> إعادة ضبط الكل
        </Button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar */}
        <Card className="glass-strong border-gold-soft h-fit">
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-1">
                {SETTINGS_SECTIONS.map(s => {
                  const I = s.icon;
                  const isActive = activeSection === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveSection(s.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-all text-sm ${
                        isActive ? 'bg-gold/15 text-gold border-r-2 border-gold' : 'text-muted-foreground hover:bg-gold/5 hover:text-foreground'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 ${isActive ? '' : 'opacity-50'}`}>
                        <I className="w-4 h-4 text-white" />
                      </div>
                      <span className="flex-1 text-right truncate">{s.label}</span>
                      {isActive && <ChevronLeft className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Panel */}
        <Card className="glass-strong border-gold-soft">
          <CardHeader className="border-b border-gold-soft">
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2 gold-text">
                {section && <section.icon className="w-5 h-5" />}
                {section?.label}
              </span>
              <div className="flex gap-2">
                <Button onClick={resetSection} variant="outline" size="sm" className="border-amber-500/30 hover:bg-amber-500/10 text-amber-400">
                  <X className="w-3 h-3 ml-1" /> إعادة ضبط
                </Button>
                <Button onClick={saveSection} disabled={!sectionChanged || saving} size="sm" className="btn-gold">
                  {saving ? 'جاري...' : <><CheckCircle2 className="w-3 h-3 ml-1" /> حفظ التغييرات</>}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-[calc(100vh-300px)] pr-2">
              {activeSection === 'general' && <GeneralSection draft={draft} update={update} />}
              {activeSection === 'users' && <UsersSection draft={draft} update={update} />}
              {activeSection === 'agents' && <AgentsSection draft={draft} update={update} />}
              {activeSection === 'subscribers' && <SubscribersSection draft={draft} update={update} />}
              {activeSection === 'zones' && <ZonesSection draft={draft} update={update} />}
              {activeSection === 'invoices' && <InvoicesSection draft={draft} update={update} />}
              {activeSection === 'packages' && <PackagesSection draft={draft} update={update} />}
              {activeSection === 'whatsapp' && <WhatsAppSection draft={draft} update={update} testWhatsApp={testWhatsApp} />}
              {activeSection === 'telegram' && <TelegramSection draft={draft} update={update} testTelegram={testTelegram} />}
              {activeSection === 'notifications' && <NotificationsSection draft={draft} updateNested={updateNested} />}
              {activeSection === 'maps' && <MapsSection draft={draft} update={update} />}
              {activeSection === 'printing' && <PrintingSection draft={draft} update={update} />}
              {activeSection === 'backup' && <BackupSection draft={draft} update={update} runBackup={runBackup} />}
              {activeSection === 'security' && <SecuritySection draft={draft} update={update} />}
              {activeSection === 'reports' && <ReportsSection draft={draft} update={update} />}
              {activeSection === 'employees' && <EmployeesSection draft={draft} update={update} />}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ SECTION COMPONENTS ============
const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);
const Switch = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between p-3 rounded-lg bg-gold/5 border border-gold-soft cursor-pointer hover:border-gold/30 transition-all">
    <span className="text-sm">{label}</span>
    <div className={`w-11 h-6 rounded-full transition-all relative ${checked ? 'bg-gold' : 'bg-muted'}`} onClick={() => onChange(!checked)}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'right-0.5' : 'right-[22px]'}`}></div>
    </div>
  </label>
);

function GeneralSection({ draft, update }) {
  const g = draft.general || {};
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="اسم الشركة (عربي)"><Input value={g.companyName || ''} onChange={e => update('general', 'companyName', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
      <Field label="Company Name (EN)"><Input value={g.companyNameEn || ''} onChange={e => update('general', 'companyNameEn', e.target.value)} className="bg-input/30 border-gold/20" dir="ltr" /></Field>
      <Field label="الشعار (Emoji)"><Input value={g.logo || ''} onChange={e => update('general', 'logo', e.target.value)} className="bg-input/30 border-gold/20 text-xl" /></Field>
      <Field label="الهاتف"><Input value={g.phone || ''} onChange={e => update('general', 'phone', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
      <Field label="البريد الإلكتروني"><Input value={g.email || ''} onChange={e => update('general', 'email', e.target.value)} className="bg-input/30 border-gold/20" dir="ltr" /></Field>
      <Field label="الموقع الإلكتروني"><Input value={g.website || ''} onChange={e => update('general', 'website', e.target.value)} className="bg-input/30 border-gold/20" dir="ltr" /></Field>
      <Field label="العنوان" hint="عنوان الفرع الرئيسي"><Input value={g.address || ''} onChange={e => update('general', 'address', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
      <Field label="العملة">
        <Select value={g.currency} onValueChange={v => update('general', 'currency', v)}>
          <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="IQD">دينار عراقي (IQD)</SelectItem>
            <SelectItem value="USD">دولار (USD)</SelectItem>
            <SelectItem value="EUR">يورو (EUR)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="رمز العملة"><Input value={g.currencySymbol || ''} onChange={e => update('general', 'currencySymbol', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
      <Field label="المنطقة الزمنية">
        <Select value={g.timezone} onValueChange={v => update('general', 'timezone', v)}>
          <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Asia/Baghdad">بغداد (GMT+3)</SelectItem>
            <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
            <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="اللغة الافتراضية">
        <Select value={g.language} onValueChange={v => update('general', 'language', v)}>
          <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ar">العربية</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ku">کوردی</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="بداية السنة المالية" hint="MM-DD"><Input value={g.fiscalYearStart || ''} onChange={e => update('general', 'fiscalYearStart', e.target.value)} className="bg-input/30 border-gold/20 font-mono" /></Field>
      <div className="md:col-span-2">
        <Field label="الفروع (سطر لكل فرع)">
          <Textarea value={(g.branches || []).join('\n')} onChange={e => update('general', 'branches', e.target.value.split('\n').filter(Boolean))} className="bg-input/30 border-gold/20 h-24" />
        </Field>
      </div>
    </div>
  );
}

function UsersSection({ draft, update }) {
  const u = draft.users || {};
  return (
    <div className="space-y-3">
      <Switch checked={u.requireApproval} onChange={v => update('users', 'requireApproval', v)} label="🔒 يتطلب موافقة المدير لإضافة مستخدمين جدد" />
      <Switch checked={u.allowSelfRegistration} onChange={v => update('users', 'allowSelfRegistration', v)} label="📝 السماح بالتسجيل الذاتي للمستخدمين" />
      <Field label="الدور الافتراضي للمستخدم الجديد">
        <Select value={u.defaultRole} onValueChange={v => update('users', 'defaultRole', v)}>
          <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(u.roles || []).map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <div>
        <Label className="text-xs mb-2 block">الأدوار والصلاحيات</Label>
        <div className="space-y-2">
          {(u.roles || []).map((r, i) => (
            <div key={r.id} className="p-3 rounded-lg bg-gold/5 border border-gold-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{r.name}</span>
                <Badge variant="outline" className="border-gold/30 font-mono text-[10px]">{r.id}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {(r.permissions || []).map(p => <Badge key={p} className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px]">{p}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentsSection({ draft, update }) {
  const a = draft.agents || {};
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="نسبة العمولة الافتراضية %" hint="للوكلاء الجدد"><Input type="number" value={a.defaultCommission || 0} onChange={e => update('agents', 'defaultCommission', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="الحد الأقصى للدين" hint="بالدينار العراقي"><Input type="number" value={a.maxDebt || 0} onChange={e => update('agents', 'maxDebt', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="رابط لوحة الوكيل"><Input value={a.portalUrl || ''} onChange={e => update('agents', 'portalUrl', e.target.value)} className="bg-input/30 border-gold/20 font-mono" dir="ltr" /></Field>
      <Field label="مدة الجلسة (دقيقة)"><Input type="number" value={a.sessionTimeout || 30} onChange={e => update('agents', 'sessionTimeout', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={a.allowSelfActivation} onChange={v => update('agents', 'allowSelfActivation', v)} label="✅ السماح للوكلاء بتفعيل المشتركين بأنفسهم" />
        <Switch checked={a.autoDisableOnDebt} onChange={v => update('agents', 'autoDisableOnDebt', v)} label="🚫 إيقاف الوكيل تلقائياً عند تجاوز حد الدين" />
        <Switch checked={a.requireQRLogin} onChange={v => update('agents', 'requireQRLogin', v)} label="📱 تفعيل تسجيل دخول QR للوكلاء" />
      </div>
    </div>
  );
}

function SubscribersSection({ draft, update }) {
  const s = draft.subscribers || {};
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="الباقة الافتراضية"><Input value={s.defaultPackage || ''} onChange={e => update('subscribers', 'defaultPackage', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
      <Field label="الرسوم الافتراضية"><Input type="number" value={s.defaultFee || 0} onChange={e => update('subscribers', 'defaultFee', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="فترة السماح بعد انتهاء الاشتراك (يوم)" hint="قبل إيقاف المشترك"><Input type="number" value={s.gracePeriodDays || 0} onChange={e => update('subscribers', 'gracePeriodDays', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="حد الدين المسموح"><Input type="number" value={s.debtLimit || 0} onChange={e => update('subscribers', 'debtLimit', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="إشعار قبل انتهاء الاشتراك (يوم)"><Input type="number" value={s.autoNotifyBeforeExpiry || 0} onChange={e => update('subscribers', 'autoNotifyBeforeExpiry', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="نمط اليوزر التلقائي" hint="استخدم {phone4} للأرقام الأخيرة"><Input value={s.usernamePattern || ''} onChange={e => update('subscribers', 'usernamePattern', e.target.value)} className="bg-input/30 border-gold/20 font-mono" dir="ltr" /></Field>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={s.autoSuspendOnExpiry} onChange={v => update('subscribers', 'autoSuspendOnExpiry', v)} label="🚫 إيقاف تلقائي للمشتركين عند انتهاء الاشتراك" />
        <Switch checked={s.requireIMEI} onChange={v => update('subscribers', 'requireIMEI', v)} label="📱 تطلب IMEI عند إضافة مشترك جديد" />
        <Switch checked={s.autoGenerateUsername} onChange={v => update('subscribers', 'autoGenerateUsername', v)} label="🤖 توليد اليوزر تلقائياً" />
      </div>
    </div>
  );
}

function ZonesSection({ draft, update }) {
  const z = draft.zones || {};
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="السعة الافتراضية للفاتة"><Input type="number" value={z.defaultCapacity || 0} onChange={e => update('zones', 'defaultCapacity', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="فترة المراقبة (ثانية)"><Input type="number" value={z.monitoringInterval || 0} onChange={e => update('zones', 'monitoringInterval', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="حد التحذير (%)"><Input type="number" value={z.warningThreshold || 0} onChange={e => update('zones', 'warningThreshold', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="الحد الحرج (%)"><Input type="number" value={z.criticalThreshold || 0} onChange={e => update('zones', 'criticalThreshold', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="مزود الخرائط الافتراضي">
        <Select value={z.defaultMapProvider} onValueChange={v => update('zones', 'defaultMapProvider', v)}>
          <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="osm">OpenStreetMap (مجاني)</SelectItem>
            <SelectItem value="google">Google Maps</SelectItem>
            <SelectItem value="satellite">Satellite View</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Switch checked={z.autoStatusUpdate} onChange={v => update('zones', 'autoStatusUpdate', v)} label="🔄 تحديث حالة الزون تلقائياً حسب الضغط" />
      </div>
    </div>
  );
}

function InvoicesSection({ draft, update }) {
  const i = draft.invoices || {};
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="بادئة رقم الفاتورة"><Input value={i.invoicePrefix || ''} onChange={e => update('invoices', 'invoicePrefix', e.target.value)} className="bg-input/30 border-gold/20 font-mono" /></Field>
      <Field label="رقم البداية"><Input type="number" value={i.startingNumber || 0} onChange={e => update('invoices', 'startingNumber', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="نسبة الضريبة %"><Input type="number" step="0.1" value={i.taxRate || 0} onChange={e => update('invoices', 'taxRate', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="تنبيه الدين بعد (يوم)"><Input type="number" value={i.debtAlertDays || 0} onChange={e => update('invoices', 'debtAlertDays', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <div className="md:col-span-2">
        <Field label="ملاحظة أسفل الفاتورة">
          <Textarea value={i.footerNote || ''} onChange={e => update('invoices', 'footerNote', e.target.value)} className="bg-input/30 border-gold/20 h-20" />
        </Field>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={i.taxEnabled} onChange={v => update('invoices', 'taxEnabled', v)} label="💰 تفعيل احتساب الضريبة" />
        <Switch checked={i.autoReminder} onChange={v => update('invoices', 'autoReminder', v)} label="🔔 إرسال تذكير تلقائي بالديون" />
      </div>
    </div>
  );
}

function PackagesSection({ draft, update }) {
  const p = draft.packages || {};
  const methods = p.enabledPaymentMethods || [];
  const toggle = (m) => {
    const newMethods = methods.includes(m) ? methods.filter(x => x !== m) : [...methods, m];
    update('packages', 'enabledPaymentMethods', newMethods);
  };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="المدة الافتراضية (يوم)"><Input type="number" value={p.defaultDurationDays || 0} onChange={e => update('packages', 'defaultDurationDays', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="نسبة عمولة الوكلاء الافتراضية %"><Input type="number" value={p.defaultProfitShare || 0} onChange={e => update('packages', 'defaultProfitShare', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <div className="md:col-span-2">
        <Label className="text-xs mb-2 block">طرق الدفع المُفعّلة</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: 'cash', label: '💵 كاش' },
            { id: 'master', label: '💳 ماستر' },
            { id: 'fastpay', label: '⚡ فاست باي' },
            { id: 'transfer', label: '🏦 تحويل' },
            { id: 'zaincash', label: '📱 زين كاش' },
            { id: 'asiacell', label: '📱 آسياسيل' },
          ].map(m => (
            <button key={m.id} onClick={() => toggle(m.id)} className={`p-3 rounded-lg border text-sm transition-all ${methods.includes(m.id) ? 'bg-gold/10 border-gold text-gold' : 'bg-input/30 border-gold-soft text-muted-foreground'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={p.allowCustomDuration} onChange={v => update('packages', 'allowCustomDuration', v)} label="📅 السماح بمدة مخصصة عند التفعيل" />
        <Switch checked={p.proRateOnUpgrade} onChange={v => update('packages', 'proRateOnUpgrade', v)} label="💱 حساب النسبة المتبقية عند ترقية الباقة" />
        <Switch checked={p.requireFullPayment} onChange={v => update('packages', 'requireFullPayment', v)} label="💯 يتطلب الدفع الكامل قبل التفعيل" />
      </div>
    </div>
  );
}

function WhatsAppSection({ draft, update, testWhatsApp }) {
  const w = draft.whatsapp || {};
  return (
    <div className="space-y-4">
      <Switch checked={w.enabled} onChange={v => update('whatsapp', 'enabled', v)} label="🟢 تفعيل خدمة الواتساب" />
      {!w.enabled && <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">⚠️ الخدمة غير مفعّلة - الرسائل ستحفظ في الطابور فقط</div>}
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="المزود">
          <Select value={w.provider} onValueChange={v => update('whatsapp', 'provider', v)}>
            <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cloud">WhatsApp Cloud API (Meta)</SelectItem>
              <SelectItem value="ultramsg">UltraMsg</SelectItem>
              <SelectItem value="wati">Wati</SelectItem>
              <SelectItem value="dialog360">360dialog</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="اسم المُرسِل"><Input value={w.senderName || ''} onChange={e => update('whatsapp', 'senderName', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
        <div className="md:col-span-2">
          <Field label="API Token" hint="مفتاح الـ API من المزود"><Input type="password" value={w.apiToken || ''} onChange={e => update('whatsapp', 'apiToken', e.target.value)} className="bg-input/30 border-gold/20 font-mono" dir="ltr" /></Field>
        </div>
        <Field label="Phone Number ID"><Input value={w.phoneNumberId || ''} onChange={e => update('whatsapp', 'phoneNumberId', e.target.value)} className="bg-input/30 border-gold/20 font-mono" dir="ltr" /></Field>
        <Field label="هاتف المدير"><Input value={w.managerPhone || ''} onChange={e => update('whatsapp', 'managerPhone', e.target.value)} className="bg-input/30 border-gold/20 font-mono" /></Field>
      </div>
      <Switch checked={w.sendToManager} onChange={v => update('whatsapp', 'sendToManager', v)} label="📨 إرسال نسخة للمدير في كل عملية" />
      <Button onClick={testWhatsApp} className="btn-neon w-full"><Send className="w-4 h-4 ml-2" /> اختبار إرسال رسالة</Button>
    </div>
  );
}

function TelegramSection({ draft, update, testTelegram }) {
  const t = draft.telegram || {};
  return (
    <div className="space-y-4">
      <Switch checked={t.enabled} onChange={v => update('telegram', 'enabled', v)} label="🟢 تفعيل تليجرام Bot" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Bot Token" hint="من @BotFather"><Input type="password" value={t.botToken || ''} onChange={e => update('telegram', 'botToken', e.target.value)} className="bg-input/30 border-gold/20 font-mono" dir="ltr" /></Field>
        </div>
        <Field label="Chat ID المدير"><Input value={t.managerChatId || ''} onChange={e => update('telegram', 'managerChatId', e.target.value)} className="bg-input/30 border-gold/20 font-mono" dir="ltr" /></Field>
        <Field label="Channel ID (اختياري)"><Input value={t.channelId || ''} onChange={e => update('telegram', 'channelId', e.target.value)} className="bg-input/30 border-gold/20 font-mono" dir="ltr" /></Field>
        <Field label="وقت التقرير اليومي"><Input type="time" value={t.reportTime || '20:00'} onChange={e => update('telegram', 'reportTime', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
      </div>
      <div className="space-y-2">
        <Switch checked={t.sendActivations} onChange={v => update('telegram', 'sendActivations', v)} label="🎉 إرسال إشعار عند كل تفعيل" />
        <Switch checked={t.sendAlerts} onChange={v => update('telegram', 'sendAlerts', v)} label="🚨 إرسال تنبيهات النظام (شبكة، أعطال)" />
        <Switch checked={t.sendDailyReport} onChange={v => update('telegram', 'sendDailyReport', v)} label="📊 إرسال تقرير يومي تلقائي" />
      </div>
      <Button onClick={testTelegram} className="btn-neon w-full"><Send className="w-4 h-4 ml-2" /> اختبار إرسال للمدير</Button>
    </div>
  );
}

function NotificationsSection({ draft, updateNested }) {
  const n = draft.notifications || {};
  const events = [
    { key: 'activation', label: '🎉 تفعيل اشتراك جديد' },
    { key: 'expiry', label: '⏰ انتهاء الاشتراك' },
    { key: 'debt', label: '💰 ديون مستحقة' },
    { key: 'lowStock', label: '📦 نفاد المخزون' },
    { key: 'networkAlert', label: '🚨 تنبيهات الشبكة' },
    { key: 'newSubscriber', label: '👤 مشترك جديد' },
  ];
  const channels = [
    { key: 'whatsapp', label: '📱 واتساب' },
    { key: 'telegram', label: '✈️ تليجرام' },
    { key: 'email', label: '📧 إيميل' },
    { key: 'sms', label: '💬 SMS' },
    { key: 'push', label: '🔔 Push' },
  ];
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold-soft">
              <th className="p-2 text-right text-xs text-muted-foreground">الحدث</th>
              {channels.map(c => <th key={c.key} className="p-2 text-center text-xs text-muted-foreground">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.key} className="border-b border-gold-soft/30 hover:bg-gold/5">
                <td className="p-2 text-xs font-semibold">{e.label}</td>
                {channels.map(c => {
                  const checked = !!n[e.key]?.[c.key];
                  return (
                    <td key={c.key} className="p-2 text-center">
                      <button onClick={() => updateNested('notifications', e.key, c.key, !checked)} className={`w-6 h-6 rounded transition-all ${checked ? 'bg-gold text-background' : 'bg-input/30 border border-gold-soft'}`}>
                        {checked && '✓'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MapsSection({ draft, update }) {
  const m = draft.maps || {};
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="مزود الخرائط">
        <Select value={m.provider} onValueChange={v => update('maps', 'provider', v)}>
          <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="osm">OpenStreetMap</SelectItem>
            <SelectItem value="google">Google Maps</SelectItem>
            <SelectItem value="mapbox">Mapbox</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="مستوى التكبير الافتراضي"><Input type="number" min="5" max="20" value={m.defaultZoom || 12} onChange={e => update('maps', 'defaultZoom', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="خط العرض الافتراضي"><Input type="number" step="0.0001" value={m.defaultLat || 0} onChange={e => update('maps', 'defaultLat', Number(e.target.value))} className="bg-input/30 border-gold/20 font-mono" /></Field>
      <Field label="خط الطول الافتراضي"><Input type="number" step="0.0001" value={m.defaultLng || 0} onChange={e => update('maps', 'defaultLng', Number(e.target.value))} className="bg-input/30 border-gold/20 font-mono" /></Field>
      <div className="md:col-span-2">
        <Field label="Google API Key" hint="اختياري - فقط لخرائط جوجل"><Input type="password" value={m.googleApiKey || ''} onChange={e => update('maps', 'googleApiKey', e.target.value)} className="bg-input/30 border-gold/20 font-mono" dir="ltr" /></Field>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={m.showZones} onChange={v => update('maps', 'showZones', v)} label="📍 عرض الزونات على الخريطة" />
        <Switch checked={m.showNetworks} onChange={v => update('maps', 'showNetworks', v)} label="🔌 عرض الفاتات/الشبكات" />
        <Switch checked={m.showSubscribers} onChange={v => update('maps', 'showSubscribers', v)} label="👥 عرض المشتركين (قد يكون بطيئاً)" />
        <Switch checked={m.clusterMarkers} onChange={v => update('maps', 'clusterMarkers', v)} label="🔵 تجميع العلامات (Cluster)" />
      </div>
    </div>
  );
}

function PrintingSection({ draft, update }) {
  const p = draft.printing || {};
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="حجم الورق">
        <Select value={p.paperSize} onValueChange={v => update('printing', 'paperSize', v)}>
          <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="58mm">حراري 58mm</SelectItem>
            <SelectItem value="80mm">حراري 80mm</SelectItem>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="A5">A5</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="عدد النسخ"><Input type="number" min="1" max="5" value={p.copies || 1} onChange={e => update('printing', 'copies', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <div className="md:col-span-2">
        <Field label="رأس الوصل"><Textarea value={p.receiptHeader || ''} onChange={e => update('printing', 'receiptHeader', e.target.value)} className="bg-input/30 border-gold/20 h-20" /></Field>
      </div>
      <div className="md:col-span-2">
        <Field label="تذييل الوصل"><Textarea value={p.receiptFooter || ''} onChange={e => update('printing', 'receiptFooter', e.target.value)} className="bg-input/30 border-gold/20 h-20" /></Field>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={p.showLogo} onChange={v => update('printing', 'showLogo', v)} label="🏢 إظهار الشعار" />
        <Switch checked={p.showBarcode} onChange={v => update('printing', 'showBarcode', v)} label="📊 إظهار الباركود" />
        <Switch checked={p.showQR} onChange={v => update('printing', 'showQR', v)} label="📱 إظهار QR Code" />
        <Switch checked={p.autoOpenCashDrawer} onChange={v => update('printing', 'autoOpenCashDrawer', v)} label="💵 فتح درج النقود تلقائياً" />
      </div>
    </div>
  );
}

function BackupSection({ draft, update, runBackup }) {
  const b = draft.backup || {};
  return (
    <div className="space-y-4">
      <Switch checked={b.enabled} onChange={v => update('backup', 'enabled', v)} label="🟢 تفعيل النسخ الاحتياطي" />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="الجدولة">
          <Select value={b.schedule} onValueChange={v => update('backup', 'schedule', v)}>
            <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">كل ساعة</SelectItem>
              <SelectItem value="daily">يومي</SelectItem>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="monthly">شهري</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="وقت النسخ"><Input type="time" value={b.time || '03:00'} onChange={e => update('backup', 'time', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
        <Field label="فترة الاحتفاظ (يوم)"><Input type="number" value={b.retentionDays || 30} onChange={e => update('backup', 'retentionDays', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
        <Field label="مكان التخزين">
          <Select value={b.location} onValueChange={v => update('backup', 'location', v)}>
            <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="local">محلي</SelectItem>
              <SelectItem value="s3">Amazon S3</SelectItem>
              <SelectItem value="gdrive">Google Drive</SelectItem>
              <SelectItem value="dropbox">Dropbox</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Switch checked={b.encrypt} onChange={v => update('backup', 'encrypt', v)} label="🔐 تشفير النسخ الاحتياطية" />
      {b.lastBackup && (
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400">
          آخر نسخة احتياطية: {new Date(b.lastBackup).toLocaleString('ar-IQ')}
        </div>
      )}
      <Button onClick={runBackup} className="btn-gold w-full"><HardDrive className="w-4 h-4 ml-2" /> إنشاء نسخة احتياطية الآن</Button>
    </div>
  );
}

function SecuritySection({ draft, update }) {
  const s = draft.security || {};
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="مدة الجلسة (دقيقة)"><Input type="number" value={s.sessionTimeoutMinutes || 60} onChange={e => update('security', 'sessionTimeoutMinutes', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="الحد الأدنى لطول كلمة المرور"><Input type="number" value={s.passwordMinLength || 6} onChange={e => update('security', 'passwordMinLength', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="حد محاولات الدخول الفاشلة"><Input type="number" value={s.maxLoginAttempts || 5} onChange={e => update('security', 'maxLoginAttempts', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="مدة القفل بعد الفشل (دقيقة)"><Input type="number" value={s.lockoutMinutes || 15} onChange={e => update('security', 'lockoutMinutes', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <div className="md:col-span-2">
        <Field label="قائمة IPs المسموحة (سطر لكل IP، فارغ = جميع IPs)">
          <Textarea value={(s.ipWhitelist || []).join('\n')} onChange={e => update('security', 'ipWhitelist', e.target.value.split('\n').filter(Boolean))} className="bg-input/30 border-gold/20 h-20 font-mono" dir="ltr" />
        </Field>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={s.requireStrongPassword} onChange={v => update('security', 'requireStrongPassword', v)} label="🔐 يتطلب كلمة مرور قوية (أرقام + رموز)" />
        <Switch checked={s.twoFAEnabled} onChange={v => update('security', 'twoFAEnabled', v)} label="🛡️ تفعيل المصادقة الثنائية 2FA" />
        <Switch checked={s.auditLogEnabled} onChange={v => update('security', 'auditLogEnabled', v)} label="📋 تسجيل سجل النشاطات Audit Log" />
        <Switch checked={s.forceLogoutOnPasswordChange} onChange={v => update('security', 'forceLogoutOnPasswordChange', v)} label="🚪 تسجيل خروج إجباري عند تغيير كلمة المرور" />
      </div>
    </div>
  );
}

function ReportsSection({ draft, update }) {
  const r = draft.reports || {};
  const formats = r.exportFormats || [];
  const toggleFormat = (f) => {
    update('reports', 'exportFormats', formats.includes(f) ? formats.filter(x => x !== f) : [...formats, f]);
  };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="الفترة الافتراضية">
        <Select value={r.defaultPeriod} onValueChange={v => update('reports', 'defaultPeriod', v)}>
          <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">يومي</SelectItem>
            <SelectItem value="weekly">أسبوعي</SelectItem>
            <SelectItem value="monthly">شهري</SelectItem>
            <SelectItem value="yearly">سنوي</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="وقت إرسال التقرير"><Input type="time" value={r.reportTime || '08:00'} onChange={e => update('reports', 'reportTime', e.target.value)} className="bg-input/30 border-gold/20" /></Field>
      <Field label="مدة الاحتفاظ بالتقارير (يوم)"><Input type="number" value={r.keepReportsDays || 365} onChange={e => update('reports', 'keepReportsDays', Number(e.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <div className="md:col-span-2">
        <Label className="text-xs mb-2 block">صيغ التصدير المُفعّلة</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['pdf', 'excel', 'csv', 'json'].map(f => (
            <button key={f} onClick={() => toggleFormat(f)} className={`p-3 rounded-lg border text-sm uppercase font-mono transition-all ${formats.includes(f) ? 'bg-gold/10 border-gold text-gold' : 'bg-input/30 border-gold-soft text-muted-foreground'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={r.emailReportsToManager} onChange={v => update('reports', 'emailReportsToManager', v)} label="📧 إرسال التقارير للمدير عبر الإيميل" />
        <Switch checked={r.scheduleReports} onChange={v => update('reports', 'scheduleReports', v)} label="⏰ جدولة التقارير التلقائية" />
        <Switch checked={r.includeCharts} onChange={v => update('reports', 'includeCharts', v)} label="📊 تضمين الرسوم البيانية" />
      </div>
    </div>
  );
}

function EmployeesSection({ draft, update }) {
  const e = draft.employees || {};
  const days = e.workDays || [];
  const toggleDay = (d) => {
    update('employees', 'workDays', days.includes(d) ? days.filter(x => x !== d) : [...days, d]);
  };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="بداية الدوام"><Input type="time" value={e.workStart || '08:00'} onChange={ev => update('employees', 'workStart', ev.target.value)} className="bg-input/30 border-gold/20" /></Field>
      <Field label="نهاية الدوام"><Input type="time" value={e.workEnd || '17:00'} onChange={ev => update('employees', 'workEnd', ev.target.value)} className="bg-input/30 border-gold/20" /></Field>
      <Field label="معدل الأجر الإضافي (×)"><Input type="number" step="0.1" value={e.overtimeRate || 1.5} onChange={ev => update('employees', 'overtimeRate', Number(ev.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <Field label="هدف KPI %"><Input type="number" value={e.kpiTarget || 80} onChange={ev => update('employees', 'kpiTarget', Number(ev.target.value))} className="bg-input/30 border-gold/20" /></Field>
      <div className="md:col-span-2">
        <Label className="text-xs mb-2 block">أيام العمل</Label>
        <div className="grid grid-cols-7 gap-1">
          {[{ id: 'sat', l: 'سبت' }, { id: 'sun', l: 'أحد' }, { id: 'mon', l: 'اثنين' }, { id: 'tue', l: 'ثلاثاء' }, { id: 'wed', l: 'أربعاء' }, { id: 'thu', l: 'خميس' }, { id: 'fri', l: 'جمعة' }].map(d => (
            <button key={d.id} onClick={() => toggleDay(d.id)} className={`p-2 rounded-lg border text-xs transition-all ${days.includes(d.id) ? 'bg-gold/10 border-gold text-gold' : 'bg-input/30 border-gold-soft text-muted-foreground'}`}>{d.l}</button>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Switch checked={e.gpsTrackingEnabled} onChange={v => update('employees', 'gpsTrackingEnabled', v)} label="📍 تفعيل تتبع GPS للموظفين" />
        <Switch checked={e.requireFingerprint} onChange={v => update('employees', 'requireFingerprint', v)} label="👆 تطلب بصمة للحضور" />
        <Switch checked={e.requireFaceRecognition} onChange={v => update('employees', 'requireFaceRecognition', v)} label="😊 تطلب بصمة الوجه" />
        <Switch checked={e.autoAssignTasks} onChange={v => update('employees', 'autoAssignTasks', v)} label="🤖 توزيع المهام تلقائياً" />
      </div>
    </div>
  );
}


// ============ ACTIVATIONS LOG ============
function ActivationsLog() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState('all');

  useEffect(() => { api('activations').then(setItems); }, []);

  const filtered = items.filter(a =>
    (payFilter === 'all' || a.paymentMethod === payFilter) &&
    (!search || a.subscriberName?.includes(search) || a.subscriberPhone?.includes(search) || a.username?.toLowerCase().includes(search.toLowerCase()) || a.agentName?.includes(search))
  );

  const totalRevenue = filtered.reduce((s, x) => s + (x.amount || 0), 0);
  const totalAgentProfit = filtered.reduce((s, x) => s + (x.agentProfit || 0), 0);
  const totalCompanyProfit = filtered.reduce((s, x) => s + (x.companyProfit || 0), 0);

  const payLabel = { cash: '💵 كاش', master: '💳 ماستر', fastpay: '⚡ فاست باي', transfer: '🏦 تحويل' };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <h1 className="text-2xl font-bold gold-text flex items-center gap-2"><CheckCircle2 className="w-6 h-6" /> سجل التفعيلات</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي التفعيلات</p><p className="text-2xl font-bold gold-text">{filtered.length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي الإيرادات</p><p className="text-xl font-bold neon-text">{fmtCurrency(totalRevenue)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">أرباح الوكلاء</p><p className="text-xl font-bold text-purple-400">{fmtCurrency(totalAgentProfit)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">صافي ربح الشركة</p><p className="text-xl font-bold text-emerald-400">{fmtCurrency(totalCompanyProfit)}</p></div>
      </div>

      <Card className="glass-strong border-gold-soft">
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث: اسم/يوزر/هاتف/وكيل..." className="pr-10 bg-input/30 border-gold/20" />
            </div>
            <Select value={payFilter} onValueChange={setPayFilter}>
              <SelectTrigger className="w-44 bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل طرق الدفع</SelectItem>
                <SelectItem value="cash">💵 كاش</SelectItem>
                <SelectItem value="master">💳 ماستر</SelectItem>
                <SelectItem value="fastpay">⚡ فاست باي</SelectItem>
                <SelectItem value="transfer">🏦 تحويل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-soft text-right text-xs text-muted-foreground">
                  <th className="p-2">التاريخ</th><th>المشترك</th><th>الباقة/السرعة</th><th>المدة</th><th>المبلغ</th><th>الدفع</th><th>الوكيل</th><th>عمولة</th><th>ينتهي</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    لا توجد تفعيلات بعد. ابدأ بتفعيل مشترك من قسم &quot;مشتركو الإنترنت&quot; 🚀
                  </td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="border-b border-gold-soft/30 hover:bg-gold/5">
                    <td className="p-2 text-xs">{new Date(a.createdAt).toLocaleDateString('ar-IQ')}</td>
                    <td>
                      <div className="font-semibold text-xs">{a.subscriberName}</div>
                      <div className="text-[10px] font-mono text-cyan-400">@{a.username}</div>
                    </td>
                    <td>
                      <div className="text-xs">{a.packageName}</div>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">{a.speed}</Badge>
                    </td>
                    <td className="text-xs">{a.durationMonths} شهر</td>
                    <td className="font-bold gold-text">{fmt(a.amount)}</td>
                    <td><Badge variant="outline" className="text-[10px]">{payLabel[a.paymentMethod] || a.paymentMethod}</Badge></td>
                    <td className="text-xs">{a.agentName}</td>
                    <td className="text-xs text-purple-400">{fmt(a.agentProfit)}</td>
                    <td className="text-[10px] text-muted-foreground">{new Date(a.endDate).toLocaleDateString('ar-IQ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ AGENTS ============
function Agents() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statsDialog, setStatsDialog] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', phone: '', branch: '', commission: 20, status: 'active' });

  const load = () => api('agents').then(setItems);
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...form, commission: Number(form.commission) };
    if (editing) await api(`agents/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('agents', { method: 'POST', body: JSON.stringify({ ...payload, balance: 0, totalActivations: 0, totalProfit: 0 }) });
    toast.success('تم الحفظ'); setOpen(false); setEditing(null); load();
  };
  const remove = async (id) => { await api(`agents/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); load(); };
  const openStats = async (id) => { const r = await api(`agents/${id}/stats`); setStatsDialog(r); };
  const portalLink = (a) => typeof window !== 'undefined' ? `${window.location.origin}/agent?u=${a.username}` : `/agent?u=${a.username}`;

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold gold-text flex items-center gap-2"><UserCheck className="w-6 h-6" /> الوكلاء</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', username: '', password: '', phone: '', branch: '', commission: 20, status: 'active' }); setOpen(true); }} className="btn-gold"><Plus className="w-4 h-4 ml-1" /> وكيل جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي الوكلاء</p><p className="text-2xl font-bold gold-text">{items.length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي تفعيلاتهم</p><p className="text-2xl font-bold neon-text">{items.reduce((s, a) => s + (a.totalActivations || 0), 0)}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي عمولاتهم</p><p className="text-xl font-bold text-purple-400">{fmtCurrency(items.reduce((s, a) => s + (a.totalProfit || 0), 0))}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">رصيد إجمالي</p><p className="text-xl font-bold text-emerald-400">{fmtCurrency(items.reduce((s, a) => s + (a.balance || 0), 0))}</p></div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(a => (
          <Card key={a.id} className="glass-card border-gold-soft hover:border-gold/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-neon-gradient flex items-center justify-center text-2xl font-black text-background">{a.name[0]}</div>
                <div className="flex-1">
                  <h3 className="font-bold">{a.name}</h3>
                  <p className="text-[10px] text-muted-foreground">@{a.username} · {a.branch}</p>
                  <p className="text-xs text-cyan-400">{a.phone}</p>
                </div>
                <Badge className={a.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>{a.status === 'active' ? 'نشط' : 'موقف'}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="glass-card rounded-lg p-2"><p className="text-[9px] text-muted-foreground">تفعيلات</p><p className="text-base font-bold gold-text">{a.totalActivations || 0}</p></div>
                <div className="glass-card rounded-lg p-2"><p className="text-[9px] text-muted-foreground">عمولة</p><p className="text-base font-bold neon-text">{a.commission}%</p></div>
                <div className="glass-card rounded-lg p-2"><p className="text-[9px] text-muted-foreground">الرصيد</p><p className="text-xs font-bold text-emerald-400">{fmt(a.balance || 0)}</p></div>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[10px] flex items-center justify-between gap-2">
                <span className="font-mono truncate">{portalLink(a)}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={() => { navigator.clipboard?.writeText(portalLink(a)); toast.success('تم نسخ الرابط'); }}><FileText className="w-3 h-3" /></Button>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gold-soft">
                <Button size="sm" variant="outline" className="flex-1 border-gold/30" onClick={() => openStats(a.id)}><BarChart3 className="w-3 h-3 ml-1" /> إحصائيات</Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setEditing(a); setForm(a); setOpen(true); }}><Edit2 className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 hover:text-red-500" onClick={() => remove(a.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40">
          <DialogHeader><DialogTitle className="gold-text">{editing ? 'تعديل الوكيل' : 'وكيل جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>اسم الوكيل</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>اسم المستخدم</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="bg-input/30 border-gold/20 font-mono" /></div>
            <div><Label>كلمة المرور</Label><Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-input/30 border-gold/20 font-mono" /></div>
            <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الفرع</Label><Input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>نسبة العمولة %</Label><Input type="number" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="suspended">موقف</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statsDialog} onOpenChange={() => setStatsDialog(null)}>
        <DialogContent className="glass-strong border-gold/40 max-w-2xl">
          <DialogHeader><DialogTitle className="gold-text">إحصائيات: {statsDialog?.agent?.name}</DialogTitle></DialogHeader>
          {statsDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">المشتركون</p><p className="text-xl font-bold gold-text">{statsDialog.stats.totalSubscribers}</p></div>
                <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">النشط</p><p className="text-xl font-bold text-emerald-400">{statsDialog.stats.activeSubscribers}</p></div>
                <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">التفعيلات</p><p className="text-xl font-bold neon-text">{statsDialog.stats.totalActivations}</p></div>
                <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">إيراداته</p><p className="text-sm font-bold gold-text">{fmt(statsDialog.stats.totalRevenue)}</p></div>
                <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">عمولاته</p><p className="text-sm font-bold text-purple-400">{fmt(statsDialog.stats.totalProfit)}</p></div>
                <div className="stat-card text-center"><p className="text-[10px] text-muted-foreground">منتهية قريباً</p><p className="text-xl font-bold text-amber-400">{statsDialog.stats.expiringSoon}</p></div>
              </div>
              <div>
                <h4 className="text-sm font-bold mb-2">آخر التفعيلات:</h4>
                <ScrollArea className="h-48">
                  {statsDialog.activations.map(a => (
                    <div key={a.id} className="text-xs p-2 border-b border-gold-soft/30 flex justify-between">
                      <span>{a.subscriberName}</span>
                      <span className="font-bold gold-text">{fmt(a.amount)} د.ع</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ NETWORKS / FATs ============
function Networks() {
  const [items, setItems] = useState([]);
  const [zones, setZones] = useState([]);
  const [zoneFilter, setZoneFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ number: '', name: '', zoneId: '', capacity: 32, status: 'active', lat: 33.31, lng: 44.40, utilization: 50 });

  const load = async () => {
    const [n, z] = await Promise.all([api('networks'), api('zones')]);
    setItems(n); setZones(z);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(n =>
    (zoneFilter === 'all' || n.zoneId === zoneFilter) &&
    (statusFilter === 'all' || n.status === statusFilter) &&
    (!search || n.number?.toLowerCase().includes(search.toLowerCase()) || n.name?.includes(search))
  );

  const save = async () => {
    const z = zones.find(x => x.id === form.zoneId);
    const payload = { ...form, zoneName: z?.name, zoneNumber: z?.number, capacity: Number(form.capacity), utilization: Number(form.utilization), lat: Number(form.lat), lng: Number(form.lng) };
    if (editing) await api(`networks/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('networks', { method: 'POST', body: JSON.stringify({ ...payload, subscribers: 0 }) });
    toast.success('تم الحفظ'); setOpen(false); setEditing(null); load();
  };
  const remove = async (id) => { await api(`networks/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); load(); };

  const statusInfo = {
    active: { txt: 'فعالة', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    weak: { txt: 'ضعيفة', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    stopped: { txt: 'متوقفة', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    maintenance: { txt: 'صيانة', cls: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold gold-text flex items-center gap-2"><Plug className="w-6 h-6" /> الشبكات / الفاتات</h1>
        <Button onClick={() => { setEditing(null); setForm({ number: '', name: '', zoneId: zones[0]?.id || '', capacity: 32, status: 'active', lat: 33.31, lng: 44.40, utilization: 50 }); setOpen(true); }} className="btn-gold"><Plus className="w-4 h-4 ml-1" /> فاتة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي الفاتات</p><p className="text-2xl font-bold gold-text">{items.length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">فعالة</p><p className="text-2xl font-bold text-emerald-400">{items.filter(i => i.status === 'active').length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">ضعيفة/صيانة</p><p className="text-2xl font-bold text-amber-400">{items.filter(i => i.status === 'weak' || i.status === 'maintenance').length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">متوقفة</p><p className="text-2xl font-bold text-red-400">{items.filter(i => i.status === 'stopped').length}</p></div>
      </div>

      <Card className="glass-strong border-gold-soft">
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث: رقم/اسم الفاتة..." className="pr-10 bg-input/30 border-gold/20" />
            </div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الزونات</SelectItem>
                {zones.map(z => <SelectItem key={z.id} value={z.id}><span className="font-mono text-gold">{z.number}</span> · {z.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">فعالة</SelectItem>
                <SelectItem value="weak">ضعيفة</SelectItem>
                <SelectItem value="stopped">متوقفة</SelectItem>
                <SelectItem value="maintenance">صيانة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">عدد النتائج: <span className="text-gold font-bold">{filtered.length}</span> من {items.length}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.slice(0, 60).map(n => {
          const info = statusInfo[n.status] || statusInfo.active;
          return (
            <Card key={n.id} className="glass-card border-gold-soft hover:border-gold/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-base font-bold text-purple-400">{n.number}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{n.name}</p>
                  </div>
                  <Badge className={info.cls + ' text-[10px]'}>{info.txt}</Badge>
                </div>
                <div className="text-[10px] text-gold font-mono">📍 {n.zoneNumber} · {n.zoneName}</div>
                <div className="grid grid-cols-2 gap-1 text-center">
                  <div className="glass-card rounded p-1.5"><p className="text-[9px] text-muted-foreground">مشتركين</p><p className="text-sm font-bold neon-text">{n.subscribers || 0}/{n.capacity}</p></div>
                  <div className="glass-card rounded p-1.5"><p className="text-[9px] text-muted-foreground">ضغط</p><p className={`text-sm font-bold ${n.utilization > 85 ? 'text-red-400' : 'text-emerald-400'}`}>{n.utilization}%</p></div>
                </div>
                <Progress value={n.utilization} className="h-1" />
                <div className="flex gap-1 pt-1 border-t border-gold-soft">
                  <a href={`https://www.openstreetmap.org/?mlat=${n.lat}&mlon=${n.lng}#map=17/${n.lat}/${n.lng}`} target="_blank" rel="noreferrer" className="flex-1 text-center text-[10px] text-cyan-400 hover:text-cyan-300 py-1">🗺️ خريطة</a>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(n); setForm({ ...n }); setOpen(true); }}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-500" onClick={() => remove(n.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {filtered.length > 60 && <p className="text-center text-xs text-muted-foreground">عرض أول 60 فاتة من {filtered.length}. استخدم الفلاتر للوصول لباقي الفاتات.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40">
          <DialogHeader><DialogTitle className="gold-text">{editing ? 'تعديل فاتة' : 'فاتة جديدة'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>رقم الفاتة</Label><Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="F-01-05" className="bg-input/30 border-gold/20 font-mono" /></div>
            <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div className="col-span-2"><Label>الزون</Label>
              <Select value={form.zoneId} onValueChange={v => setForm({ ...form, zoneId: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue placeholder="اختر زون" /></SelectTrigger>
                <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}><span className="font-mono text-gold">{z.number}</span> · {z.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>السعة</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعالة</SelectItem>
                  <SelectItem value="weak">ضعيفة</SelectItem>
                  <SelectItem value="stopped">متوقفة</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>خط العرض</Label><Input type="number" step="0.000001" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} className="bg-input/30 border-gold/20 font-mono" /></div>
            <div><Label>خط الطول</Label><Input type="number" step="0.000001" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} className="bg-input/30 border-gold/20 font-mono" /></div>
            <div className="col-span-2"><Label>الضغط %</Label><Input type="number" value={form.utilization} onChange={e => setForm({ ...form, utilization: e.target.value })} className="bg-input/30 border-gold/20" /></div>
          </div>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ WHATSAPP LOG ============
function WhatsAppLog() {
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewing, setViewing] = useState(null);

  const load = () => api('whatsapp-messages').then(setItems);
  useEffect(() => { load(); }, []);

  const filtered = items.filter(m =>
    (typeFilter === 'all' || m.type === typeFilter) &&
    (statusFilter === 'all' || m.status === statusFilter)
  );

  const resend = async (id) => {
    const r = await api(`whatsapp-messages/${id}/resend`, { method: 'POST' });
    if (r.error) toast.error(r.error);
    else { toast.success('تم إعادة الإرسال للطابور'); load(); }
  };

  const statusInfo = {
    sent: { txt: '✅ مرسل', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    queued: { txt: '⏳ في الطابور', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    failed: { txt: '❌ فشل', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const typeLabel = { activation: '🎉 تفعيل', manager_alert: '🔔 إشعار مدير', expiry: '⏰ تنبيه انتهاء', debt: '💰 دين' };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold gold-text flex items-center gap-2"><Send className="w-6 h-6" /> سجل رسائل الواتساب</h1>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">⚠️ يحتاج تكامل WhatsApp API لتفعيل الإرسال الفعلي</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><p className="text-xs text-muted-foreground">إجمالي الرسائل</p><p className="text-2xl font-bold gold-text">{items.length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">في الطابور</p><p className="text-2xl font-bold text-amber-400">{items.filter(i => i.status === 'queued').length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">مرسلة</p><p className="text-2xl font-bold text-emerald-400">{items.filter(i => i.status === 'sent').length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground">فشلت</p><p className="text-2xl font-bold text-red-400">{items.filter(i => i.status === 'failed').length}</p></div>
      </div>

      <Card className="glass-strong border-gold-soft">
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="activation">🎉 تفعيل</SelectItem>
                <SelectItem value="manager_alert">🔔 إشعار مدير</SelectItem>
                <SelectItem value="expiry">⏰ انتهاء</SelectItem>
                <SelectItem value="debt">💰 دين</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="queued">في الطابور</SelectItem>
                <SelectItem value="sent">مرسل</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-soft text-right text-xs text-muted-foreground">
                  <th className="p-2">التاريخ</th><th>النوع</th><th>إلى</th><th>الحالة</th><th>محاولات</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-muted-foreground">
                    <Send className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    لا توجد رسائل بعد. سيتم تسجيل الرسائل تلقائياً عند تفعيل المشتركين
                  </td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id} className="border-b border-gold-soft/30 hover:bg-gold/5">
                    <td className="p-2 text-xs">{new Date(m.createdAt).toLocaleString('ar-IQ')}</td>
                    <td className="text-xs">{typeLabel[m.type] || m.type}</td>
                    <td className="text-xs">
                      <div>{m.subscriberName || '-'}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{m.phone}</div>
                    </td>
                    <td><Badge className={(statusInfo[m.status] || statusInfo.queued).cls + ' text-[10px]'}>{(statusInfo[m.status] || statusInfo.queued).txt}</Badge></td>
                    <td className="text-xs text-center">{m.retries || 0}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-cyan-500/30 text-cyan-400" onClick={() => setViewing(m)}>عرض</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-gold/30" onClick={() => resend(m.id)}><Send className="w-3 h-3 ml-1" />إرسال</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="glass-strong border-gold/40">
          <DialogHeader><DialogTitle className="gold-text">محتوى الرسالة</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="p-2 rounded bg-input/30 text-xs">
                <strong>إلى:</strong> {viewing.subscriberName} ({viewing.phone}) · <strong>التاريخ:</strong> {new Date(viewing.createdAt).toLocaleString('ar-IQ')}
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{viewing.message}</pre>
              </div>
              <Button onClick={() => { navigator.clipboard?.writeText(viewing.message); toast.success('تم النسخ'); }} className="btn-gold w-full">نسخ الرسالة</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ LOADING ============
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold-gradient flex items-center justify-center animate-pulse-glow">
          <span className="text-2xl font-black text-background">غ</span>
        </div>
        <p className="gold-text font-bold">جاري التحميل...</p>
      </div>
    </div>
  );
}

export default App;
