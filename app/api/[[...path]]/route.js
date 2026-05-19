import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ghazlan_erp';
const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY;

let cachedClient = null;
async function getDb() {
  if (cachedClient) return cachedClient.db(DB_NAME);
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  cachedClient = client;
  const db = client.db(DB_NAME);
  await seedDefaults(db);
  return db;
}

async function seedDefaults(db) {
  const productsCount = await db.collection('products').countDocuments();
  if (productsCount === 0) {
    await db.collection('products').insertMany([
      { id: uuidv4(), name: 'iPhone 15 Pro Max', sku: 'IP15PM', barcode: '1000001', category: 'phones', price: 1850000, cost: 1700000, stock: 12, lowStockAlert: 3, image: '📱', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Samsung S24 Ultra', sku: 'SS24U', barcode: '1000002', category: 'phones', price: 1650000, cost: 1500000, stock: 8, lowStockAlert: 3, image: '📱', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'AirPods Pro 2', sku: 'APP2', barcode: '1000003', category: 'accessories', price: 320000, cost: 280000, stock: 25, lowStockAlert: 5, image: '🎧', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'كيبل USB-C', sku: 'USBC1', barcode: '1000004', category: 'accessories', price: 8000, cost: 5000, stock: 150, lowStockAlert: 20, image: '🔌', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'شاشة iPhone 14', sku: 'SCRIP14', barcode: '1000005', category: 'spare_parts', price: 95000, cost: 75000, stock: 18, lowStockAlert: 5, image: '📺', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'بطارية Samsung A52', sku: 'BATS52', barcode: '1000006', category: 'spare_parts', price: 35000, cost: 22000, stock: 30, lowStockAlert: 10, image: '🔋', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'كاميرا Hikvision 4MP', sku: 'HIK4MP', barcode: '1000007', category: 'cameras', price: 180000, cost: 140000, stock: 15, lowStockAlert: 3, image: '📹', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'NVR 8 Channel', sku: 'NVR8', barcode: '1000008', category: 'cameras', price: 450000, cost: 380000, stock: 6, lowStockAlert: 2, image: '🖥️', createdAt: new Date().toISOString() },
    ]);
  }

  const zonesCount = await db.collection('zones').countDocuments();
  if (zonesCount === 0) {
    await db.collection('zones').insertMany([
      { id: uuidv4(), number: 'Z-001', name: 'زون الكرادة المركزي', location: 'بغداد - الكرادة', lat: 33.3060, lng: 44.4180, status: 'online', subscribers: 0, fats: 4, utilization: 65, createdAt: new Date().toISOString() },
      { id: uuidv4(), number: 'Z-002', name: 'زون المنصور', location: 'بغداد - المنصور', lat: 33.3152, lng: 44.3661, status: 'online', subscribers: 0, fats: 6, utilization: 78, createdAt: new Date().toISOString() },
      { id: uuidv4(), number: 'Z-003', name: 'زون الجادرية', location: 'بغداد - الجادرية', lat: 33.2750, lng: 44.3850, status: 'warning', subscribers: 0, fats: 3, utilization: 91, createdAt: new Date().toISOString() },
      { id: uuidv4(), number: 'Z-004', name: 'زون الدورة', location: 'بغداد - الدورة', lat: 33.2466, lng: 44.4060, status: 'offline', subscribers: 0, fats: 2, utilization: 0, createdAt: new Date().toISOString() },
    ]);
  } else {
    // Backfill: ensure existing zones have a 'number' field
    const allZones = await db.collection('zones').find({}).toArray();
    let i = 1;
    for (const z of allZones) {
      if (!z.number) {
        await db.collection('zones').updateOne({ id: z.id }, { $set: { number: `Z-${String(i).padStart(3, '0')}` } });
      }
      i++;
    }
  }

  const subsCount = await db.collection('subscribers').countDocuments();
  if (subsCount === 0) {
    const zones = await db.collection('zones').find({}).toArray();
    const samples = [
      { name: 'محمد علي حسين', phone: '07901234567', package: '50 Mbps', fee: 35000 },
      { name: 'أحمد كريم عباس', phone: '07712345678', package: '100 Mbps', fee: 50000 },
      { name: 'فاطمة عبدالله', phone: '07801122334', package: '25 Mbps', fee: 25000 },
      { name: 'حسن جاسم', phone: '07905566778', package: '50 Mbps', fee: 35000 },
      { name: 'زينب محمود', phone: '07712233445', package: '100 Mbps', fee: 50000 },
      { name: 'علي ناصر', phone: '07801928374', package: '200 Mbps', fee: 75000 },
      { name: 'سارة خالد', phone: '07906655443', package: '50 Mbps', fee: 35000 },
      { name: 'مصطفى رحيم', phone: '07712348765', package: '25 Mbps', fee: 25000 },
    ];
    await db.collection('subscribers').insertMany(samples.map((s, i) => ({
      id: uuidv4(),
      ...s,
      zoneId: zones[i % zones.length].id,
      zoneName: zones[i % zones.length].name,
      zoneNumber: zones[i % zones.length].number || `Z-${String((i % zones.length) + 1).padStart(3, '0')}`,
      fatNumber: `F-${String((i % zones.length) + 1).padStart(2, '0')}-${String((i % 4) + 1).padStart(2, '0')}`,
      address: `${zones[i % zones.length].location} - شارع ${i + 1}`,
      ipAddress: `10.10.${i + 1}.${100 + i}`,
      macAddress: `AA:BB:CC:${(10 + i).toString(16).toUpperCase()}:${(20 + i).toString(16).toUpperCase()}:${(30 + i).toString(16).toUpperCase()}`,
      status: i % 7 === 0 ? 'suspended' : 'active',
      debt: i % 4 === 0 ? 35000 : 0,
      dueDate: new Date(Date.now() + (i * 86400000)).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    })));
    for (const z of zones) {
      const count = await db.collection('subscribers').countDocuments({ zoneId: z.id });
      await db.collection('zones').updateOne({ id: z.id }, { $set: { subscribers: count } });
    }
  } else {
    // Backfill: ensure subscribers have zoneNumber & fatNumber
    const allSubs = await db.collection('subscribers').find({}).toArray();
    const allZones = await db.collection('zones').find({}).toArray();
    const zoneById = Object.fromEntries(allZones.map(z => [z.id, z]));
    let i = 0;
    for (const s of allSubs) {
      const updates = {};
      if (!s.zoneNumber && s.zoneId && zoneById[s.zoneId]) {
        updates.zoneNumber = zoneById[s.zoneId].number || `Z-${String((i % 4) + 1).padStart(3, '0')}`;
      }
      if (!s.fatNumber) {
        updates.fatNumber = `F-${String((i % 4) + 1).padStart(2, '0')}-${String((i % 4) + 1).padStart(2, '0')}`;
      }
      if (Object.keys(updates).length > 0) {
        await db.collection('subscribers').updateOne({ id: s.id }, { $set: updates });
      }
      i++;
    }
  }

  const empCount = await db.collection('employees').countDocuments();
  if (empCount === 0) {
    await db.collection('employees').insertMany([
      { id: uuidv4(), name: 'كرار الغزلان', role: 'مدير عام', phone: '07901111111', salary: 1500000, kpi: 95, attendance: 'present', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'حيدر الموسوي', role: 'فني شبكات أول', phone: '07902222222', salary: 800000, kpi: 88, attendance: 'present', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'علي السوداني', role: 'فني صيانة هواتف', phone: '07903333333', salary: 700000, kpi: 92, attendance: 'present', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'زهراء حسين', role: 'كاشير', phone: '07904444444', salary: 600000, kpi: 85, attendance: 'late', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'مصطفى الجبوري', role: 'فني كاميرات', phone: '07905555555', salary: 750000, kpi: 78, attendance: 'absent', createdAt: new Date().toISOString() },
    ]);
  }

  const repairsCount = await db.collection('repairs').countDocuments();
  if (repairsCount === 0) {
    await db.collection('repairs').insertMany([
      { id: uuidv4(), ticketNumber: 'RP-1001', customerName: 'حسين علي', phone: '07901234567', device: 'iPhone 13', imei: '356789012345678', issue: 'شاشة مكسورة', technician: 'علي السوداني', status: 'in_progress', cost: 85000, partsCost: 65000, receivedAt: new Date(Date.now() - 86400000 * 2).toISOString(), createdAt: new Date().toISOString() },
      { id: uuidv4(), ticketNumber: 'RP-1002', customerName: 'محمد كريم', phone: '07712345678', device: 'Samsung A52', imei: '352145678901234', issue: 'بطارية تالفة', technician: 'علي السوداني', status: 'completed', cost: 45000, partsCost: 22000, receivedAt: new Date(Date.now() - 86400000 * 5).toISOString(), createdAt: new Date().toISOString() },
      { id: uuidv4(), ticketNumber: 'RP-1003', customerName: 'فاطمة جواد', phone: '07801122334', device: 'iPhone 12', imei: '358901234567890', issue: 'لا يشحن', technician: 'علي السوداني', status: 'pending', cost: 25000, partsCost: 0, receivedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    ]);
  }

  const camContracts = await db.collection('camera_contracts').countDocuments();
  if (camContracts === 0) {
    await db.collection('camera_contracts').insertMany([
      { id: uuidv4(), client: 'مطعم الشواء الذهبي', location: 'الكرادة', cameras: 8, type: 'تركيب + صيانة', value: 2400000, status: 'active', startDate: new Date(Date.now() - 86400000 * 30).toISOString().slice(0, 10), createdAt: new Date().toISOString() },
      { id: uuidv4(), client: 'مكتب المحامي عباس', location: 'المنصور', cameras: 4, type: 'تركيب', value: 850000, status: 'active', startDate: new Date(Date.now() - 86400000 * 60).toISOString().slice(0, 10), createdAt: new Date().toISOString() },
      { id: uuidv4(), client: 'محل ذهب الزين', location: 'الجادرية', cameras: 12, type: 'تركيب + صيانة سنوية', value: 4200000, status: 'pending', startDate: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() },
    ]);
  }

  // ============ PACKAGES ============
  const pkgCount = await db.collection('packages').countDocuments();
  if (pkgCount === 0) {
    await db.collection('packages').insertMany([
      { id: uuidv4(), name: 'باقة ذهبية 25', speed: '25 Mbps', monthlyFee: 25000, durationDays: 30, profitShare: 20, active: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'باقة فضية 50', speed: '50 Mbps', monthlyFee: 35000, durationDays: 30, profitShare: 22, active: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'باقة بلاتينية 100', speed: '100 Mbps', monthlyFee: 50000, durationDays: 30, profitShare: 25, active: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'باقة VIP 200', speed: '200 Mbps', monthlyFee: 75000, durationDays: 30, profitShare: 30, active: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'باقة فايبر 500', speed: '500 Mbps', monthlyFee: 150000, durationDays: 30, profitShare: 35, active: true, createdAt: new Date().toISOString() },
    ]);
  }

  // ============ AGENTS (الوكلاء) ============
  const agentsCount = await db.collection('agents').countDocuments();
  if (agentsCount === 0) {
    await db.collection('agents').insertMany([
      { id: uuidv4(), name: 'وكيل الكرادة', username: 'karada', password: 'karada123', phone: '07901111000', branch: 'الكرادة', commission: 20, balance: 0, totalActivations: 0, totalProfit: 0, status: 'active', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'وكيل المنصور', username: 'mansour', password: 'mansour123', phone: '07902222000', branch: 'المنصور', commission: 22, balance: 0, totalActivations: 0, totalProfit: 0, status: 'active', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'وكيل الجادرية', username: 'jadriya', password: 'jadriya123', phone: '07903333000', branch: 'الجادرية', commission: 18, balance: 0, totalActivations: 0, totalProfit: 0, status: 'active', createdAt: new Date().toISOString() },
    ]);
  }

  // ============ NETWORKS / FATs (الشبكات والفاتات) ============
  const netCount = await db.collection('networks').countDocuments();
  if (netCount === 0) {
    const zones = await db.collection('zones').find({}).toArray();
    const networks = [];
    let counter = 1;
    for (const z of zones) {
      for (let f = 1; f <= (z.fats || 2); f++) {
        networks.push({
          id: uuidv4(),
          number: `F-${String(counter).padStart(2, '0')}-${String(f).padStart(2, '0')}`,
          name: `فاتة ${f} - ${z.name}`,
          zoneId: z.id,
          zoneName: z.name,
          zoneNumber: z.number,
          capacity: 32,
          subscribers: 0,
          status: z.status === 'offline' ? 'stopped' : (z.status === 'warning' ? 'weak' : 'active'),
          lat: (z.lat || 33.3) + (Math.random() - 0.5) * 0.02,
          lng: (z.lng || 44.4) + (Math.random() - 0.5) * 0.02,
          utilization: Math.floor(Math.random() * 80) + 10,
          installedAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 200)).toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      counter++;
    }
    if (networks.length > 0) await db.collection('networks').insertMany(networks);
  }

  // Backfill subscribers with: agentId, networkId, username, userLat/Lng, cabinetLat/Lng
  const subsToBackfill = await db.collection('subscribers').find({ $or: [{ agentId: { $exists: false } }, { username: { $exists: false } }] }).toArray();
  if (subsToBackfill.length > 0) {
    const agents = await db.collection('agents').find({}).toArray();
    const networks = await db.collection('networks').find({}).toArray();
    let i = 0;
    for (const s of subsToBackfill) {
      const updates = {};
      const zoneNetworks = networks.filter(n => n.zoneId === s.zoneId);
      const net = zoneNetworks[i % Math.max(1, zoneNetworks.length)];
      if (!s.username) updates.username = `user_${(s.phone || '').slice(-4) || (i + 1).toString().padStart(4, '0')}`;
      if (!s.agentId && agents.length > 0) {
        const a = agents[i % agents.length];
        updates.agentId = a.id; updates.agentName = a.name;
      }
      if (!s.networkId && net) {
        updates.networkId = net.id; updates.fatNumber = net.number;
      }
      if (!s.userLat) updates.userLat = 33.31 + (Math.random() - 0.5) * 0.05;
      if (!s.userLng) updates.userLng = 44.4 + (Math.random() - 0.5) * 0.05;
      if (!s.cabinetLat && net) updates.cabinetLat = net.lat;
      if (!s.cabinetLng && net) updates.cabinetLng = net.lng;
      if (Object.keys(updates).length > 0) {
        await db.collection('subscribers').updateOne({ id: s.id }, { $set: updates });
      }
      i++;
    }
    // Update network subscriber counts
    const allNets = await db.collection('networks').find({}).toArray();
    for (const n of allNets) {
      const c = await db.collection('subscribers').countDocuments({ networkId: n.id });
      await db.collection('networks').updateOne({ id: n.id }, { $set: { subscribers: c } });
    }
  }
}

function ok(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' },
  });
}
function err(message, status = 400) { return ok({ error: message }, status); }

export async function OPTIONS() { return ok({}); }

async function getJsonBody(request) { try { return await request.json(); } catch { return {}; } }

async function handle(request, params) {
  const path = (params?.path || []).join('/');
  const method = request.method;
  const db = await getDb();

  if (!path) return ok({ name: 'Ghazlan ERP API', version: '1.0', status: 'running' });

  if (path === 'dashboard/stats' && method === 'GET') {
    const totalProducts = await db.collection('products').countDocuments();
    const totalSubscribers = await db.collection('subscribers').countDocuments();
    const activeSubscribers = await db.collection('subscribers').countDocuments({ status: 'active' });
    const totalRepairs = await db.collection('repairs').countDocuments();
    const pendingRepairs = await db.collection('repairs').countDocuments({ status: { $in: ['pending', 'in_progress'] } });
    const totalEmployees = await db.collection('employees').countDocuments();
    const zones = await db.collection('zones').find({}).toArray();
    const onlineZones = zones.filter(z => z.status === 'online').length;
    const sales = await db.collection('sales').find({}).toArray();
    const totalRevenue = sales.reduce((s, x) => s + (x.total || 0), 0);
    const subs = await db.collection('subscribers').find({}).toArray();
    const monthlyIncome = subs.filter(s => s.status === 'active').reduce((s, x) => s + (x.fee || 0), 0);
    const totalDebt = subs.reduce((s, x) => s + (x.debt || 0), 0);
    const lowStock = await db.collection('products').find({ $expr: { $lte: ['$stock', '$lowStockAlert'] } }).toArray();

    const now = Date.now();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 86400000);
      const dayStart = new Date(day.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = dayStart + 86400000;
      const daySales = sales.filter(s => {
        const t = new Date(s.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      });
      const dateStr = new Date(dayStart).toLocaleDateString('ar-IQ', { weekday: 'short' });
      days.push({ name: dateStr, sales: daySales.reduce((s, x) => s + (x.total || 0), 0), orders: daySales.length });
    }

    return ok({
      totalProducts, totalSubscribers, activeSubscribers, totalRepairs, pendingRepairs,
      totalEmployees, totalZones: zones.length, onlineZones, totalRevenue, monthlyIncome,
      totalDebt, lowStockCount: lowStock.length, lowStock: lowStock.slice(0, 5).map(p => { delete p._id; return p; }),
      salesChart: days,
    });
  }

  const collections = {
    'products': 'products',
    'subscribers': 'subscribers',
    'zones': 'zones',
    'repairs': 'repairs',
    'employees': 'employees',
    'customers': 'customers',
    'sales': 'sales',
    'camera-contracts': 'camera_contracts',
    'agents': 'agents',
    'networks': 'networks',
    'packages': 'packages',
    'activations': 'activations',
    'whatsapp-messages': 'whatsapp_messages',
    'activity-logs': 'activity_logs',
  };

  for (const [route, coll] of Object.entries(collections)) {
    if (path === route && method === 'GET') {
      const data = await db.collection(coll).find({}).sort({ createdAt: -1 }).toArray();
      return ok(data.map(d => { delete d._id; return d; }));
    }
    if (path === route && method === 'POST') {
      const body = await getJsonBody(request);
      const doc = { id: uuidv4(), ...body, createdAt: new Date().toISOString() };
      if (coll === 'repairs' && !doc.ticketNumber) {
        const count = await db.collection('repairs').countDocuments();
        doc.ticketNumber = `RP-${1000 + count + 1}`;
      }
      await db.collection(coll).insertOne(doc);
      delete doc._id;
      if (coll === 'subscribers' && doc.zoneId) {
        const c = await db.collection('subscribers').countDocuments({ zoneId: doc.zoneId });
        await db.collection('zones').updateOne({ id: doc.zoneId }, { $set: { subscribers: c } });
      }
      return ok(doc, 201);
    }
    if (path.startsWith(route + '/') && method === 'PUT') {
      const id = path.split('/')[1];
      const body = await getJsonBody(request);
      delete body._id; delete body.id;
      await db.collection(coll).updateOne({ id }, { $set: body });
      const updated = await db.collection(coll).findOne({ id });
      if (updated) delete updated._id;
      return ok(updated);
    }
    if (path.startsWith(route + '/') && method === 'DELETE') {
      const id = path.split('/')[1];
      const doc = await db.collection(coll).findOne({ id });
      await db.collection(coll).deleteOne({ id });
      if (coll === 'subscribers' && doc?.zoneId) {
        const c = await db.collection('subscribers').countDocuments({ zoneId: doc.zoneId });
        await db.collection('zones').updateOne({ id: doc.zoneId }, { $set: { subscribers: c } });
      }
      return ok({ success: true });
    }
  }

  // ============ SUBSCRIBER ACTIVATION (مهم جداً) ============
  if (path.match(/^subscribers\/[^/]+\/activate$/) && method === 'POST') {
    const subId = path.split('/')[1];
    const body = await getJsonBody(request);
    const { packageId, speed, amount, paymentMethod = 'cash', durationMonths = 1, agentId, notes = '', processedBy = 'النظام' } = body;
    const subscriber = await db.collection('subscribers').findOne({ id: subId });
    if (!subscriber) return err('المشترك غير موجود', 404);
    const pkg = packageId ? await db.collection('packages').findOne({ id: packageId }) : null;
    const agent = agentId ? await db.collection('agents').findOne({ id: agentId }) : null;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationMonths * 30 * 86400000);
    const finalSpeed = speed || pkg?.speed || subscriber.package || '50 Mbps';
    const finalAmount = Number(amount || pkg?.monthlyFee * durationMonths || 0);
    // Profit calc
    const commissionRate = agent?.commission || 0;
    const agentProfit = Math.floor(finalAmount * commissionRate / 100);
    const companyProfit = finalAmount - agentProfit;

    // Create activation record
    const activation = {
      id: uuidv4(),
      subscriberId: subId,
      subscriberName: subscriber.name,
      subscriberPhone: subscriber.phone,
      username: subscriber.username || `user_${(subscriber.phone || '').slice(-4)}`,
      packageId: pkg?.id || null,
      packageName: pkg?.name || subscriber.package || finalSpeed,
      speed: finalSpeed,
      amount: finalAmount,
      paymentMethod,
      durationMonths,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      agentId: agent?.id || null,
      agentName: agent?.name || 'المركز الرئيسي',
      agentProfit,
      companyProfit,
      processedBy,
      notes,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    await db.collection('activations').insertOne(activation);
    delete activation._id;

    // Update subscriber
    await db.collection('subscribers').updateOne({ id: subId }, {
      $set: {
        status: 'active',
        package: finalSpeed,
        fee: pkg?.monthlyFee || subscriber.fee || finalAmount,
        debt: 0,
        dueDate: endDate.toISOString().slice(0, 10),
        agentId: agent?.id || subscriber.agentId,
        agentName: agent?.name || subscriber.agentName,
        lastActivationAt: new Date().toISOString(),
      }
    });

    // Update agent stats
    if (agent) {
      await db.collection('agents').updateOne({ id: agent.id }, {
        $inc: { totalActivations: 1, totalProfit: agentProfit, balance: agentProfit },
      });
    }

    // Build WhatsApp message
    const waMsg = `🎉 *تم تفعيل اشتراكك بنجاح* 🎉

عزيزي *${subscriber.name}*، تفاصيل اشتراكك:

👤 *اليوزر:* ${activation.username}
🆔 *المعرف:* ${subId.slice(0, 8).toUpperCase()}
📦 *الباقة:* ${activation.packageName}
⚡ *السرعة:* ${finalSpeed}
💰 *المبلغ:* ${finalAmount.toLocaleString()} د.ع
💳 *طريقة الدفع:* ${({cash:'كاش',master:'ماستر',fastpay:'فاست باي',transfer:'تحويل'})[paymentMethod] || paymentMethod}
📅 *تاريخ التفعيل:* ${startDate.toLocaleDateString('ar-IQ')}
⏰ *تاريخ الانتهاء:* ${endDate.toLocaleDateString('ar-IQ')}
🏢 *الفرع/الوكيل:* ${activation.agentName}

شكراً لاختيارك *مركز الغزلان* 🌟
للاستفسار: 07901234567`;

    const waLog = {
      id: uuidv4(),
      subscriberId: subId,
      subscriberName: subscriber.name,
      activationId: activation.id,
      phone: subscriber.phone,
      type: 'activation',
      message: waMsg,
      status: 'queued', // pending real API; will become 'sent' when integrated
      retries: 0,
      createdAt: new Date().toISOString(),
    };
    await db.collection('whatsapp_messages').insertOne(waLog);
    delete waLog._id;

    // Manager notification (Telegram log + WhatsApp manager copy)
    const managerMsg = `🔔 *تفعيل جديد*
👤 ${subscriber.name} (${subscriber.phone})
📦 ${activation.packageName} - ${finalSpeed}
💰 ${finalAmount.toLocaleString()} د.ع (${paymentMethod})
👨‍💼 ${activation.agentName}
⏰ ينتهي: ${endDate.toLocaleDateString('ar-IQ')}`;
    await db.collection('whatsapp_messages').insertOne({
      id: uuidv4(), subscriberId: subId, activationId: activation.id, phone: 'MANAGER',
      type: 'manager_alert', message: managerMsg, status: 'queued', retries: 0,
      createdAt: new Date().toISOString(),
    });

    // Activity log
    await db.collection('activity_logs').insertOne({
      id: uuidv4(),
      user: processedBy,
      action: 'subscriber_activation',
      entity: 'subscriber',
      entityId: subId,
      details: `تفعيل ${subscriber.name} بباقة ${activation.packageName} لمدة ${durationMonths} شهر بمبلغ ${finalAmount.toLocaleString()} د.ع`,
      timestamp: new Date().toISOString(),
    });

    return ok({ activation, whatsappMessage: waMsg, success: true }, 201);
  }

  // Resend WhatsApp message
  if (path.match(/^whatsapp-messages\/[^/]+\/resend$/) && method === 'POST') {
    const id = path.split('/')[1];
    const msg = await db.collection('whatsapp_messages').findOne({ id });
    if (!msg) return err('الرسالة غير موجودة', 404);
    await db.collection('whatsapp_messages').updateOne({ id }, {
      $inc: { retries: 1 },
      $set: { status: 'queued', lastRetryAt: new Date().toISOString() },
    });
    return ok({ success: true, message: 'تم إعادة وضع الرسالة في الطابور' });
  }

  // Agent stats
  if (path.match(/^agents\/[^/]+\/stats$/) && method === 'GET') {
    const id = path.split('/')[1];
    const agent = await db.collection('agents').findOne({ id });
    if (!agent) return err('الوكيل غير موجود', 404);
    delete agent._id;
    const subscribers = await db.collection('subscribers').find({ agentId: id }).toArray();
    const activations = await db.collection('activations').find({ agentId: id }).sort({ createdAt: -1 }).toArray();
    const totalRevenue = activations.reduce((s, a) => s + (a.amount || 0), 0);
    const totalProfit = activations.reduce((s, a) => s + (a.agentProfit || 0), 0);
    const totalDebt = subscribers.reduce((s, x) => s + (x.debt || 0), 0);
    // Expiring soon (next 7 days)
    const soon = new Date(Date.now() + 7 * 86400000);
    const expiringSoon = subscribers.filter(s => s.dueDate && new Date(s.dueDate) <= soon && s.status === 'active').length;
    return ok({
      agent,
      stats: {
        totalSubscribers: subscribers.length,
        activeSubscribers: subscribers.filter(s => s.status === 'active').length,
        totalActivations: activations.length,
        totalRevenue,
        totalProfit,
        totalDebt,
        expiringSoon,
      },
      subscribers: subscribers.map(s => { delete s._id; return s; }),
      activations: activations.slice(0, 20).map(a => { delete a._id; return a; }),
    });
  }

  // Agent login
  if (path === 'agents/login' && method === 'POST') {
    const { username, password } = await getJsonBody(request);
    const agent = await db.collection('agents').findOne({ username, password });
    if (!agent) return err('بيانات تسجيل الدخول خاطئة', 401);
    delete agent._id;
    return ok({ success: true, agent, token: `agent_${agent.id}_${Date.now()}` });
  }

  if (path === 'pos/checkout' && method === 'POST') {
    let subtotal = 0;
    for (const it of items) {
      subtotal += (it.price || 0) * (it.quantity || 1);
      await db.collection('products').updateOne(
        { id: it.id },
        { $inc: { stock: -(it.quantity || 1) } }
      );
    }
    const total = Math.max(0, subtotal - discount);
    const sale = {
      id: uuidv4(),
      invoiceNumber: `INV-${Date.now()}`,
      items, subtotal, discount, total, paymentMethod, cashier, customer,
      createdAt: new Date().toISOString(),
    };
    await db.collection('sales').insertOne(sale);
    delete sale._id;
    return ok(sale, 201);
  }

  if (path.startsWith('products/barcode/') && method === 'GET') {
    const barcode = path.split('/')[2];
    const product = await db.collection('products').findOne({ barcode });
    if (!product) return err('المنتج غير موجود', 404);
    delete product._id;
    return ok(product);
  }

  if (path === 'noc/status' && method === 'GET') {
    const zones = await db.collection('zones').find({}).toArray();
    const subscribers = await db.collection('subscribers').countDocuments({ status: 'active' });
    return ok({
      zones: zones.map(z => { delete z._id; return { ...z, ping: Math.floor(Math.random() * 30) + 5, packetLoss: z.status === 'offline' ? 100 : (z.status === 'warning' ? Math.random() * 5 : Math.random() * 1), uplink: Math.floor(Math.random() * 800) + 100, downlink: Math.floor(Math.random() * 900) + 100 }; }),
      activeConnections: subscribers,
      totalTraffic: Math.floor(Math.random() * 5000) + 3000,
      alerts: zones.filter(z => z.status !== 'online').map(z => ({ id: z.id, type: z.status === 'offline' ? 'critical' : 'warning', message: z.status === 'offline' ? `الزون ${z.name} مفصول!` : `الزون ${z.name} ضغط عالي (${z.utilization}%)`, time: new Date().toISOString() })),
    });
  }

  if (path === 'reports/summary' && method === 'GET') {
    const sales = await db.collection('sales').find({}).toArray();
    const subs = await db.collection('subscribers').find({}).toArray();
    const repairs = await db.collection('repairs').find({}).toArray();
    const products = await db.collection('products').find({}).toArray();

    const totalSales = sales.reduce((s, x) => s + (x.total || 0), 0);
    const ispRevenue = subs.filter(s => s.status === 'active').reduce((s, x) => s + (x.fee || 0), 0);
    const repairRevenue = repairs.filter(r => r.status === 'completed').reduce((s, x) => s + (x.cost || 0), 0);
    const inventoryValue = products.reduce((s, p) => s + (p.cost || 0) * (p.stock || 0), 0);
    const categoryBreakdown = {};
    for (const p of products) {
      categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + p.stock;
    }
    return ok({
      totalSales, ispRevenue, repairRevenue, inventoryValue,
      totalRevenue: totalSales + ispRevenue + repairRevenue,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
      pieData: [
        { name: 'مبيعات POS', value: totalSales },
        { name: 'اشتراكات ISP', value: ispRevenue },
        { name: 'صيانة', value: repairRevenue },
      ],
    });
  }

  if (path === 'ai/chat' && method === 'POST') {
    const body = await getJsonBody(request);
    const { message, history = [] } = body;
    if (!message) return err('الرسالة فارغة');
    try {
      const stats = await db.collection('subscribers').find({}).toArray();
      const products = await db.collection('products').find({}).toArray();
      const repairs = await db.collection('repairs').find({}).toArray();
      const zones = await db.collection('zones').find({}).toArray();
      const sales = await db.collection('sales').find({}).toArray();
      const ctx = {
        subscribers: { total: stats.length, active: stats.filter(s => s.status === 'active').length, debt: stats.reduce((s, x) => s + (x.debt || 0), 0) },
        inventory: { totalProducts: products.length, lowStock: products.filter(p => p.stock <= p.lowStockAlert).map(p => p.name) },
        repairs: { total: repairs.length, pending: repairs.filter(r => r.status !== 'completed').length },
        zones: zones.map(z => ({ name: z.name, status: z.status, utilization: z.utilization })),
        sales: { count: sales.length, total: sales.reduce((s, x) => s + (x.total || 0), 0) },
      };
      const sysPrompt = `أنت "غزلان AI" - المساعد الذكي لمنصة مركز الغزلان ERP. أنت خبير في:
- إدارة شركات الإنترنت (ISP) والشبكات
- نظام نقاط البيع POS وإدارة المخزون
- صيانة الهواتف
- تحليل الأعمال واقتراح القرارات
- الكاميرات والأمن

البيانات الحالية للشركة: ${JSON.stringify(ctx, null, 2)}

أجب دائماً باللغة العربية، بشكل مختصر ودقيق ومفيد. استخدم الأرقام والإحصائيات من البيانات أعلاه. كن ودوداً ومحترفاً.`;

      const messages = [
        { role: 'system', content: sysPrompt },
        ...history.slice(-10),
        { role: 'user', content: message },
      ];

      const resp = await fetch('https://integrations.emergentagent.com/llm/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EMERGENT_LLM_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error('LLM error', data);
        return err(data?.error?.message || 'فشل في الاتصال بالذكاء الاصطناعي', 500);
      }
      const reply = data.choices?.[0]?.message?.content || 'لم أستطع توليد رد';
      return ok({ reply });
    } catch (e) {
      console.error('AI error', e);
      return err('خطأ في AI: ' + e.message, 500);
    }
  }

  if (path === 'ai/insights' && method === 'GET') {
    const products = await db.collection('products').find({}).toArray();
    const subs = await db.collection('subscribers').find({}).toArray();
    const zones = await db.collection('zones').find({}).toArray();

    const insights = [];
    const lowStock = products.filter(p => p.stock <= p.lowStockAlert);
    if (lowStock.length > 0) {
      insights.push({ type: 'warning', icon: '📦', title: 'منتجات على وشك النفاد', message: `يوجد ${lowStock.length} منتج بحاجة لإعادة طلب: ${lowStock.slice(0, 3).map(p => p.name).join('، ')}` });
    }
    const debt = subs.filter(s => s.debt > 0);
    if (debt.length > 0) {
      insights.push({ type: 'info', icon: '💰', title: 'مستحقات مالية', message: `${debt.length} مشترك لديه ديون بإجمالي ${debt.reduce((s, x) => s + x.debt, 0).toLocaleString()} د.ع` });
    }
    const offlineZones = zones.filter(z => z.status === 'offline');
    if (offlineZones.length > 0) {
      insights.push({ type: 'critical', icon: '🚨', title: 'زونات مفصولة', message: `${offlineZones.length} زون خارج الخدمة: ${offlineZones.map(z => z.name).join('، ')}` });
    }
    const highUtil = zones.filter(z => z.utilization > 85);
    if (highUtil.length > 0) {
      insights.push({ type: 'warning', icon: '⚡', title: 'ضغط عالي على الشبكة', message: `${highUtil.length} زون يحتاج توسعة: ${highUtil.map(z => `${z.name} (${z.utilization}%)`).join('، ')}` });
    }
    const deadStock = products.filter(p => p.stock > 50);
    if (deadStock.length > 0) {
      insights.push({ type: 'info', icon: '📊', title: 'مخزون راكد', message: `${deadStock.length} منتج كميته كبيرة، فكر بعمل عرض ترويجي` });
    }
    if (insights.length === 0) {
      insights.push({ type: 'success', icon: '✨', title: 'كل شيء على ما يرام', message: 'لا توجد تنبيهات حالياً، استمر بالعمل الرائع!' });
    }
    return ok({ insights });
  }

  return err(`Route not found: ${method} /${path}`, 404);
}

export async function GET(request, { params }) { try { return await handle(request, params); } catch (e) { console.error(e); return err(e.message, 500); } }
export async function POST(request, { params }) { try { return await handle(request, params); } catch (e) { console.error(e); return err(e.message, 500); } }
export async function PUT(request, { params }) { try { return await handle(request, params); } catch (e) { console.error(e); return err(e.message, 500); } }
export async function DELETE(request, { params }) { try { return await handle(request, params); } catch (e) { console.error(e); return err(e.message, 500); } }
export async function PATCH(request, { params }) { try { return await handle(request, params); } catch (e) { console.error(e); return err(e.message, 500); } }
