import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ghazlan_erp';
const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY;

const SETTINGS_DEFAULTS = {
  general: {
    companyName: 'مركز الغزلان',
    companyNameEn: 'Ghazlan Center',
    logo: '🌟',
    address: 'بغداد - العراق',
    phone: '07901234567',
    email: 'info@ghazlan.iq',
    website: 'https://ghazlan.iq',
    currency: 'IQD',
    currencySymbol: 'د.ع',
    timezone: 'Asia/Baghdad',
    language: 'ar',
    fiscalYearStart: '01-01',
    branches: ['الفرع الرئيسي', 'فرع الكرادة', 'فرع المنصور'],
  },
  users: {
    requireApproval: true,
    allowSelfRegistration: false,
    defaultRole: 'cashier',
    roles: [
      { id: 'admin', name: 'مدير عام', permissions: ['all'] },
      { id: 'manager', name: 'مدير فرع', permissions: ['view_reports', 'manage_subscribers', 'manage_inventory'] },
      { id: 'cashier', name: 'كاشير', permissions: ['pos', 'view_inventory'] },
      { id: 'technician', name: 'فني', permissions: ['manage_repairs', 'manage_networks'] },
      { id: 'agent', name: 'وكيل', permissions: ['view_own_subscribers', 'activate'] },
    ],
  },
  agents: {
    defaultCommission: 20,
    allowSelfActivation: true,
    autoDisableOnDebt: true,
    maxDebt: 500000,
    portalUrl: '/agent',
    requireQRLogin: false,
    sessionTimeout: 30,
  },
  subscribers: {
    defaultPackage: '50 Mbps',
    defaultFee: 35000,
    gracePeriodDays: 3,
    autoSuspendOnExpiry: true,
    debtLimit: 100000,
    autoNotifyBeforeExpiry: 5,
    requireIMEI: false,
    autoGenerateUsername: true,
    usernamePattern: 'user_{phone4}',
  },
  zones: {
    defaultCapacity: 32,
    warningThreshold: 80,
    criticalThreshold: 95,
    autoStatusUpdate: true,
    monitoringInterval: 60,
    defaultMapProvider: 'osm',
  },
  invoices: {
    invoicePrefix: 'INV-',
    startingNumber: 1000,
    taxEnabled: false,
    taxRate: 0,
    debtAlertDays: 7,
    autoReminder: true,
    reminderChannels: ['whatsapp'],
    footerNote: 'شكراً لتعاملكم معنا',
  },
  packages: {
    defaultDurationDays: 30,
    allowCustomDuration: true,
    enabledPaymentMethods: ['cash', 'master', 'fastpay', 'transfer'],
    defaultProfitShare: 20,
    proRateOnUpgrade: true,
    requireFullPayment: false,
  },
  whatsapp: {
    enabled: false,
    provider: 'cloud',
    apiToken: '',
    phoneNumberId: '',
    senderName: 'مركز الغزلان',
    activationTemplate: 'auto',
    expiryTemplate: 'auto',
    debtTemplate: 'auto',
    sendToManager: true,
    managerPhone: '07901234567',
  },
  telegram: {
    enabled: false,
    botToken: '',
    managerChatId: '',
    channelId: '',
    sendActivations: true,
    sendAlerts: true,
    sendDailyReport: true,
    reportTime: '20:00',
  },
  notifications: {
    activation: { whatsapp: true, telegram: true, email: false, sms: false, push: true },
    expiry: { whatsapp: true, telegram: false, email: false, sms: false, push: true },
    debt: { whatsapp: true, telegram: true, email: false, sms: false, push: true },
    lowStock: { whatsapp: false, telegram: true, email: true, sms: false, push: true },
    networkAlert: { whatsapp: false, telegram: true, email: false, sms: false, push: true },
    newSubscriber: { whatsapp: false, telegram: true, email: false, sms: false, push: false },
  },
  maps: {
    provider: 'osm',
    defaultLat: 33.3060,
    defaultLng: 44.4180,
    defaultZoom: 12,
    googleApiKey: '',
    showZones: true,
    showNetworks: true,
    showSubscribers: false,
    clusterMarkers: true,
  },
  printing: {
    paperSize: '80mm',
    receiptHeader: 'مركز الغزلان\nبغداد - العراق\n07901234567',
    receiptFooter: 'شكراً لزيارتكم 🙏\nصالح لمدة 7 أيام للاسترداد',
    showLogo: true,
    showBarcode: true,
    showQR: true,
    copies: 1,
    autoOpenCashDrawer: false,
  },
  backup: {
    enabled: true,
    schedule: 'daily',
    time: '03:00',
    retentionDays: 30,
    location: 'local',
    cloudProvider: '',
    encrypt: true,
    lastBackup: null,
  },
  security: {
    sessionTimeoutMinutes: 60,
    passwordMinLength: 6,
    requireStrongPassword: false,
    twoFAEnabled: false,
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
    ipWhitelist: [],
    auditLogEnabled: true,
    forceLogoutOnPasswordChange: true,
  },
  reports: {
    defaultPeriod: 'monthly',
    emailReportsToManager: false,
    scheduleReports: false,
    reportTime: '08:00',
    includeCharts: true,
    exportFormats: ['pdf', 'excel'],
    keepReportsDays: 365,
  },
  employees: {
    workStart: '08:00',
    workEnd: '17:00',
    workDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
    overtimeRate: 1.5,
    gpsTrackingEnabled: false,
    requireFingerprint: false,
    requireFaceRecognition: false,
    autoAssignTasks: false,
    kpiTarget: 80,
    lateGraceMinutes: 10,
    lateDeductionAmount: 25000,
    lateDeductionMode: 'fixed', // 'fixed' or 'per_minute'
    lateDeductionPerMinute: 500,
    absentDeductionAmount: 50000,
    autoCalculatePayroll: true,
    autoDeductionEnabled: true,
    yearlyLeaveAllowance: 24,
  },
};

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
    const PERM_ALL = ['sales','pos','subscribers','employees','tasks','reports','repairs','isp','agents','finance','settings'];
    await db.collection('employees').insertMany([
      { id: uuidv4(), employeeId: 'EMP-001', name: 'كرار الغزلان', username: 'karar', password: 'admin123', role: 'مدير عام', phone: '07901111111', salary: 1500000, kpi: 95, attendance: 'present', photo: '👨‍💼', shiftStart: '08:00', shiftEnd: '17:00', permissions: PERM_ALL, status: 'active', createdAt: new Date().toISOString() },
      { id: uuidv4(), employeeId: 'EMP-002', name: 'حيدر الموسوي', username: 'haidar', password: 'tech123', role: 'فني شبكات أول', phone: '07902222222', salary: 800000, kpi: 88, attendance: 'present', photo: '👨‍🔧', shiftStart: '08:00', shiftEnd: '17:00', permissions: ['isp','repairs','tasks'], status: 'active', createdAt: new Date().toISOString() },
      { id: uuidv4(), employeeId: 'EMP-003', name: 'علي السوداني', username: 'ali', password: 'repair123', role: 'فني صيانة هواتف', phone: '07903333333', salary: 700000, kpi: 92, attendance: 'present', photo: '🛠️', shiftStart: '09:00', shiftEnd: '18:00', permissions: ['repairs','tasks'], status: 'active', createdAt: new Date().toISOString() },
      { id: uuidv4(), employeeId: 'EMP-004', name: 'زهراء حسين', username: 'zahra', password: 'cash123', role: 'كاشير', phone: '07904444444', salary: 600000, kpi: 85, attendance: 'late', photo: '💁‍♀️', shiftStart: '08:00', shiftEnd: '16:00', permissions: ['pos','sales','tasks'], status: 'active', createdAt: new Date().toISOString() },
      { id: uuidv4(), employeeId: 'EMP-005', name: 'مصطفى الجبوري', username: 'mustafa', password: 'cam123', role: 'فني كاميرات', phone: '07905555555', salary: 750000, kpi: 78, attendance: 'absent', photo: '📹', shiftStart: '09:00', shiftEnd: '18:00', permissions: ['repairs','tasks'], status: 'active', createdAt: new Date().toISOString() },
    ]);
  } else {
    // Backfill new fields for existing employees
    const allEmps = await db.collection('employees').find({}).toArray();
    let i = 1;
    for (const e of allEmps) {
      const updates = {};
      if (!e.employeeId) updates.employeeId = `EMP-${String(i).padStart(3, '0')}`;
      if (!e.username) updates.username = (e.name || 'emp').toLowerCase().replace(/[^a-z]/g, '').slice(0, 8) || `emp${i}`;
      if (!e.password) updates.password = 'pass123';
      if (!e.photo) updates.photo = '👤';
      if (!e.shiftStart) updates.shiftStart = '08:00';
      if (!e.shiftEnd) updates.shiftEnd = '17:00';
      if (!e.permissions) updates.permissions = ['tasks'];
      if (!e.status) updates.status = 'active';
      if (Object.keys(updates).length > 0) await db.collection('employees').updateOne({ id: e.id }, { $set: updates });
      i++;
    }
  }

  // Seed sample tasks
  const tasksCount = await db.collection('tasks').countDocuments();
  if (tasksCount === 0) {
    const emps = await db.collection('employees').find({}).toArray();
    if (emps.length >= 2) {
      await db.collection('tasks').insertMany([
        { id: uuidv4(), title: 'صيانة فاتة الكرادة F-01-03', description: 'فحص الكابل وإعادة الاتصال', priority: 'high', dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), assignedTo: emps[1].id, assignedToName: emps[1].name, status: 'in_progress', progress: 60, notes: '', attachments: [], createdBy: emps[0].name, createdById: emps[0].id, acceptedAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: uuidv4(), title: 'تركيب كاميرا مطعم الذهبي', description: '8 كاميرات + NVR', priority: 'medium', dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), assignedTo: emps[2].id, assignedToName: emps[2].name, status: 'pending', progress: 0, notes: '', attachments: [], createdBy: emps[0].name, createdById: emps[0].id, createdAt: new Date().toISOString() },
        { id: uuidv4(), title: 'جرد المخزون الأسبوعي', description: 'جرد كل الإكسسوارات', priority: 'low', dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), assignedTo: emps.length > 3 ? emps[3].id : emps[1].id, assignedToName: emps.length > 3 ? emps[3].name : emps[1].name, status: 'pending', progress: 0, notes: '', attachments: [], createdBy: emps[0].name, createdById: emps[0].id, createdAt: new Date().toISOString() },
      ]);
    }
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

  // ============ SETTINGS Initialize ============
  const settingsDoc = await db.collection('settings').findOne({ id: 'system' });
  if (!settingsDoc) {
    await db.collection('settings').insertOne({
      id: 'system',
      ...SETTINGS_DEFAULTS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
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

// ============ GLOBAL HELPERS ============
async function logActivity(db, { action, entity, entityId, user, userId, details, ip }) {
  try {
    await db.collection('activity_logs').insertOne({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action, entity, entityId, user: user || 'system', userId: userId || null,
      details: details || '', ip: ip || null,
      timestamp: new Date().toISOString(),
    });
  } catch (e) { console.error('logActivity failed', e); }
}

async function sendTelegram(db, text) {
  try {
    const s = await db.collection('settings').findOne({ id: 'system' });
    const tg = s?.telegram || {};
    if (!tg.enabled || !tg.botToken || !tg.managerChatId) return { ok: false, skipped: true };
    const r = await fetch(`https://api.telegram.org/bot${tg.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tg.managerChatId, text, parse_mode: 'HTML' }),
    });
    const d = await r.json();
    return { ok: d.ok === true, response: d };
  } catch (e) {
    console.error('Telegram error', e);
    return { ok: false, error: e.message };
  }
}

async function notifyManager(db, { title, message, type, taskId, employeeId }) {
  // 1) In-app notification for all managers (employees with 'all' or 'employees' permission)
  const managers = await db.collection('employees').find({
    $or: [{ permissions: 'all' }, { role: { $regex: 'مدير' } }]
  }).toArray();
  const now = new Date().toISOString();
  for (const m of managers) {
    await db.collection('notifications').insertOne({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: m.id, type, title, message, taskId: taskId || null,
      employeeId: employeeId || null, read: false, createdAt: now,
    });
  }
  // 2) Telegram to manager
  await sendTelegram(db, `<b>${title}</b>\n${message}`);
}

import { tgSend, tgEdit, tgAnswerCallback, buildHome, buildReports, buildEmployees, buildSubscribers, buildFinance, buildMaintenance, buildNetwork, buildMe, buildLogs, buildAdmin, ROLE_DEFAULT_PERMS, PERMS_ALL } from '@/lib/telegram-bot';
import bcrypt from 'bcryptjs';

const isBcrypt = (s) => typeof s === 'string' && s.startsWith('$2');
const verifyPassword = async (plain, stored) => {
  if (!stored) return false;
  if (isBcrypt(stored)) return bcrypt.compare(plain, stored);
  return plain === stored; // legacy plaintext fallback
};
const hashPassword = async (plain) => bcrypt.hash(plain, 10);

async function handle(request, params) {
  const path = (params?.path || []).join('/');
  const method = request.method;
  const db = await getDb();
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';

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
    'attendance': 'attendance',
    'tasks': 'tasks',
    'payroll-entries': 'payroll_entries',
  };

  // Hash password when creating an employee
  if (path === 'employees' && method === 'POST') {
    const body = await getJsonBody(request);
    if (body.password) body.password = await hashPassword(body.password);
    const doc = { id: uuidv4(), ...body, createdAt: new Date().toISOString() };
    await db.collection('employees').insertOne(doc);
    delete doc._id;
    await logActivity(db, { action: 'employee_created', entity: 'employees', entityId: doc.id, user: 'المدير', details: `إضافة موظف ${doc.name}`, ip: clientIp });
    return ok(doc, 201);
  }
  // Hash password when updating an employee (only if password provided)
  if (path.match(/^employees\/[^/]+$/) && method === 'PUT' && !path.includes('/repairs/')) {
    const id = path.split('/')[1];
    const body = await getJsonBody(request);
    delete body._id; delete body.id;
    if (body.password) {
      if (!isBcrypt(body.password)) body.password = await hashPassword(body.password);
    } else {
      delete body.password; // don't clobber if not provided
    }
    await db.collection('employees').updateOne({ id }, { $set: body });
    const updated = await db.collection('employees').findOne({ id });
    if (updated) { delete updated._id; delete updated.password; }
    await logActivity(db, { action: 'employee_updated', entity: 'employees', entityId: id, user: 'المدير', details: `تعديل موظف ${updated?.name || ''}`, ip: clientIp });
    return ok(updated);
  }

  // Special-case: when creating a task, default status='pending' and notify assignee
  if (path === 'tasks' && method === 'POST') {
    const body = await getJsonBody(request);
    const now = new Date().toISOString();
    const doc = {
      id: uuidv4(),
      ...body,
      status: body.status || 'pending',
      progress: body.progress || 0,
      attachments: body.attachments || [],
      notes: body.notes || '',
      createdAt: now,
    };
    await db.collection('tasks').insertOne(doc);
    delete doc._id;
    if (doc.assignedTo) {
      await db.collection('notifications').insertOne({
        id: uuidv4(), userId: doc.assignedTo, type: 'task_new', title: '📋 مهمة جديدة',
        message: `وُكِّلت إليك مهمة "${doc.title}" بأولوية ${doc.priority || 'متوسطة'}. يرجى القبول أو الرفض`,
        taskId: doc.id, read: false, createdAt: now,
      });
    }
    await logActivity(db, { action: 'task_created', entity: 'tasks', entityId: doc.id, user: doc.createdBy || 'المدير', details: `إنشاء مهمة "${doc.title}" للموظف ${doc.assignedToName}`, ip: clientIp });
    return ok(doc, 201);
  }

  // Special-case: when creating a subscriber, send notification to manager
  if (path === 'subscribers' && method === 'POST') {
    const body = await getJsonBody(request);
    const doc = { id: uuidv4(), ...body, createdAt: new Date().toISOString() };
    await db.collection('subscribers').insertOne(doc);
    delete doc._id;
    if (doc.zoneId) {
      const c = await db.collection('subscribers').countDocuments({ zoneId: doc.zoneId });
      await db.collection('zones').updateOne({ id: doc.zoneId }, { $set: { subscribers: c } });
    }
    await logActivity(db, { action: 'subscriber_created', entity: 'subscribers', entityId: doc.id, user: 'المدير', details: `مشترك جديد: ${doc.name}`, ip: clientIp });
    await sendTelegram(db, `<b>👤 مشترك جديد</b>\nالاسم: ${doc.name}\nالمنطقة: ${doc.zoneName || '-'}\nالباقة: ${doc.speed || '-'}`);
    return ok(doc, 201);
  }

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
      // Skip if path has sub-resources (e.g., employees/X/repairs/Y) - handled by specific routes
      if (path.split('/').length > 2) continue;
      const id = path.split('/')[1];
      const body = await getJsonBody(request);
      delete body._id; delete body.id;
      await db.collection(coll).updateOne({ id }, { $set: body });
      const updated = await db.collection(coll).findOne({ id });
      if (updated) delete updated._id;
      return ok(updated);
    }
    if (path.startsWith(route + '/') && method === 'DELETE') {
      if (path.split('/').length > 2) continue;
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

  // ============ ACCOUNTING / FINANCIAL REPORTS ============
  if (path === 'accounting/summary' && method === 'GET') {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month'; // day | month | year
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);
    const year = String(new Date().getFullYear());
    const prefix = period === 'day' ? today : period === 'year' ? year : month;

    const sales = await db.collection('sales').find({ createdAt: { $regex: `^${prefix}` } }).toArray();
    const activations = await db.collection('activations').find({ createdAt: { $regex: `^${prefix}` } }).toArray();
    const repairs = await db.collection('repairs').find({ createdAt: { $regex: `^${prefix}` }, status: 'completed' }).toArray();
    const payrollEntries = await db.collection('payroll_entries').find({ date: { $regex: `^${prefix}` } }).toArray();
    const advances = await db.collection('advances').find({ status: { $in: ['approved', 'paid'] } }).toArray();
    const employees = await db.collection('employees').find({}).toArray();

    // Revenue
    const salesRev = sales.reduce((s, x) => s + (x.total || 0), 0);
    const actsRev = activations.reduce((s, x) => s + (x.amount || 0), 0);
    const repairsRev = repairs.reduce((s, x) => s + (x.cost || 0), 0);
    const totalRevenue = salesRev + actsRev + repairsRev;

    // Expenses
    const bonuses = payrollEntries.filter(e => e.type === 'bonus').reduce((s, x) => s + (x.amount || 0), 0);
    const salariesExp = period === 'month' ? employees.reduce((s, e) => s + (e.salary || 0), 0) : 0;
    const advanceExp = period === 'month' ? advances.filter(a => a.status === 'approved').reduce((s, a) => s + (a.perInstallment || 0), 0) : 0;
    const totalExpenses = bonuses + salariesExp + advanceExp;
    const netProfit = totalRevenue - totalExpenses;

    // Debts
    const subscribers = await db.collection('subscribers').find({}).toArray();
    const debtors = subscribers.filter(s => (s.balance || 0) < 0);
    const totalDebt = Math.abs(debtors.reduce((s, x) => s + (x.balance || 0), 0));

    // Daily breakdown (last 30 days for chart)
    const breakdown = [];
    if (period === 'day') {
      const last30 = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last30.push(d.toISOString().slice(0, 10));
      }
      const allSales = await db.collection('sales').find({}).toArray();
      const allActs = await db.collection('activations').find({}).toArray();
      for (const d of last30) {
        const s = allSales.filter(x => x.createdAt?.startsWith(d)).reduce((a, b) => a + (b.total || 0), 0);
        const a = allActs.filter(x => x.createdAt?.startsWith(d)).reduce((acc, b) => acc + (b.amount || 0), 0);
        breakdown.push({ label: d.slice(5), revenue: s + a });
      }
    } else if (period === 'month') {
      // 12 months of the year
      for (let m = 1; m <= 12; m++) {
        const mPrefix = `${year}-${String(m).padStart(2, '0')}`;
        const s = (await db.collection('sales').find({ createdAt: { $regex: `^${mPrefix}` } }).toArray()).reduce((a, b) => a + (b.total || 0), 0);
        const a = (await db.collection('activations').find({ createdAt: { $regex: `^${mPrefix}` } }).toArray()).reduce((acc, b) => acc + (b.amount || 0), 0);
        breakdown.push({ label: mPrefix, revenue: s + a });
      }
    }

    return ok({
      period, prefix,
      revenue: { sales: salesRev, activations: actsRev, repairs: repairsRev, total: totalRevenue },
      expenses: { bonuses, salaries: salariesExp, advances: advanceExp, total: totalExpenses },
      netProfit,
      debts: {
        count: debtors.length, total: totalDebt,
        topDebtors: debtors.sort((a, b) => (a.balance || 0) - (b.balance || 0)).slice(0, 10).map(d => ({
          id: d.id, name: d.name, zone: d.zoneName, amount: Math.abs(d.balance || 0),
        })),
      },
      counts: { sales: sales.length, activations: activations.length, repairs: repairs.length },
      breakdown,
    });
  }

  // ============ E-COMMERCE ORDERS ============
  if (path === 'orders' && method === 'GET') {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    const q = phone ? { customerPhone: phone } : {};
    const items = await db.collection('orders').find(q).sort({ createdAt: -1 }).limit(500).toArray();
    return ok(items.map(x => { delete x._id; return x; }));
  }
  if (path === 'orders' && method === 'POST') {
    const body = await getJsonBody(request);
    const { customerName, customerPhone, customerAddress, items, paymentMethod, notes } = body;
    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) return err('بيانات الطلب ناقصة', 400);
    let subtotal = 0;
    const cleanItems = [];
    for (const it of items) {
      const p = await db.collection('products').findOne({ id: it.id });
      if (!p) continue;
      const qty = Math.max(1, Number(it.quantity || 1));
      const lineTotal = p.price * qty;
      subtotal += lineTotal;
      cleanItems.push({ id: p.id, name: p.name, price: p.price, quantity: qty, total: lineTotal });
    }
    if (cleanItems.length === 0) return err('لا توجد منتجات صالحة', 400);
    const shipping = subtotal >= 50000 ? 0 : 5000;
    const total = subtotal + shipping;
    const orderNumber = `ORD-${Date.now()}`;
    const doc = {
      id: uuidv4(), orderNumber,
      customerName, customerPhone, customerAddress: customerAddress || '',
      items: cleanItems, subtotal, shipping, total,
      paymentMethod: paymentMethod || 'cod', notes: notes || '',
      status: 'pending', createdAt: new Date().toISOString(),
    };
    await db.collection('orders').insertOne(doc);
    delete doc._id;
    await logActivity(db, { action: 'order_created', entity: 'orders', entityId: doc.id, user: customerName, details: `طلب جديد ${orderNumber} بقيمة ${fmt(total)} د.ع`, ip: clientIp });
    await notifyManager(db, {
      type: 'order_new', title: `🛒 طلب جديد: ${orderNumber}`,
      message: `العميل: ${customerName}\nالهاتف: ${customerPhone}\nالمنتجات: ${cleanItems.length}\nالإجمالي: ${total.toLocaleString('en-US')} د.ع`,
    });
    return ok(doc, 201);
  }
  if (path.match(/^orders\/[^/]+\/status$/) && method === 'POST') {
    const id = path.split('/')[1];
    const { status, notes } = await getJsonBody(request);
    const valid = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return err('حالة غير صالحة', 400);
    const o = await db.collection('orders').findOne({ id });
    if (!o) return err('غير موجود', 404);
    await db.collection('orders').updateOne({ id }, { $set: { status, adminNotes: notes || o.adminNotes, statusUpdatedAt: new Date().toISOString() } });
    // Decrement stock when delivered
    if (status === 'delivered' && o.status !== 'delivered') {
      for (const it of o.items) {
        if (it.id) await db.collection('products').updateOne({ id: it.id }, { $inc: { stock: -it.quantity } });
      }
    }
    await logActivity(db, { action: `order_${status}`, entity: 'orders', entityId: id, user: 'المدير', details: `${o.orderNumber} → ${status}`, ip: clientIp });
    return ok({ success: true });
  }
  if (path.match(/^orders\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    await db.collection('orders').deleteOne({ id });
    return ok({ success: true });
  }

  // ============ HR / EMPLOYEE ENDPOINTS ============
  if (path === 'employees/login' && method === 'POST') {
    const { username, password } = await getJsonBody(request);
    const emp = await db.collection('employees').findOne({ username });
    if (!emp) {
      await logActivity(db, { action: 'login_failed', entity: 'employees', user: username, details: 'username not found', ip: clientIp });
      return err('بيانات الدخول خاطئة', 401);
    }
    const ok2 = await verifyPassword(password, emp.password);
    if (!ok2) {
      await logActivity(db, { action: 'login_failed', entity: 'employees', user: username, userId: emp.id, details: 'wrong password', ip: clientIp });
      return err('بيانات الدخول خاطئة', 401);
    }
    // Upgrade legacy plaintext to bcrypt on successful login
    if (!isBcrypt(emp.password)) {
      const newHash = await hashPassword(password);
      await db.collection('employees').updateOne({ id: emp.id }, { $set: { password: newHash } });
    }
    delete emp._id;
    const token = `emp_${emp.id}_${Date.now()}`;
    await db.collection('sessions').insertOne({
      id: uuidv4(), token, employeeId: emp.id, employeeName: emp.name,
      ip: clientIp, userAgent: request.headers.get('user-agent') || '',
      createdAt: new Date().toISOString(), lastActivity: new Date().toISOString(), active: true,
    });
    await logActivity(db, { action: 'login_success', entity: 'employees', user: emp.name, userId: emp.id, details: 'تسجيل دخول ناجح', ip: clientIp });
    delete emp.password;
    return ok({ success: true, employee: emp, token });
  }

  // Session validation (for idle logout)
  if (path === 'sessions/validate' && method === 'POST') {
    const { token } = await getJsonBody(request);
    if (!token) return err('غير مصرح', 401);
    const s = await db.collection('sessions').findOne({ token, active: true });
    if (!s) return err('انتهت الجلسة', 401);
    await db.collection('sessions').updateOne({ id: s.id }, { $set: { lastActivity: new Date().toISOString() } });
    return ok({ valid: true });
  }
  // Logout
  if (path === 'sessions/logout' && method === 'POST') {
    const { token } = await getJsonBody(request);
    if (token) {
      const s = await db.collection('sessions').findOne({ token });
      if (s) {
        await db.collection('sessions').updateOne({ id: s.id }, { $set: { active: false, loggedOutAt: new Date().toISOString() } });
        await logActivity(db, { action: 'logout', entity: 'employees', user: s.employeeName, userId: s.employeeId, ip: clientIp });
      }
    }
    return ok({ success: true });
  }
  // Sessions list (admin)
  if (path === 'sessions' && method === 'GET') {
    const sessions = await db.collection('sessions').find({}).sort({ createdAt: -1 }).limit(200).toArray();
    return ok(sessions.map(s => { delete s._id; return s; }));
  }
  // Terminate session (admin)
  if (path.match(/^sessions\/[^/]+\/terminate$/) && method === 'POST') {
    const id = path.split('/')[1];
    await db.collection('sessions').updateOne({ id }, { $set: { active: false, terminatedAt: new Date().toISOString() } });
    return ok({ success: true });
  }

  // ============ ACTIVITY LOGS VIEWER ============
  if (path === 'activity-logs' && method === 'GET') {
    const url = new URL(request.url);
    const limit = Math.min(1000, Number(url.searchParams.get('limit') || 200));
    const action = url.searchParams.get('action');
    const entity = url.searchParams.get('entity');
    const userId = url.searchParams.get('userId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const q = {};
    if (action) q.action = action;
    if (entity) q.entity = entity;
    if (userId) q.userId = userId;
    if (from || to) {
      q.timestamp = {};
      if (from) q.timestamp.$gte = from;
      if (to) q.timestamp.$lte = to;
    }
    const items = await db.collection('activity_logs').find(q).sort({ timestamp: -1 }).limit(limit).toArray();
    return ok(items.map(x => { delete x._id; return x; }));
  }

  // Check-in
  if (path === 'attendance/checkin' && method === 'POST') {
    const { employeeId, photoUrl, lat, lng } = await getJsonBody(request);
    const emp = await db.collection('employees').findOne({ id: employeeId });
    if (!emp) return err('الموظف غير موجود', 404);
    if (!photoUrl) return err('صورة الحضور إلزامية - يرجى التقاط صورة', 400);
    const today = new Date().toISOString().slice(0, 10);
    const existing = await db.collection('attendance').findOne({ employeeId, date: today });
    if (existing && existing.checkIn) return err('تم تسجيل الحضور مسبقاً اليوم', 400);
    const now = new Date();
    const settings = await db.collection('settings').findOne({ id: 'system' });
    const empSettings = settings?.employees || {};
    const globalShiftStart = empSettings.workStart || '08:00';
    const [shiftH, shiftM] = (emp.shiftStart || globalShiftStart).split(':').map(Number);
    const shiftStart = new Date(now); shiftStart.setHours(shiftH, shiftM, 0, 0);
    const lateMinutes = Math.max(0, Math.floor((now - shiftStart) / 60000));
    const grace = empSettings.lateGraceMinutes ?? 10;
    const isLate = lateMinutes > grace;
    const autoEnabled = empSettings.autoDeductionEnabled !== false;
    const mode = empSettings.lateDeductionMode || 'fixed';
    const fixedAmount = empSettings.lateDeductionAmount ?? 25000;
    const perMinute = empSettings.lateDeductionPerMinute ?? 500;
    let deductionAmount = 0;
    if (isLate && autoEnabled) {
      deductionAmount = mode === 'per_minute'
        ? Math.max(0, (lateMinutes - grace)) * perMinute
        : fixedAmount;
    }
    const record = {
      id: uuidv4(),
      employeeId, employeeName: emp.name, date: today,
      checkIn: now.toISOString(), checkOut: null,
      checkInPhoto: photoUrl, checkOutPhoto: null,
      checkInLat: lat || null, checkInLng: lng || null,
      lateMinutes, isLate, status: isLate ? 'late' : 'present',
      hoursWorked: 0, autoDeduction: deductionAmount, deductionMode: mode,
      createdAt: now.toISOString(),
    };
    if (deductionAmount > 0) {
      await db.collection('payroll_entries').insertOne({
        id: uuidv4(), employeeId, employeeName: emp.name, type: 'deduction',
        amount: deductionAmount,
        reason: mode === 'per_minute'
          ? `خصم تلقائي: تأخير ${lateMinutes} دقيقة × ${perMinute} د.ع/دقيقة`
          : `خصم تلقائي: تأخير ${lateMinutes} دقيقة (مبلغ ثابت)`,
        auto: true, date: today, createdAt: now.toISOString(),
      });
    }
    await db.collection('attendance').insertOne(record);
    await db.collection('employees').updateOne({ id: employeeId }, { $set: { attendance: record.status } });
    await logActivity(db, { action: 'attendance_checkin', entity: 'attendance', entityId: record.id, user: emp.name, userId: emp.id, details: `حضور في ${now.toLocaleTimeString('ar-IQ')}${isLate ? ` (تأخير ${lateMinutes}د)` : ''}`, ip: clientIp });
    const timeStr = now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    if (isLate) {
      await notifyManager(db, {
        type: 'attendance_late',
        title: `⏰ تأخير: ${emp.name}`,
        message: `بصم الحضور في ${timeStr}\nالتأخير: ${lateMinutes} دقيقة\nالخصم: ${deductionAmount.toLocaleString('en-US')} د.ع`,
        employeeId,
      });
    } else {
      await notifyManager(db, {
        type: 'attendance_checkin',
        title: `📍 حضور: ${emp.name}`,
        message: `بصم الحضور في ${timeStr}`,
        employeeId,
      });
    }
    delete record._id;
    return ok({ success: true, record });
  }

  // Check-out
  if (path === 'attendance/checkout' && method === 'POST') {
    const { employeeId, photoUrl, lat, lng } = await getJsonBody(request);
    if (!photoUrl) return err('صورة الانصراف إلزامية - يرجى التقاط صورة', 400);
    const today = new Date().toISOString().slice(0, 10);
    const existing = await db.collection('attendance').findOne({ employeeId, date: today });
    if (!existing) return err('لم تسجل حضور اليوم', 400);
    if (existing.checkOut) return err('تم تسجيل الانصراف مسبقاً', 400);
    const now = new Date();
    const checkInTime = new Date(existing.checkIn);
    const hoursWorked = ((now - checkInTime) / 3600000).toFixed(2);
    await db.collection('attendance').updateOne(
      { id: existing.id },
      { $set: { checkOut: now.toISOString(), checkOutPhoto: photoUrl, checkOutLat: lat || null, checkOutLng: lng || null, hoursWorked: Number(hoursWorked) } }
    );
    const emp = await db.collection('employees').findOne({ id: employeeId });
    await logActivity(db, { action: 'attendance_checkout', entity: 'attendance', entityId: existing.id, user: emp?.name, userId: employeeId, details: `انصراف بعد ${hoursWorked} ساعة`, ip: clientIp });
    const timeStr = now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    await notifyManager(db, {
      type: 'attendance_checkout',
      title: `🚪 انصراف: ${emp?.name}`,
      message: `بصم الانصراف في ${timeStr}\nالساعات المُنجزة: ${hoursWorked}`,
      employeeId,
    });
    return ok({ success: true, hoursWorked: Number(hoursWorked) });
  }

  // Today's attendance for all
  if (path === 'attendance/today' && method === 'GET') {
    const today = new Date().toISOString().slice(0, 10);
    const records = await db.collection('attendance').find({ date: today }).toArray();
    return ok(records.map(r => { delete r._id; return r; }));
  }

  // Employee's attendance/tasks
  if (path.match(/^employees\/[^/]+\/attendance$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const records = await db.collection('attendance').find({ employeeId: empId }).sort({ date: -1 }).toArray();
    return ok(records.map(r => { delete r._id; return r; }));
  }

  if (path.match(/^employees\/[^/]+\/tasks$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const tasks = await db.collection('tasks').find({ assignedTo: empId }).sort({ createdAt: -1 }).toArray();
    return ok(tasks.map(t => { delete t._id; return t; }));
  }

  // Task update by employee
  if (path.match(/^tasks\/[^/]+\/update$/) && method === 'POST') {
    const taskId = path.split('/')[1];
    const body = await getJsonBody(request);
    const allowedFields = ['status', 'progress', 'notes', 'attachments'];
    const updates = {};
    for (const k of allowedFields) if (k in body) updates[k] = body[k];
    updates.updatedAt = new Date().toISOString();
    await db.collection('tasks').updateOne({ id: taskId }, { $set: updates });
    const updated = await db.collection('tasks').findOne({ id: taskId });
    if (updated) delete updated._id;
    return ok(updated);
  }

  // ============ INTERACTIVE TASK WORKFLOW ============
  // Accept task (employee)
  if (path.match(/^tasks\/[^/]+\/accept$/) && method === 'POST') {
    const taskId = path.split('/')[1];
    const { employeeId } = await getJsonBody(request);
    const task = await db.collection('tasks').findOne({ id: taskId });
    if (!task) return err('المهمة غير موجودة', 404);
    if (task.assignedTo !== employeeId) return err('غير مخوّل', 403);
    if (!['pending', 'new'].includes(task.status || 'pending')) return err('لا يمكن قبول هذه المهمة في حالتها الحالية', 400);
    const now = new Date().toISOString();
    await db.collection('tasks').updateOne({ id: taskId }, { $set: { status: 'in_progress', acceptedAt: now, updatedAt: now } });
    // Notify manager
    if (task.createdById) {
      await db.collection('notifications').insertOne({
        id: uuidv4(), userId: task.createdById, type: 'task_accepted', title: 'تم قبول المهمة',
        message: `قبل ${task.assignedToName} المهمة: ${task.title}`, taskId, read: false, createdAt: now,
      });
    }
    return ok({ success: true });
  }

  // Reject task (employee) with reason
  if (path.match(/^tasks\/[^/]+\/reject$/) && method === 'POST') {
    const taskId = path.split('/')[1];
    const { employeeId, reason } = await getJsonBody(request);
    if (!reason || reason.trim().length < 3) return err('سبب الرفض مطلوب', 400);
    const task = await db.collection('tasks').findOne({ id: taskId });
    if (!task) return err('المهمة غير موجودة', 404);
    if (task.assignedTo !== employeeId) return err('غير مخوّل', 403);
    if (!['pending', 'new'].includes(task.status || 'pending')) return err('لا يمكن رفض هذه المهمة', 400);
    const now = new Date().toISOString();
    await db.collection('tasks').updateOne({ id: taskId }, { $set: { status: 'rejected_by_employee', rejectionReason: reason, rejectedAt: now, updatedAt: now } });
    if (task.createdById) {
      await db.collection('notifications').insertOne({
        id: uuidv4(), userId: task.createdById, type: 'task_rejected', title: 'رفض الموظف المهمة',
        message: `رفض ${task.assignedToName} المهمة "${task.title}" بسبب: ${reason}`,
        taskId, read: false, createdAt: now,
      });
    }
    return ok({ success: true });
  }

  // Complete task (employee submits report)
  if (path.match(/^tasks\/[^/]+\/complete$/) && method === 'POST') {
    const taskId = path.split('/')[1];
    const body = await getJsonBody(request);
    const { employeeId, summary, notes, progress, attachments, problems, completionTime } = body;
    const task = await db.collection('tasks').findOne({ id: taskId });
    if (!task) return err('المهمة غير موجودة', 404);
    if (task.assignedTo !== employeeId) return err('غير مخوّل', 403);
    if (!summary || summary.trim().length < 3) return err('وصف الإنجاز مطلوب', 400);
    const now = new Date().toISOString();
    const report = {
      summary, notes: notes || '', progress: Number(progress || 100),
      attachments: Array.isArray(attachments) ? attachments : [],
      problems: problems || '', completionTime: completionTime || now,
      submittedAt: now,
    };
    await db.collection('tasks').updateOne({ id: taskId }, {
      $set: { status: 'pending_review', report, progress: report.progress, submittedAt: now, updatedAt: now },
    });
    if (task.createdById) {
      await db.collection('notifications').insertOne({
        id: uuidv4(), userId: task.createdById, type: 'task_submitted', title: 'تقرير مهمة جاهز للمراجعة',
        message: `أنهى ${task.assignedToName} المهمة "${task.title}" وأرسل التقرير`,
        taskId, read: false, createdAt: now,
      });
    }
    return ok({ success: true });
  }

  // Manager reviews task
  if (path.match(/^tasks\/[^/]+\/review$/) && method === 'POST') {
    const taskId = path.split('/')[1];
    const body = await getJsonBody(request);
    const { action, rating, notes, reviewerName } = body;
    const task = await db.collection('tasks').findOne({ id: taskId });
    if (!task) return err('المهمة غير موجودة', 404);
    if (!['approve', 'reject', 'revise'].includes(action)) return err('إجراء غير صالح', 400);
    const now = new Date().toISOString();
    const newStatus = action === 'approve' ? 'completed' : action === 'reject' ? 'rejected_by_manager' : 'revision';
    const review = {
      action, notes: notes || '', reviewerName: reviewerName || 'المدير',
      rating: rating || null, reviewedAt: now,
    };
    await db.collection('tasks').updateOne({ id: taskId }, { $set: { status: newStatus, review, reviewedAt: now, updatedAt: now } });

    // Update employee KPI on approval
    if (action === 'approve' && rating) {
      const r = rating;
      const score = Math.round(((Number(r.speed||0) + Number(r.quality||0) + Number(r.commitment||0) + Number(r.delay||0)) / 4) * 20); // 0-100
      // Increment employee tasksCompleted & ratingPoints
      const emp = await db.collection('employees').findOne({ id: task.assignedTo });
      if (emp) {
        const newRatingPoints = (emp.ratingPoints || 0) + score;
        const newTasksCompleted = (emp.tasksCompleted || 0) + 1;
        const avgRating = Math.round(newRatingPoints / newTasksCompleted);
        await db.collection('employees').updateOne({ id: task.assignedTo }, {
          $set: { ratingPoints: newRatingPoints, tasksCompleted: newTasksCompleted, kpi: Math.min(100, avgRating) },
        });
      }
    }

    // Notify employee
    const msgMap = {
      approve: { title: '✅ تم قبول مهمتك', text: `وافق المدير على إنجاز المهمة "${task.title}"` },
      reject: { title: '❌ رُفض إنجازك', text: `رفض المدير إنجاز المهمة "${task.title}". ملاحظات: ${notes || '-'}` },
      revise: { title: '🔄 إعادة تعديل', text: `طلب المدير تعديلات على المهمة "${task.title}". ملاحظات: ${notes || '-'}` },
    };
    await db.collection('notifications').insertOne({
      id: uuidv4(), userId: task.assignedTo, type: `task_${action}`, title: msgMap[action].title,
      message: msgMap[action].text, taskId, read: false, createdAt: now,
    });

    // If revise → put task back in_progress
    if (action === 'revise') {
      await db.collection('tasks').updateOne({ id: taskId }, { $set: { status: 'in_progress' } });
    }

    return ok({ success: true });
  }

  // ============ NOTIFICATIONS ============
  if (path === 'notifications' && method === 'GET') {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return err('userId مطلوب', 400);
    const items = await db.collection('notifications').find({ userId }).sort({ createdAt: -1 }).limit(50).toArray();
    return ok(items.map(n => { delete n._id; return n; }));
  }
  if (path.match(/^notifications\/[^/]+\/read$/) && method === 'POST') {
    const id = path.split('/')[1];
    await db.collection('notifications').updateOne({ id }, { $set: { read: true } });
    return ok({ success: true });
  }
  if (path === 'notifications/read-all' && method === 'POST') {
    const { userId } = await getJsonBody(request);
    if (!userId) return err('userId مطلوب', 400);
    await db.collection('notifications').updateMany({ userId, read: false }, { $set: { read: true } });
    return ok({ success: true });
  }

  // ============ FILE UPLOAD (multipart) ============
  if (path === 'upload' && method === 'POST') {
    try {
      let form;
      try { form = await request.formData(); }
      catch { return err('لم يتم إرسال ملف', 400); }
      const file = form.get('file');
      if (!file || typeof file === 'string') return err('لم يتم إرسال ملف', 400);
      const buf = Buffer.from(await file.arrayBuffer());
      const fs = await import('fs');
      const pathMod = await import('path');
      const uploadsDir = pathMod.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = (file.name || '').split('.').pop() || 'bin';
      const filename = `${uuidv4()}.${ext}`;
      fs.writeFileSync(pathMod.join(uploadsDir, filename), buf);
      const url = `/uploads/${filename}`;
      return ok({ success: true, url, name: file.name, size: buf.length });
    } catch (e) {
      return err('فشل الرفع: ' + e.message, 500);
    }
  }

  // ============ LEAVES (الإجازات) ============
  // GET all (admin) or filtered
  if (path === 'leaves' && method === 'GET') {
    const url = new URL(request.url);
    const empFilter = url.searchParams.get('employeeId');
    const q = empFilter ? { employeeId: empFilter } : {};
    const items = await db.collection('leaves').find(q).sort({ createdAt: -1 }).toArray();
    return ok(items.map(x => { delete x._id; return x; }));
  }
  // POST new leave request (by employee)
  if (path === 'leaves' && method === 'POST') {
    const body = await getJsonBody(request);
    const { employeeId, type, reason, startDate, endDate, days } = body;
    if (!employeeId || !type || !startDate || !days) return err('بيانات ناقصة', 400);
    const emp = await db.collection('employees').findOne({ id: employeeId });
    if (!emp) return err('الموظف غير موجود', 404);
    const doc = {
      id: uuidv4(), employeeId, employeeName: emp.name,
      type, reason: reason || '', startDate, endDate: endDate || startDate, days: Number(days),
      status: 'pending', approvedBy: null, approvedAt: null, rejectionReason: '',
      createdAt: new Date().toISOString(),
    };
    await db.collection('leaves').insertOne(doc);
    delete doc._id;
    await logActivity(db, { action: 'leave_request', entity: 'leaves', entityId: doc.id, user: emp.name, userId: emp.id, details: `طلب ${days} يوم - ${type}`, ip: clientIp });
    await notifyManager(db, {
      type: 'leave_request', title: `📅 طلب إجازة: ${emp.name}`,
      message: `النوع: ${type}\nالمدة: ${days} يوم\nمن: ${startDate} إلى: ${endDate || startDate}\nالسبب: ${reason || '-'}`,
      employeeId,
    });
    return ok(doc, 201);
  }
  // PUT approve/reject leave (by admin)
  if (path.match(/^leaves\/[^/]+\/(approve|reject)$/) && method === 'POST') {
    const parts = path.split('/');
    const id = parts[1];
    const action = parts[2];
    const body = await getJsonBody(request);
    const leave = await db.collection('leaves').findOne({ id });
    if (!leave) return err('غير موجود', 404);
    if (leave.status !== 'pending') return err('تمت معالجة هذا الطلب مسبقاً', 400);
    const now = new Date().toISOString();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await db.collection('leaves').updateOne({ id }, { $set: {
      status: newStatus, approvedBy: body.approvedBy || 'المدير',
      approvedAt: now, rejectionReason: action === 'reject' ? (body.reason || '') : '',
    }});
    await logActivity(db, { action: `leave_${action}`, entity: 'leaves', entityId: id, user: body.approvedBy || 'المدير', details: `${action === 'approve' ? 'موافقة' : 'رفض'} على إجازة ${leave.employeeName}`, ip: clientIp });
    // Notify employee
    await db.collection('notifications').insertOne({
      id: uuidv4(), userId: leave.employeeId, type: `leave_${action}`,
      title: action === 'approve' ? '✅ إجازتك مقبولة' : '❌ إجازتك مرفوضة',
      message: action === 'approve' ? `تمت الموافقة على إجازتك (${leave.days} يوم) من ${leave.startDate}` : `سبب الرفض: ${body.reason || '-'}`,
      read: false, createdAt: now,
    });
    return ok({ success: true });
  }

  // Leave balance
  if (path.match(/^employees\/[^/]+\/leave-balance$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const settings = await db.collection('settings').findOne({ id: 'system' });
    const yearlyAllowance = settings?.employees?.yearlyLeaveAllowance ?? 24;
    const year = new Date().getFullYear();
    const approved = await db.collection('leaves').find({ employeeId: empId, status: 'approved', startDate: { $regex: `^${year}` } }).toArray();
    const used = approved.reduce((s, x) => s + (x.days || 0), 0);
    const pending = await db.collection('leaves').find({ employeeId: empId, status: 'pending' }).toArray();
    const pendingDays = pending.reduce((s, x) => s + (x.days || 0), 0);
    return ok({ year, allowance: yearlyAllowance, used, pending: pendingDays, remaining: Math.max(0, yearlyAllowance - used) });
  }

  // ============ ADVANCES (السلف) ============
  if (path === 'advances' && method === 'GET') {
    const url = new URL(request.url);
    const empFilter = url.searchParams.get('employeeId');
    const q = empFilter ? { employeeId: empFilter } : {};
    const items = await db.collection('advances').find(q).sort({ createdAt: -1 }).toArray();
    return ok(items.map(x => { delete x._id; return x; }));
  }
  if (path === 'advances' && method === 'POST') {
    const body = await getJsonBody(request);
    const { employeeId, amount, reason, installments } = body;
    if (!employeeId || !amount) return err('المبلغ مطلوب', 400);
    const emp = await db.collection('employees').findOne({ id: employeeId });
    if (!emp) return err('الموظف غير موجود', 404);
    const doc = {
      id: uuidv4(), employeeId, employeeName: emp.name,
      amount: Number(amount), reason: reason || '',
      installments: Number(installments || 1),
      perInstallment: Math.round(Number(amount) / Number(installments || 1)),
      paidInstallments: 0, remainingAmount: Number(amount),
      status: 'pending', approvedBy: null, approvedAt: null, rejectionReason: '',
      createdAt: new Date().toISOString(),
    };
    await db.collection('advances').insertOne(doc);
    delete doc._id;
    await logActivity(db, { action: 'advance_request', entity: 'advances', entityId: doc.id, user: emp.name, userId: emp.id, details: `طلب سلفة ${amount} د.ع`, ip: clientIp });
    await notifyManager(db, {
      type: 'advance_request', title: `💰 طلب سلفة: ${emp.name}`,
      message: `المبلغ: ${Number(amount).toLocaleString('en-US')} د.ع\nالأقساط: ${installments || 1}\nالسبب: ${reason || '-'}`,
      employeeId,
    });
    return ok(doc, 201);
  }
  // Approve/Reject advance
  if (path.match(/^advances\/[^/]+\/(approve|reject)$/) && method === 'POST') {
    const parts = path.split('/');
    const id = parts[1];
    const action = parts[2];
    const body = await getJsonBody(request);
    const advance = await db.collection('advances').findOne({ id });
    if (!advance) return err('غير موجود', 404);
    if (advance.status !== 'pending') return err('تمت معالجة هذا الطلب مسبقاً', 400);
    const now = new Date().toISOString();
    if (action === 'approve') {
      // Optionally allow admin to override installments
      const newInstallments = Number(body.installments || advance.installments || 1);
      await db.collection('advances').updateOne({ id }, { $set: {
        status: 'approved', approvedBy: body.approvedBy || 'المدير', approvedAt: now,
        installments: newInstallments,
        perInstallment: Math.round(advance.amount / newInstallments),
      }});
      // No immediate deduction; payroll calc will pick up installments
    } else {
      await db.collection('advances').updateOne({ id }, { $set: {
        status: 'rejected', approvedBy: body.approvedBy || 'المدير', approvedAt: now,
        rejectionReason: body.reason || '',
      }});
    }
    await logActivity(db, { action: `advance_${action}`, entity: 'advances', entityId: id, user: body.approvedBy || 'المدير', details: `${action === 'approve' ? 'موافقة' : 'رفض'} سلفة ${advance.employeeName} (${advance.amount})`, ip: clientIp });
    await db.collection('notifications').insertOne({
      id: uuidv4(), userId: advance.employeeId, type: `advance_${action}`,
      title: action === 'approve' ? '✅ سلفتك مقبولة' : '❌ سلفتك مرفوضة',
      message: action === 'approve' ? `وافق المدير على سلفتك (${advance.amount.toLocaleString('en-US')} د.ع) - ستُخصم على ${body.installments || advance.installments} قسط` : `سبب الرفض: ${body.reason || '-'}`,
      read: false, createdAt: now,
    });
    return ok({ success: true });
  }
  // Pay an installment of advance (admin marks 1 installment as paid)
  if (path.match(/^advances\/[^/]+\/pay-installment$/) && method === 'POST') {
    const id = path.split('/')[1];
    const advance = await db.collection('advances').findOne({ id });
    if (!advance) return err('غير موجود', 404);
    if (advance.status !== 'approved') return err('السلفة غير مفعّلة', 400);
    const newPaid = (advance.paidInstallments || 0) + 1;
    const remaining = Math.max(0, advance.amount - (newPaid * advance.perInstallment));
    const completed = newPaid >= advance.installments;
    await db.collection('advances').updateOne({ id }, { $set: {
      paidInstallments: newPaid, remainingAmount: remaining,
      status: completed ? 'paid' : 'approved',
    }});
    return ok({ success: true, paidInstallments: newPaid, remaining });
  }

  // ============ ADMIN NOTIFICATIONS BELL ============
  // Get the active manager's notifications (employees with role contains مدير or perm 'all')
  if (path === 'notifications/admin' && method === 'GET') {
    const managers = await db.collection('employees').find({ $or: [{ permissions: 'all' }, { role: { $regex: 'مدير' } }] }).toArray();
    const ids = managers.map(m => m.id);
    const items = await db.collection('notifications').find({ userId: { $in: ids } }).sort({ createdAt: -1 }).limit(100).toArray();
    return ok(items.map(n => { delete n._id; return n; }));
  }
  if (path === 'notifications/admin/read-all' && method === 'POST') {
    const managers = await db.collection('employees').find({ $or: [{ permissions: 'all' }, { role: { $regex: 'مدير' } }] }).toArray();
    const ids = managers.map(m => m.id);
    await db.collection('notifications').updateMany({ userId: { $in: ids }, read: false }, { $set: { read: true } });
    return ok({ success: true });
  }

  // ============ TELEGRAM BOT - STATISTICS ============
  // Seed super admin if missing
  const seedTgAdmin = async () => {
    const adminId = process.env.TELEGRAM_SUPER_ADMIN_ID;
    if (!adminId) return;
    const existing = await db.collection('telegram_users').findOne({ telegramId: String(adminId) });
    if (!existing) {
      await db.collection('telegram_users').insertOne({
        id: uuidv4(), telegramId: String(adminId),
        name: 'Super Admin', role: 'super_admin',
        permissions: PERMS_ALL, enabled: true,
        createdAt: new Date().toISOString(),
        lastActivity: null, failedAttempts: 0,
      });
    }
  };
  await seedTgAdmin();

  // Telegram webhook
  if (path === 'telegram/webhook' && method === 'POST') {
    const update = await getJsonBody(request);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return ok({ ok: false, reason: 'no_token' });

    const isCallback = !!update.callback_query;
    const tgUser = isCallback ? update.callback_query.from : update.message?.from;
    const chatId = isCallback ? update.callback_query.message.chat.id : update.message?.chat?.id;
    const messageId = isCallback ? update.callback_query.message.message_id : null;
    const dataOrText = isCallback ? update.callback_query.data : update.message?.text;

    if (!tgUser || !chatId) return ok({ ok: true });

    const tgId = String(tgUser.id);
    const dbUser = await db.collection('telegram_users').findOne({ telegramId: tgId });

    // Auth check
    if (!dbUser || !dbUser.enabled) {
      await db.collection('telegram_logs').insertOne({
        id: uuidv4(), telegramId: tgId, userName: tgUser.first_name || tgUser.username || 'unknown',
        action: 'unauthorized_access', success: false,
        details: dataOrText || '', timestamp: new Date().toISOString(),
      });
      if (dbUser && !dbUser.enabled) {
        await db.collection('telegram_users').updateOne({ telegramId: tgId }, { $inc: { failedAttempts: 1 } });
      }
      const msg = `❌ <b>غير مصرح لك باستخدام هذا البوت</b>\n\nTelegram ID: <code>${tgId}</code>\nيرجى التواصل مع المدير لإضافة حسابك`;
      if (isCallback) {
        await tgAnswerCallback(token, update.callback_query.id, 'غير مصرح');
        await tgEdit(token, chatId, messageId, msg);
      } else {
        await tgSend(token, chatId, msg);
      }
      return ok({ ok: true });
    }

    // Rate limit: 30 requests / minute
    const oneMinAgo = new Date(Date.now() - 60000).toISOString();
    const recent = await db.collection('telegram_logs').countDocuments({ telegramId: tgId, timestamp: { $gt: oneMinAgo } });
    if (recent > 30) {
      if (isCallback) await tgAnswerCallback(token, update.callback_query.id, 'تم تجاوز الحد المسموح، حاول بعد دقيقة');
      else await tgSend(token, chatId, '⚠️ تم تجاوز الحد المسموح (30 طلب/دقيقة). انتظر دقيقة وحاول مجدداً.');
      return ok({ ok: true });
    }

    // Update lastActivity
    await db.collection('telegram_users').updateOne({ telegramId: tgId }, { $set: { lastActivity: new Date().toISOString() }, $inc: { totalRequests: 1 } });

    // Route the request
    const route = isCallback ? dataOrText : (dataOrText === '/start' ? 'home' : 'home');
    const [main, sub] = route.split(':');
    let response = null;
    const perms = dbUser.permissions || [];
    const has = (p) => perms.includes(p) || perms.includes('all');
    const needPerm = (p, builder) => has(p) ? builder() : Promise.resolve({ text: '⛔ <b>غير مصرح لك بهذا القسم</b>', kb: { inline_keyboard: [[{ text: '🔙 الرئيسية', callback_data: 'home' }]] } });

    try {
      if (main === 'home' || main === '/start') response = await buildHome(db, dbUser);
      else if (main === 'reports') response = await needPerm('reports', () => buildReports(db, sub));
      else if (main === 'employees') response = await needPerm('employees', () => buildEmployees(db, sub));
      else if (main === 'subscribers') response = await needPerm('subscribers', () => buildSubscribers(db, sub));
      else if (main === 'finance') response = await needPerm('finance', () => buildFinance(db, sub));
      else if (main === 'maintenance') response = await needPerm('maintenance', () => buildMaintenance(db, sub));
      else if (main === 'network') response = await needPerm('network', () => buildNetwork(db, sub));
      else if (main === 'me') response = buildMe(dbUser);
      else if (main === 'logs') response = await needPerm('view_logs', () => buildLogs(db));
      else if (main === 'admin') response = await needPerm('manage_users', () => buildAdmin(db));
      else response = await buildHome(db, dbUser);
    } catch (e) {
      response = { text: `⚠️ خطأ: ${e.message}`, kb: { inline_keyboard: [[{ text: '🔙 الرئيسية', callback_data: 'home' }]] } };
    }

    // Log
    await db.collection('telegram_logs').insertOne({
      id: uuidv4(), telegramId: tgId, userName: dbUser.name,
      action: route, success: true,
      details: '', timestamp: new Date().toISOString(),
    });

    // Send response
    if (isCallback) {
      await tgAnswerCallback(token, update.callback_query.id);
      await tgEdit(token, chatId, messageId, response.text, response.kb);
    } else {
      await tgSend(token, chatId, response.text, response.kb);
    }
    return ok({ ok: true });
  }

  // Setup webhook
  if (path === 'telegram/setup-webhook' && method === 'POST') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return err('TELEGRAM_BOT_TOKEN غير مضبوط في .env', 400);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) return err('NEXT_PUBLIC_BASE_URL غير مضبوط', 400);
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;
    const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'] }),
    }).then(r => r.json()).catch(e => ({ ok: false, error: e.message }));
    return ok({ success: r.ok, response: r, webhookUrl });
  }

  // Get webhook info
  if (path === 'telegram/webhook-info' && method === 'GET') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return err('TELEGRAM_BOT_TOKEN غير مضبوط', 400);
    const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then(r => r.json());
    return ok(r);
  }

  // Delete webhook
  if (path === 'telegram/delete-webhook' && method === 'POST') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return err('TELEGRAM_BOT_TOKEN غير مضبوط', 400);
    const r = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: 'POST' }).then(r => r.json());
    return ok(r);
  }

  // ============ TELEGRAM USERS CRUD (admin platform) ============
  if (path === 'telegram-users' && method === 'GET') {
    const items = await db.collection('telegram_users').find({}).sort({ createdAt: -1 }).toArray();
    return ok(items.map(x => { delete x._id; return x; }));
  }
  if (path === 'telegram-users' && method === 'POST') {
    const body = await getJsonBody(request);
    if (!body.telegramId || !body.name || !body.role) return err('الحقول الأساسية مطلوبة', 400);
    const existing = await db.collection('telegram_users').findOne({ telegramId: String(body.telegramId) });
    if (existing) return err('هذا Telegram ID مضاف مسبقاً', 400);
    const perms = body.permissions || ROLE_DEFAULT_PERMS[body.role] || [];
    const doc = {
      id: uuidv4(), telegramId: String(body.telegramId), name: body.name,
      role: body.role, permissions: perms, enabled: body.enabled !== false,
      createdAt: new Date().toISOString(), lastActivity: null, failedAttempts: 0, totalRequests: 0,
    };
    await db.collection('telegram_users').insertOne(doc);
    delete doc._id;
    await logActivity(db, { action: 'tg_user_created', entity: 'telegram_users', entityId: doc.id, details: `إضافة Telegram ID ${doc.telegramId} (${doc.name})`, ip: clientIp });
    return ok(doc, 201);
  }
  if (path.match(/^telegram-users\/[^/]+$/) && method === 'PUT') {
    const id = path.split('/')[1];
    const body = await getJsonBody(request);
    delete body._id; delete body.id;
    await db.collection('telegram_users').updateOne({ id }, { $set: body });
    const updated = await db.collection('telegram_users').findOne({ id });
    if (updated) delete updated._id;
    await logActivity(db, { action: 'tg_user_updated', entity: 'telegram_users', entityId: id, details: `تعديل ${updated?.name}`, ip: clientIp });
    return ok(updated);
  }
  if (path.match(/^telegram-users\/[^/]+$/) && method === 'DELETE') {
    const id = path.split('/')[1];
    const u = await db.collection('telegram_users').findOne({ id });
    await db.collection('telegram_users').deleteOne({ id });
    await logActivity(db, { action: 'tg_user_deleted', entity: 'telegram_users', entityId: id, details: `حذف ${u?.name}`, ip: clientIp });
    return ok({ success: true });
  }

  // Telegram logs
  if (path === 'telegram-logs' && method === 'GET') {
    const url = new URL(request.url);
    const limit = Math.min(500, Number(url.searchParams.get('limit') || 100));
    const filter = url.searchParams.get('telegramId');
    const q = filter ? { telegramId: filter } : {};
    const items = await db.collection('telegram_logs').find(q).sort({ timestamp: -1 }).limit(limit).toArray();
    return ok(items.map(x => { delete x._id; return x; }));
  }

  // Self-data endpoint (employee can fetch own info without exposing list)
  if (path.match(/^employees\/[^/]+\/self$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const emp = await db.collection('employees').findOne({ id: empId });
    if (!emp) return err('غير موجود', 404);
    // Strip sensitive fields from other contexts
    const safe = {
      id: emp.id, employeeId: emp.employeeId, name: emp.name, role: emp.role,
      photo: emp.photo, shiftStart: emp.shiftStart, shiftEnd: emp.shiftEnd,
      permissions: emp.permissions || ['tasks'], status: emp.status,
      salary: emp.salary, kpi: emp.kpi, ratingPoints: emp.ratingPoints || 0,
      tasksCompleted: emp.tasksCompleted || 0,
    };
    return ok(safe);
  }

  // ============ SCOPED EMPLOYEE PAGES (real, permission-checked) ============
  // Helper to validate token & permission
  const checkEmpPermission = async (empId, requiredPerm) => {
    const tokenHeader = request.headers.get('x-emp-token') || '';
    // Token format: emp_<empId>_<timestamp>
    const tokenEmpId = tokenHeader.startsWith('emp_') ? tokenHeader.split('_')[1] : null;
    if (!tokenEmpId || tokenEmpId !== empId) return { ok: false, code: 401, msg: 'غير مصرح' };
    const emp = await db.collection('employees').findOne({ id: empId });
    if (!emp) return { ok: false, code: 404, msg: 'الموظف غير موجود' };
    const perms = emp.permissions || [];
    if (requiredPerm && !perms.includes(requiredPerm) && !perms.includes('all')) {
      return { ok: false, code: 403, msg: 'ليس لديك صلاحية الوصول لهذا القسم' };
    }
    return { ok: true, emp };
  };

  // Employee's own sales
  if (path.match(/^employees\/[^/]+\/sales$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const check = await checkEmpPermission(empId, 'pos');
    if (!check.ok) return err(check.msg, check.code);
    const sales = await db.collection('sales').find({ cashierId: empId }).sort({ createdAt: -1 }).limit(100).toArray();
    const total = sales.reduce((s, x) => s + (x.total || 0), 0);
    return ok({ sales: sales.map(s => { delete s._id; return s; }), total, count: sales.length });
  }

  // Employee records a sale (POS)
  if (path.match(/^employees\/[^/]+\/sales$/) && method === 'POST') {
    const empId = path.split('/')[1];
    const check = await checkEmpPermission(empId, 'pos');
    if (!check.ok) return err(check.msg, check.code);
    const body = await getJsonBody(request);
    const items = body.items || [];
    const discount = Number(body.discount || 0);
    let subtotal = 0;
    for (const it of items) {
      subtotal += (it.price || 0) * (it.quantity || 1);
      if (it.id) {
        await db.collection('products').updateOne({ id: it.id }, { $inc: { stock: -(it.quantity || 1) } });
      }
    }
    const total = Math.max(0, subtotal - discount);
    const sale = {
      id: uuidv4(),
      invoiceNumber: `INV-${Date.now()}`,
      items, subtotal, discount, total,
      paymentMethod: body.paymentMethod || 'cash',
      cashier: check.emp.name, cashierId: empId,
      customer: body.customer || '',
      createdAt: new Date().toISOString(),
    };
    await db.collection('sales').insertOne(sale);
    delete sale._id;
    return ok(sale, 201);
  }

  // Employee's repairs (technician)
  if (path.match(/^employees\/[^/]+\/repairs$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const check = await checkEmpPermission(empId, 'repairs');
    if (!check.ok) return err(check.msg, check.code);
    const all = await db.collection('repairs').find({}).sort({ createdAt: -1 }).toArray();
    // Filter by technicianId OR technician name match
    const repairs = all.filter(r => r.technicianId === empId || r.technician === check.emp.name);
    return ok(repairs.map(r => { delete r._id; return r; }));
  }

  // Employee updates a repair status (only own)
  if (path.match(/^employees\/[^/]+\/repairs\/[^/]+$/) && method === 'PUT') {
    const parts = path.split('/');
    const empId = parts[1];
    const repId = parts[3];
    const check = await checkEmpPermission(empId, 'repairs');
    if (!check.ok) return err(check.msg, check.code);
    const repair = await db.collection('repairs').findOne({ id: repId });
    if (!repair) return err('التذكرة غير موجودة', 404);
    if (repair.technicianId !== empId && repair.technician !== check.emp.name) return err('غير مصرح', 403);
    const body = await getJsonBody(request);
    const allowed = ['status', 'cost', 'partsCost', 'notes', 'completedAt'];
    const upd = {};
    for (const k of allowed) if (k in body) upd[k] = body[k];
    upd.updatedAt = new Date().toISOString();
    if (upd.status === 'completed' && !upd.completedAt) upd.completedAt = upd.updatedAt;
    await db.collection('repairs').updateOne({ id: repId }, { $set: upd });
    const updated = await db.collection('repairs').findOne({ id: repId });
    if (updated) delete updated._id;
    return ok(updated);
  }

  // Employee's subscribers (filter by managedBy)
  if (path.match(/^employees\/[^/]+\/subscribers$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const check = await checkEmpPermission(empId, 'subscribers');
    if (!check.ok) return err(check.msg, check.code);
    const all = await db.collection('subscribers').find({}).toArray();
    const mine = all.filter(s => s.managerId === empId || s.assignedTo === empId);
    return ok(mine.map(s => { delete s._id; return s; }));
  }

  // Employee personal report (own performance)
  if (path.match(/^employees\/[^/]+\/report$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const check = await checkEmpPermission(empId, 'reports');
    if (!check.ok) return err(check.msg, check.code);
    const emp = check.emp;
    const attendance = await db.collection('attendance').find({ employeeId: empId, date: { $regex: `^${month}` } }).toArray();
    const tasks = await db.collection('tasks').find({ assignedTo: empId }).toArray();
    const sales = await db.collection('sales').find({ cashierId: empId, createdAt: { $regex: `^${month}` } }).toArray();
    const repairs = (await db.collection('repairs').find({}).toArray()).filter(r => r.technicianId === empId || r.technician === emp.name);
    const entries = await db.collection('payroll_entries').find({ employeeId: empId, date: { $regex: `^${month}` } }).toArray();

    return ok({
      month,
      attendance: {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        late: attendance.filter(a => a.status === 'late').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        totalHours: attendance.reduce((s, x) => s + (x.hoursWorked || 0), 0).toFixed(1),
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => ['pending', 'new'].includes(t.status)).length,
        inProgress: tasks.filter(t => ['in_progress', 'revision'].includes(t.status)).length,
        underReview: tasks.filter(t => t.status === 'pending_review').length,
      },
      sales: {
        count: sales.length,
        total: sales.reduce((s, x) => s + (x.total || 0), 0),
      },
      repairs: {
        total: repairs.length,
        completed: repairs.filter(r => r.status === 'completed').length,
        pending: repairs.filter(r => r.status !== 'completed').length,
      },
      payroll: {
        bonuses: entries.filter(e => e.type === 'bonus').reduce((s, x) => s + x.amount, 0),
        deductions: entries.filter(e => e.type === 'deduction').reduce((s, x) => s + x.amount, 0),
      },
      kpi: emp.kpi || 0,
      ratingPoints: emp.ratingPoints || 0,
      tasksCompletedAllTime: emp.tasksCompleted || 0,
    });
  }

  // ISP zones (read-only) for employees with isp permission
  if (path.match(/^employees\/[^/]+\/isp$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const check = await checkEmpPermission(empId, 'isp');
    if (!check.ok) return err(check.msg, check.code);
    const zones = await db.collection('zones').find({}).toArray();
    const networks = await db.collection('networks').find({}).toArray();
    return ok({
      zones: zones.map(z => { delete z._id; return z; }),
      networks: networks.map(n => { delete n._id; return n; }),
    });
  }

  // Payroll calculation for employee for a month
  if (path.match(/^employees\/[^/]+\/payroll$/) && method === 'GET') {
    const empId = path.split('/')[1];
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM
    const emp = await db.collection('employees').findOne({ id: empId });
    if (!emp) return err('الموظف غير موجود', 404);
    const attRecords = await db.collection('attendance').find({ employeeId: empId, date: { $regex: `^${month}` } }).toArray();
    const entries = await db.collection('payroll_entries').find({ employeeId: empId, date: { $regex: `^${month}` } }).toArray();
    const advances = await db.collection('advances').find({ employeeId: empId, status: { $in: ['approved', 'paid'] } }).toArray();
    const presentDays = attRecords.filter(a => a.status === 'present').length;
    const lateDays = attRecords.filter(a => a.status === 'late').length;
    const absentDays = attRecords.filter(a => a.status === 'absent').length;
    const totalDays = attRecords.length;
    const bonuses = entries.filter(e => e.type === 'bonus').reduce((s, x) => s + (x.amount || 0), 0);
    const lateDeductions = entries.filter(e => e.type === 'deduction').reduce((s, x) => s + (x.amount || 0), 0);
    // Active advance installments (one per month per active advance)
    const advanceDeduction = advances
      .filter(a => a.status === 'approved' && (a.paidInstallments || 0) < (a.installments || 1))
      .reduce((s, a) => s + (a.perInstallment || 0), 0);
    const deductions = lateDeductions + advanceDeduction;
    const baseSalary = emp.salary || 0;
    const finalSalary = baseSalary + bonuses - deductions;
    return ok({
      employee: { id: emp.id, name: emp.name, employeeId: emp.employeeId, role: emp.role },
      month, baseSalary, bonuses, deductions,
      lateDeductions, advanceDeduction, finalSalary,
      presentDays, lateDays, absentDays, totalDays,
      activeAdvances: advances.filter(a => a.status === 'approved').map(a => ({
        id: a.id, amount: a.amount, perInstallment: a.perInstallment,
        installments: a.installments, paid: a.paidInstallments || 0, remaining: a.remainingAmount,
      })),
      entries: entries.map(e => { delete e._id; return e; }),
      attendance: attRecords.map(a => { delete a._id; return a; }),
    });
  }

  // HR Reports
  if (path === 'hr/reports' && method === 'GET') {
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const employees = await db.collection('employees').find({}).toArray();
    const attendance = await db.collection('attendance').find({ date: { $regex: `^${month}` } }).toArray();
    const tasks = await db.collection('tasks').find({}).toArray();
    const entries = await db.collection('payroll_entries').find({ date: { $regex: `^${month}` } }).toArray();

    const byEmp = {};
    for (const e of employees) {
      const att = attendance.filter(a => a.employeeId === e.id);
      const empEntries = entries.filter(x => x.employeeId === e.id);
      const empTasks = tasks.filter(t => t.assignedTo === e.id);
      byEmp[e.id] = {
        id: e.id, employeeId: e.employeeId, name: e.name, role: e.role, photo: e.photo,
        presentDays: att.filter(a => a.status === 'present').length,
        lateDays: att.filter(a => a.status === 'late').length,
        totalHours: att.reduce((s, x) => s + (x.hoursWorked || 0), 0),
        bonuses: empEntries.filter(x => x.type === 'bonus').reduce((s, x) => s + x.amount, 0),
        deductions: empEntries.filter(x => x.type === 'deduction').reduce((s, x) => s + x.amount, 0),
        tasksTotal: empTasks.length,
        tasksCompleted: empTasks.filter(t => t.status === 'completed').length,
        kpi: e.kpi || 0,
      };
      byEmp[e.id].finalSalary = (e.salary || 0) + byEmp[e.id].bonuses - byEmp[e.id].deductions;
    }
    const empStats = Object.values(byEmp);
    return ok({
      month,
      totalEmployees: employees.length,
      totalSalaries: employees.reduce((s, e) => s + (e.salary || 0), 0),
      totalBonuses: entries.filter(x => x.type === 'bonus').reduce((s, x) => s + x.amount, 0),
      totalDeductions: entries.filter(x => x.type === 'deduction').reduce((s, x) => s + x.amount, 0),
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      employeeStats: empStats,
      topPerformers: [...empStats].sort((a, b) => b.kpi - a.kpi).slice(0, 5),
      mostAbsent: [...empStats].sort((a, b) => b.lateDays - a.lateDays).slice(0, 5),
    });
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

  // ============ SETTINGS ENDPOINTS ============
  if (path === 'settings' && method === 'GET') {
    let doc = await db.collection('settings').findOne({ id: 'system' });
    if (!doc) {
      doc = { id: 'system', ...SETTINGS_DEFAULTS, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await db.collection('settings').insertOne(doc);
    }
    delete doc._id;
    // Deep merge with defaults so new sections appear
    const merged = { ...SETTINGS_DEFAULTS };
    for (const key of Object.keys(SETTINGS_DEFAULTS)) {
      merged[key] = { ...SETTINGS_DEFAULTS[key], ...(doc[key] || {}) };
    }
    return ok({ id: 'system', ...merged, createdAt: doc.createdAt, updatedAt: doc.updatedAt });
  }

  if (path === 'settings' && method === 'PUT') {
    const body = await getJsonBody(request);
    const current = await db.collection('settings').findOne({ id: 'system' }) || { id: 'system', ...SETTINGS_DEFAULTS };
    delete body.id; delete body._id;
    // Deep merge: merge top-level sections
    const updated = { ...current };
    for (const key of Object.keys(body)) {
      if (typeof body[key] === 'object' && !Array.isArray(body[key]) && body[key] !== null) {
        updated[key] = { ...(current[key] || {}), ...body[key] };
      } else {
        updated[key] = body[key];
      }
    }
    updated.updatedAt = new Date().toISOString();
    await db.collection('settings').updateOne(
      { id: 'system' },
      { $set: updated },
      { upsert: true }
    );
    delete updated._id;
    // Audit log
    await db.collection('activity_logs').insertOne({
      id: uuidv4(), user: body.__user || 'admin', action: 'settings_update',
      entity: 'settings', entityId: 'system',
      details: `تحديث الإعدادات: ${Object.keys(body).filter(k => !k.startsWith('__')).join(', ')}`,
      timestamp: new Date().toISOString(),
    });
    return ok(updated);
  }

  if (path === 'settings/reset' && method === 'POST') {
    const body = await getJsonBody(request);
    const section = body?.section;
    if (section && SETTINGS_DEFAULTS[section]) {
      await db.collection('settings').updateOne(
        { id: 'system' },
        { $set: { [section]: SETTINGS_DEFAULTS[section], updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      await db.collection('activity_logs').insertOne({
        id: uuidv4(), user: 'admin', action: 'settings_reset_section',
        entity: 'settings', entityId: section,
        details: `إعادة ضبط قسم: ${section}`, timestamp: new Date().toISOString(),
      });
      return ok({ success: true, section, defaults: SETTINGS_DEFAULTS[section] });
    }
    // Reset all
    await db.collection('settings').updateOne(
      { id: 'system' },
      { $set: { ...SETTINGS_DEFAULTS, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    await db.collection('activity_logs').insertOne({
      id: uuidv4(), user: 'admin', action: 'settings_reset_all',
      entity: 'settings', entityId: 'system',
      details: 'إعادة ضبط جميع الإعدادات للقيم الافتراضية',
      timestamp: new Date().toISOString(),
    });
    return ok({ success: true, defaults: SETTINGS_DEFAULTS });
  }

  // Test integrations (WhatsApp/Telegram)
  if (path === 'settings/test/whatsapp' && method === 'POST') {
    const body = await getJsonBody(request);
    const settings = await db.collection('settings').findOne({ id: 'system' });
    const wa = settings?.whatsapp || SETTINGS_DEFAULTS.whatsapp;
    if (!wa.enabled) return err('واتساب غير مفعّل في الإعدادات');
    if (!wa.apiToken) return err('لم يتم تعيين API Token');
    // Log a test message
    await db.collection('whatsapp_messages').insertOne({
      id: uuidv4(), subscriberId: null, phone: body.phone || wa.managerPhone,
      type: 'test', message: `🧪 رسالة اختبار من ${wa.senderName} - ${new Date().toLocaleString('ar-IQ')}`,
      status: 'queued', retries: 0, createdAt: new Date().toISOString(),
    });
    return ok({ success: true, message: 'تم تسجيل رسالة اختبار في الطابور (يحتاج backend job لإرسالها فعلياً)' });
  }

  if (path === 'settings/test/telegram' && method === 'POST') {
    const settings = await db.collection('settings').findOne({ id: 'system' });
    const tg = settings?.telegram || SETTINGS_DEFAULTS.telegram;
    if (!tg.enabled) return err('تليجرام غير مفعّل في الإعدادات');
    if (!tg.botToken) return err('لم يتم تعيين Bot Token');
    if (!tg.managerChatId) return err('لم يتم تعيين Chat ID');
    // Try sending via Telegram API directly
    try {
      const r = await fetch(`https://api.telegram.org/bot${tg.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tg.managerChatId, text: `🧪 رسالة اختبار من نظام مركز الغزلان - ${new Date().toLocaleString('ar-IQ')}` }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) return err('فشل: ' + (data.description || 'خطأ غير معروف'));
      return ok({ success: true, message: 'تم إرسال رسالة الاختبار بنجاح ✅' });
    } catch (e) {
      return err('فشل الاتصال بـ Telegram API: ' + e.message);
    }
  }

  // Manual backup trigger (logs the action)
  if (path === 'settings/backup/run' && method === 'POST') {
    const collections = await db.listCollections().toArray();
    const stats = {};
    for (const c of collections) {
      stats[c.name] = await db.collection(c.name).countDocuments();
    }
    const backupId = uuidv4();
    await db.collection('settings').updateOne(
      { id: 'system' },
      { $set: { 'backup.lastBackup': new Date().toISOString(), 'backup.lastBackupId': backupId } }
    );
    await db.collection('activity_logs').insertOne({
      id: uuidv4(), user: 'admin', action: 'manual_backup',
      entity: 'backup', entityId: backupId,
      details: `نسخة احتياطية يدوية: ${Object.entries(stats).map(([k, v]) => `${k}=${v}`).join(', ')}`,
      timestamp: new Date().toISOString(),
    });
    return ok({ success: true, backupId, stats, timestamp: new Date().toISOString() });
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
