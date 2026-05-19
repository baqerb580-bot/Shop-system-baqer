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
  { id: 'zones', label: 'الزونات والشبكات', icon: Network, color: 'neon' },
  { id: 'noc', label: 'مراقبة الشبكة NOC', icon: Activity, color: 'neon' },
  { id: 'repairs', label: 'صيانة الهواتف', icon: Wrench, color: 'gold' },
  { id: 'cameras', label: 'الكاميرات والمراقبة', icon: Camera, color: 'gold' },
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
          {active === 'zones' && <Zones />}
          {active === 'noc' && <NOC />}
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [fatFilter, setFatFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', zoneId: '', fatNumber: '', package: '50 Mbps', fee: 35000, ipAddress: '', macAddress: '', status: 'active', debt: 0, dueDate: '' });

  const load = async () => {
    const [s, z] = await Promise.all([api('subscribers'), api('zones')]);
    setItems(s); setZones(z);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    (statusFilter === 'all' || i.status === statusFilter) &&
    (zoneFilter === 'all' || i.zoneId === zoneFilter) &&
    (!fatFilter || (i.fatNumber || '').toLowerCase().includes(fatFilter.toLowerCase())) &&
    (!search ||
      i.name?.includes(search) ||
      i.phone?.includes(search) ||
      i.ipAddress?.includes(search) ||
      i.zoneNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.fatNumber?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const save = async () => {
    const zone = zones.find(z => z.id === form.zoneId);
    const payload = { ...form, zoneName: zone?.name, zoneNumber: zone?.number, fee: Number(form.fee), debt: Number(form.debt) };
    if (editing) await api(`subscribers/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('subscribers', { method: 'POST', body: JSON.stringify(payload) });
    toast.success('تم الحفظ'); setOpen(false); setEditing(null); load();
  };
  const remove = async (id) => { await api(`subscribers/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); load(); };
  const startEdit = (s) => { setEditing(s); setForm(s); setOpen(true); };

  const activeCount = items.filter(i => i.status === 'active').length;
  const totalDebt = items.reduce((s, x) => s + (x.debt || 0), 0);
  const monthlyIncome = items.filter(i => i.status === 'active').reduce((s, x) => s + (x.fee || 0), 0);

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setZoneFilter('all'); setFatFilter(''); };
  const hasActiveFilters = search || statusFilter !== 'all' || zoneFilter !== 'all' || fatFilter;

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold gold-text">مشتركو الإنترنت</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', phone: '', address: '', zoneId: zones[0]?.id || '', fatNumber: '', package: '50 Mbps', fee: 35000, ipAddress: '', macAddress: '', status: 'active', debt: 0, dueDate: '' }); setOpen(true); }} className="btn-gold">
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
          {/* Search Bar */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث شامل: اسم/هاتف/IP/زون/فاتة..." className="pr-10 bg-input/30 border-gold/20" />
            </div>
          </div>

          {/* Advanced Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 rounded-xl bg-gold/5 border border-gold-soft">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1"><Network className="w-3 h-3 text-gold" /> فلترة برقم الزون</Label>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="bg-input/30 border-gold/20 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الزونات</SelectItem>
                  {zones.map(z => (
                    <SelectItem key={z.id} value={z.id}>
                      <span className="font-mono text-gold">{z.number}</span> · {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1"><Plug className="w-3 h-3 text-neon-blue" /> فلترة برقم الفاتة</Label>
              <Input value={fatFilter} onChange={e => setFatFilter(e.target.value)} placeholder="مثلاً: F-01" className="bg-input/30 border-gold/20 h-9 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> الحالة</Label>
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
                <X className="w-3 h-3 ml-1" /> مسح الفلاتر
              </Button>
            </div>
          </div>

          {/* Result Count */}
          <div className="flex items-center justify-between text-xs">
            <p className="text-muted-foreground">
              عدد النتائج: <span className="text-gold font-bold">{filtered.length}</span> من {items.length}
            </p>
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1">
                {zoneFilter !== 'all' && (
                  <Badge variant="outline" className="border-gold/30 text-[10px]">
                    زون: {zones.find(z => z.id === zoneFilter)?.number}
                  </Badge>
                )}
                {fatFilter && <Badge variant="outline" className="border-cyan-500/30 text-[10px]">فاتة: {fatFilter}</Badge>}
                {statusFilter !== 'all' && <Badge variant="outline" className="border-emerald-500/30 text-[10px]">{statusFilter === 'active' ? 'نشط' : 'موقف'}</Badge>}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-soft text-right text-xs text-muted-foreground">
                  <th className="p-2">المشترك</th><th>الهاتف</th><th>الباقة</th><th>الزون</th><th>الفاتة</th><th>IP</th><th>الحالة</th><th>الدين</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-8 text-muted-foreground">لا توجد نتائج مطابقة 🔍</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="border-b border-gold-soft/30 hover:bg-gold/5">
                    <td className="p-2 font-semibold">{s.name}</td>
                    <td className="text-xs">{s.phone}</td>
                    <td><Badge variant="outline" className="border-cyan-500/30 text-cyan-400">{s.package}</Badge></td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-gold">{s.zoneNumber || '—'}</span>
                        <span className="text-[10px] text-muted-foreground">{s.zoneName}</span>
                      </div>
                    </td>
                    <td><Badge variant="outline" className="border-purple-500/30 text-purple-400 font-mono text-[10px]">{s.fatNumber || '—'}</Badge></td>
                    <td className="text-xs font-mono">{s.ipAddress}</td>
                    <td><Badge className={s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>{s.status === 'active' ? 'نشط' : 'موقف'}</Badge></td>
                    <td className={s.debt > 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}>{fmt(s.debt)}</td>
                    <td>
                      <div className="flex gap-1">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-gold/40 max-w-xl">
          <DialogHeader><DialogTitle className="gold-text">{editing ? 'تعديل المشترك' : 'مشترك جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>الاسم</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الزون</Label>
              <Select value={form.zoneId} onValueChange={v => setForm({ ...form, zoneId: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue placeholder="اختر زون" /></SelectTrigger>
                <SelectContent>{zones.map(z => (
                  <SelectItem key={z.id} value={z.id}>
                    <span className="font-mono text-gold">{z.number}</span> · {z.name}
                  </SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>رقم الفاتة (FAT)</Label><Input value={form.fatNumber} onChange={e => setForm({ ...form, fatNumber: e.target.value })} placeholder="مثلاً: F-01-03" className="bg-input/30 border-gold/20 font-mono" /></div>
            <div className="col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الباقة</Label>
              <Select value={form.package} onValueChange={v => setForm({ ...form, package: v, fee: v === '25 Mbps' ? 25000 : v === '50 Mbps' ? 35000 : v === '100 Mbps' ? 50000 : 75000 })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25 Mbps">25 Mbps - 25,000</SelectItem>
                  <SelectItem value="50 Mbps">50 Mbps - 35,000</SelectItem>
                  <SelectItem value="100 Mbps">100 Mbps - 50,000</SelectItem>
                  <SelectItem value="200 Mbps">200 Mbps - 75,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>الرسوم الشهرية</Label><Input type="number" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>IP Address</Label><Input value={form.ipAddress} onChange={e => setForm({ ...form, ipAddress: e.target.value })} placeholder="10.10.1.1" className="bg-input/30 border-gold/20" /></div>
            <div><Label>MAC Address</Label><Input value={form.macAddress} onChange={e => setForm({ ...form, macAddress: e.target.value })} className="bg-input/30 border-gold/20" /></div>
            <div><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="suspended">موقف</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>الدين</Label><Input type="number" value={form.debt} onChange={e => setForm({ ...form, debt: e.target.value })} className="bg-input/30 border-gold/20" /></div>
          </div>
          <DialogFooter><Button onClick={save} className="btn-gold w-full">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold gold-text">الإعدادات</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Users, title: 'المستخدمون والصلاحيات', desc: 'إدارة الأدوار والصلاحيات RBAC', color: 'from-amber-500 to-yellow-600' },
          { icon: Phone, title: 'إعدادات WhatsApp', desc: 'تكامل WhatsApp API للإشعارات', color: 'from-emerald-500 to-teal-600' },
          { icon: Send, title: 'إعدادات Telegram', desc: 'Bot للإشعارات والتقارير', color: 'from-cyan-500 to-blue-600' },
          { icon: Building2, title: 'الفروع', desc: 'إدارة فروع متعددة', color: 'from-purple-500 to-pink-600' },
          { icon: Globe, title: 'اللغات', desc: 'العربية، الإنجليزية، الكردية', color: 'from-orange-500 to-red-600' },
          { icon: HardDrive, title: 'النسخ الاحتياطي', desc: 'نسخ تلقائي يومي للبيانات', color: 'from-indigo-500 to-purple-600' },
          { icon: CreditCard, title: 'بوابات الدفع', desc: 'تكامل ZainCash، AsiaCell، MasterCard', color: 'from-pink-500 to-rose-600' },
          { icon: Activity, title: 'مراقبة النظام', desc: 'حالة الخوادم والأداء', color: 'from-fuchsia-500 to-purple-600' },
        ].map((s, i) => {
          const I = s.icon;
          return (
            <Card key={i} className="glass-card border-gold-soft hover:border-gold/50 cursor-pointer transition-all group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <I className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
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
