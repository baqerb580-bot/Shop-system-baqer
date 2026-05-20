'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast, Toaster } from 'sonner';
import { ShoppingCart, Plus, Minus, X, Search, Package, Phone, MapPin, CreditCard, CheckCircle2 } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const api = async (path, opts = {}) => {
  const r = await fetch(`/api/${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  return r.json();
};

function Store() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', paymentMethod: 'cod', notes: '' });

  useEffect(() => {
    api('products').then(p => { if (Array.isArray(p)) setProducts(p); });
    try {
      const saved = localStorage.getItem('store_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem('store_cart', JSON.stringify(cart)); } catch {} }, [cart]);

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const filtered = products.filter(p => 
    (category === 'all' || p.category === category) &&
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(x => x.id === p.id);
      if (ex) return prev.map(x => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    toast.success(`✅ تمت إضافة ${p.name}`);
  };
  const changeQty = (id, delta) => {
    setCart(prev => prev.map(x => x.id === id ? { ...x, quantity: Math.max(0, x.quantity + delta) } : x).filter(x => x.quantity > 0));
  };
  const removeItem = (id) => setCart(prev => prev.filter(x => x.id !== id));

  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0);
  const shipping = subtotal >= 50000 ? 0 : 5000;
  const total = subtotal + shipping;

  const placeOrder = async () => {
    if (!form.customerName || !form.customerPhone) { toast.error('الاسم ورقم الهاتف مطلوبان'); return; }
    if (cart.length === 0) { toast.error('السلة فارغة'); return; }
    const r = await api('orders', { method: 'POST', body: JSON.stringify({ ...form, items: cart }) });
    if (r.error) toast.error(r.error);
    else {
      setOrderSuccess(r);
      setCart([]); setCheckoutOpen(false); setCartOpen(false);
      setForm({ customerName: '', customerPhone: '', customerAddress: '', paymentMethod: 'cod', notes: '' });
      try { localStorage.removeItem('store_cart'); } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="glass-strong border-b border-gold-soft sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-xl font-black">غ</div>
          <div>
            <h1 className="text-lg font-black gold-text leading-tight">متجر الغزلان</h1>
            <p className="text-[10px] text-muted-foreground">إلكترونيات · إكسسوارات · صيانة</p>
          </div>
        </div>
        <Button onClick={() => setCartOpen(true)} className="btn-gold relative">
          <ShoppingCart className="w-4 h-4 ml-1" /> السلة
          {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{cart.reduce((s, x) => s + x.quantity, 0)}</span>}
        </Button>
      </header>

      <main className="p-4 max-w-7xl mx-auto space-y-4">
        {/* Hero */}
        <div className="rounded-2xl bg-gold-gradient/20 border border-gold/40 p-6 text-center">
          <h2 className="text-2xl font-black gold-text">🛒 تسوّق بسهولة - توصيل سريع</h2>
          <p className="text-sm text-muted-foreground mt-2">شحن مجاني للطلبات فوق 50,000 د.ع · دفع عند الاستلام</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج..." className="pr-10 bg-input/30 border-gold/20" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48 bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأقسام</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => (
            <Card key={p.id} className="glass-card border-gold-soft hover:border-gold/50 transition-all hover:shadow-gold-glow group">
              <CardContent className="p-3 space-y-2">
                <div className="aspect-square bg-input/30 rounded-lg flex items-center justify-center overflow-hidden">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Package className="w-12 h-12 text-gold/40" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{p.category || '-'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-base font-black gold-text">{fmt(p.price)}</p>
                  <span className="text-[10px] text-muted-foreground">د.ع</span>
                </div>
                <p className={`text-[10px] ${p.stock > 5 ? 'text-emerald-400' : p.stock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  {p.stock > 0 ? `🟢 متوفر (${p.stock})` : '🔴 غير متوفر'}
                </p>
                <Button onClick={() => addToCart(p)} disabled={!p.stock || p.stock < 1} className="btn-gold w-full h-8 text-xs">
                  <ShoppingCart className="w-3 h-3 ml-1" /> أضف للسلة
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">لا توجد منتجات</p>}
      </main>

      {/* Cart Sheet */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="glass-strong border-gold/40 max-w-md">
          <DialogHeader><DialogTitle className="gold-text">🛒 سلة التسوق</DialogTitle></DialogHeader>
          {cart.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">السلة فارغة</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cart.map(it => (
                <div key={it.id} className="flex items-center gap-2 p-2 rounded-lg bg-input/30 border border-gold-soft">
                  <button onClick={() => removeItem(it.id)} className="text-red-400"><X className="w-4 h-4" /></button>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{it.name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmt(it.price)} × {it.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => changeQty(it.id, -1)}><Minus className="w-3 h-3" /></Button>
                    <span className="text-xs w-6 text-center font-bold">{it.quantity}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => changeQty(it.id, 1)}><Plus className="w-3 h-3" /></Button>
                  </div>
                  <span className="text-xs font-bold gold-text w-20 text-left">{fmt(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
          )}
          {cart.length > 0 && (
            <div className="border-t border-gold-soft pt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span>المجموع الفرعي</span><span className="font-bold">{fmt(subtotal)} د.ع</span></div>
              <div className="flex justify-between"><span>الشحن</span><span className="font-bold">{shipping === 0 ? '🎉 مجاني' : `${fmt(shipping)} د.ع`}</span></div>
              <div className="flex justify-between text-base font-black gold-text"><span>الإجمالي</span><span>{fmt(total)} د.ع</span></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCartOpen(false)}>متابعة التسوق</Button>
            <Button onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0} className="btn-gold flex-1">
              <CheckCircle2 className="w-4 h-4 ml-1" /> إتمام الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="glass-strong border-gold/40">
          <DialogHeader><DialogTitle className="gold-text">إتمام الطلب</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">الاسم الكامل *</Label>
              <Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="bg-input/30 border-gold/20" />
            </div>
            <div>
              <Label className="text-xs">رقم الهاتف *</Label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gold" />
                <Input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="pr-10 bg-input/30 border-gold/20 font-mono" dir="ltr" placeholder="07XXXXXXXXX" />
              </div>
            </div>
            <div>
              <Label className="text-xs">العنوان</Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute right-3 top-3 text-gold" />
                <Textarea value={form.customerAddress} onChange={e => setForm({ ...form, customerAddress: e.target.value })} className="pr-10 bg-input/30 border-gold/20 h-20" placeholder="المحافظة، المنطقة، أقرب نقطة دالة..." />
              </div>
            </div>
            <div>
              <Label className="text-xs">طريقة الدفع</Label>
              <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
                <SelectTrigger className="bg-input/30 border-gold/20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">💵 الدفع عند الاستلام</SelectItem>
                  <SelectItem value="zaincash">📱 ZainCash</SelectItem>
                  <SelectItem value="fastpay">⚡ FastPay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ملاحظات</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-input/30 border-gold/20 h-16" />
            </div>
            <div className="p-3 rounded-lg bg-gold/10 border border-gold/30 text-xs">
              <div className="flex justify-between"><span>عدد المنتجات</span><span className="font-bold">{cart.length}</span></div>
              <div className="flex justify-between text-base font-black gold-text mt-1"><span>المبلغ الإجمالي</span><span>{fmt(total)} د.ع</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={placeOrder} className="btn-gold w-full">تأكيد الطلب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success */}
      <Dialog open={!!orderSuccess} onOpenChange={() => setOrderSuccess(null)}>
        <DialogContent className="glass-strong border-emerald-500/40">
          <DialogHeader><DialogTitle className="text-emerald-400">✅ تم إنشاء طلبك بنجاح</DialogTitle></DialogHeader>
          <div className="space-y-2 text-center py-4">
            <div className="text-6xl">🎉</div>
            <p className="text-sm">رقم الطلب:</p>
            <p className="text-2xl font-black gold-text font-mono">{orderSuccess?.orderNumber}</p>
            <p className="text-xs text-muted-foreground">سيتواصل معك فريقنا قريباً لتأكيد الطلب</p>
            <p className="text-base font-bold mt-3">الإجمالي: <span className="gold-text">{fmt(orderSuccess?.total)} د.ع</span></p>
          </div>
          <DialogFooter>
            <Button onClick={() => setOrderSuccess(null)} className="btn-gold w-full">حسناً</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}

export default Store;
