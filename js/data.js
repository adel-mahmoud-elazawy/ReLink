// Initial mock data and state store for ReLink — Waste to Worth
const INITIAL_DATA = {
  materials: [
    { id: 'plastic', name: 'بلاستيك (PET / HDPE)', icon: 'fa-recycle', color: 'emerald', pricePerKg: 24, co2Factor: 1.5, unit: 'طن' },
    { id: 'paper', name: 'ورق وكرتون مضغوط (OCC)', icon: 'fa-box-open', color: 'amber', pricePerKg: 7.5, co2Factor: 0.9, unit: 'طن' },
    { id: 'metals', name: 'ألومنيوم ومعادن خردة', icon: 'fa-cubes-stacked', color: 'blue', pricePerKg: 95, co2Factor: 2.8, unit: 'طن' },
    { id: 'ewaste', name: 'مخلفات إلكترونية وبطاريات', icon: 'fa-microchip', color: 'purple', pricePerKg: 160, co2Factor: 4.2, unit: 'كجم' },
    { id: 'glass', name: 'زجاج صناعي مفروز', icon: 'fa-champagne-glasses', color: 'cyan', pricePerKg: 3, co2Factor: 0.3, unit: 'طن' },
    { id: 'tires', name: 'إطارات ومطاط تالف', icon: 'fa-circle-notch', color: 'slate', pricePerKg: 8, co2Factor: 1.1, unit: 'طن' }
  ],

  // Requests created by Generators (Portal 1)
  generatorRequests: [
    {
      id: 'REQ-1048',
      generatorName: 'مصنع الأغذية الحديثة',
      generatorType: 'منشأة صناعية',
      materialId: 'plastic',
      materialName: 'بلاستيك شفاف PET (قوارير نقية)',
      quantity: 3.5,
      unit: 'طن',
      sortingQuality: 'مفروز ونظيف بنسبة 98%',
      city: 'القاهرة الكبرى',
      district: 'العاشر من رمضان - المنطقة الصناعية',
      locationCoords: [30.292, 31.748],
      preferredDate: '2026-10-14',
      timeSlot: 'الفترة الصباحية (8:00 - 12:00)',
      pricingType: 'fixed',
      expectedPrice: 84000,
      status: 'pending', // pending, accepted, collecting, completed
      assignedCollector: null,
      createdDate: 'منذ ساعتين',
      image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
      receipt: null
    },
    {
      id: 'REQ-1047',
      generatorName: 'سلسلة هايبر النيل للتجزئة',
      generatorType: 'مركز تسوق ومستودعات',
      materialId: 'paper',
      materialName: 'كرتون تعبئة مضغوط (OCC Balers)',
      quantity: 5.2,
      unit: 'طن',
      sortingQuality: 'بالات مكبوسة جافة',
      city: 'القاهرة الكبرى',
      district: 'العبور - المنطقة اللوجستية',
      locationCoords: [30.221, 31.482],
      preferredDate: '2026-10-13',
      timeSlot: 'الفترة المسائية (13:00 - 17:00)',
      pricingType: 'fixed',
      expectedPrice: 39000,
      status: 'collecting',
      assignedCollector: {
        id: 'COL-301',
        name: 'كابتن / محمود الشاذلي (أسطول نماء)',
        phone: '+20 100 123 4567',
        plate: 'أ ب د 4821',
        truckType: 'شاحنة دينا هيدروليكية 6 طن'
      },
      createdDate: 'أمس',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      receipt: null
    },
    {
      id: 'REQ-1045',
      generatorName: 'مجمع التقنية للأعمال',
      generatorType: 'مجمع شركات ومكاتب',
      materialId: 'ewaste',
      materialName: 'أجهزة حاسوب وشاشات وخوادم قديمة',
      quantity: 650,
      unit: 'كجم',
      sortingQuality: 'إلكترونيات مفروزة وموثقة',
      city: 'القاهرة الكبرى',
      district: 'التجمع الخامس',
      locationCoords: [30.030, 31.470],
      preferredDate: '2026-10-15',
      timeSlot: 'الفترة الصباحية',
      pricingType: 'bidding',
      expectedPrice: 104000,
      status: 'accepted',
      assignedCollector: {
        id: 'COL-204',
        name: 'مؤسسة تدوير المعادن الخضراء',
        phone: '+20 111 987 6543',
        plate: 'س ر و 7712',
        truckType: 'فان نقل مغلق مع ميزان دقيق'
      },
      createdDate: 'منذ يومين',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
      receipt: null
    },
    {
      id: 'REQ-1040',
      generatorName: 'مصنع الأغذية الحديثة',
      generatorType: 'منشأة صناعية',
      materialId: 'plastic',
      materialName: 'براميل HDPE مفروزة',
      quantity: 1.2,
      unit: 'طن',
      sortingQuality: 'مفروزة ونظيفة',
      city: 'القاهرة الكبرى',
      district: 'العبور - المنطقة اللوجستية',
      locationCoords: [30.221, 31.482],
      preferredDate: '2026-10-09',
      timeSlot: 'مكتمل',
      pricingType: 'fixed',
      expectedPrice: 28800,
      status: 'disputed',
      assignedCollector: { id: 'COL-102', name: 'مؤسسة النقل البيئي المتطور', phone: '+20 122 432 1098', plate: 'ق ص ح 3320', truckType: 'شاحنة ونش 10 طن' },
      createdDate: 'منذ 5 أيام',
      image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
      receipt: { receiptNo: 'RL-REC-9040', issueDate: '2026-10-09 11:20', grossWeight: 6400, tareWeight: 5200, netWeight: 1200, unit: 'كجم', unitPrice: 24, totalAmount: 28800, collectorSign: 'النقل البيئي', generatorSign: 'الأغذية الحديثة', qrCodeSeed: 'RL-VERIFIED-9040' },
      dispute: { status: 'open', reason: 'الوزن المسجّل أعلى من الفعلي — ميزان المنشأة أظهر 1100 كجم', claimedKg: 1100, at: 1760000000000, by: 'demo' },
      payout: { method: 'instapay', number: '01012345678' }
    },
    {
      id: 'REQ-1042',
      generatorName: 'ورشة الوفاق للألمنيوم',
      generatorType: 'ورشة تصنيع معادن',
      materialId: 'metals',
      materialName: 'قصاصات قطاعات ألومنيوم 6063 خردة',
      quantity: 2.1,
      unit: 'طن',
      sortingQuality: 'خردة صناعية خالية من الحديد',
      city: 'القاهرة الكبرى',
      district: 'شبرا الخيمة - المنطقة الصناعية',
      locationCoords: [30.128, 31.252],
      preferredDate: '2026-10-11',
      timeSlot: 'مكتمل',
      pricingType: 'fixed',
      expectedPrice: 199500,
      status: 'completed',
      assignedCollector: {
        id: 'COL-102',
        name: 'مؤسسة النقل البيئي المتطور',
        phone: '+20 122 432 1098',
        plate: 'ق ص ح 3320',
        truckType: 'شاحنة ونش 10 طن'
      },
      createdDate: 'منذ 3 أيام',
      image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80',
      receipt: {
        receiptNo: 'RL-REC-9042',
        issueDate: '2026-10-11 14:30',
        grossWeight: 7850,
        tareWeight: 5750,
        netWeight: 2100,
        unit: 'كجم',
        unitPrice: 95,
        totalAmount: 199500,
        collectorSign: 'محمود النقل البيئي',
        generatorSign: 'الوفاق للألمنيوم',
        qrCodeSeed: 'RL-VERIFIED-9042-ALU-SA'
      }
    }
  ],

  // B2B Industrial Batches for Factories (Portal 3)
  factoryMarketplaceBatches: [
    {
      id: 'BATCH-B2B-701',
      title: 'بالات رقائق PET معالجة ومغسولة (صنف A)',
      category: 'plastic',
      quantityTons: 25.0,
      unitPricePerTon: 38000,
      totalValue: 950000,
      location: 'محطة التجميع المركزية - حلوان',
      purity: '99.4% خالية من الشوائب',
      moisture: '< 0.5%',
      supplier: 'مركز ReLink اللوجستي المتكامل',
      status: 'available', // available, reserved, sold
      image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
      specs: ['كثافة البالة: 380 كجم/م³', 'معقمة ومفروزة بالأشعة الضوئية', 'جاهزة لخطوط البثق والتحبيب']
    },
    {
      id: 'BATCH-B2B-702',
      title: 'حزم كرتون OCC مزدوج الطبقات عالي المتانة',
      category: 'paper',
      quantityTons: 40.0,
      unitPricePerTon: 8500,
      totalValue: 340000,
      location: 'مستودعات الفرز الآلي - العبور',
      purity: '98.5% ألياف بكر معاد تدويرها',
      moisture: '< 8%',
      supplier: 'تحالف أساطيل التدوير الأهلية',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      specs: ['مكابس هيدروليكية 500 كجم/بالة', 'خالية من المواد البلاستيكية الملتصقة', 'مطابقة لمعايير مصانع الكرتون']
    },
    {
      id: 'BATCH-B2B-703',
      title: 'قوالب وسبائك خردة ألومنيوم مفرزة 6000 Series',
      category: 'metals',
      quantityTons: 12.0,
      unitPricePerTon: 105000,
      totalValue: 1260000,
      location: 'مجمع الصهر وإعادة التدوير - برج العرب، الإسكندرية',
      purity: '99.1% فحص مطيافي معتمد',
      moisture: '0.0%',
      supplier: 'شبكة ReLink للمعادن الصناعية',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
      specs: ['شهادة فحص مخبري ASTM', 'خالية من طلاء السيليكون', 'جاهزة مباشرة لأفران الصهر']
    },
    {
      id: 'BATCH-B2B-704',
      title: 'ألواح دوائر إلكترونية مطبوعة (High-Grade PCB Scrap)',
      category: 'ewaste',
      quantityTons: 3.2,
      unitPricePerTon: 380000,
      totalValue: 1216000,
      location: 'المركز الفني لفرز التقنية - مدينة نصر',
      purity: 'محتوى عناصر ثمينة معتمد',
      moisture: 'جاف تماماً',
      supplier: 'سيركيولار تك لتدوير التقنية',
      status: 'reserved',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
      specs: ['استخلاص ذهب ونحاس وفضة', 'منزوعة البطاريات والمكثفات الخطرة', 'تتبع تسلسلي معتمد للبيئة']
    }
  ],

  // Collector active stats & profile
  collectorProfile: {
    name: 'كابتن / سامي عبد الرحمن',
    fleetName: 'أسطول نسيم البيئة للخدمات اللوجستية',
    vehiclePlate: 'ر ق م 5022',
    capacityTons: 5.0,
    currentLoadTons: 2.1,
    rating: 4.9,
    tripsCompletedToday: 4,
    earningsToday: 8900,
    walletBalance: 55000
  },

  // Factory profile
  factoryProfile: {
    companyName: 'الشركة الوطنية للصناعات البلاستيكية والتدوير',
    representative: 'م. عمرو السيد (مدير سلاسل الإمداد)',
    monthlyQuotaTons: 200,
    procuredThisMonthTons: 142.5,
    budgetSpentEGP: 5420000,
    carbonOffsetCertificateId: 'CERT-ESG-2026-SA99'
  },

  // Impact Dashboard initial figures
  impactStats: {
    totalRecycledTons: 1428.6,
    co2ReducedTons: 2857.2,
    treesEquivalent: 142860,
    landfillDivertedPercent: 88.4,
    economicValueEGP: 35700000,
    activeGeneratorsCount: 340,
    activeCollectorsCount: 86,
    activeFactoriesCount: 42
  },

  // Notifications
  notifications: [
    { id: 1, title: 'طلب جمع جديد متاح بالقرب منك', desc: 'تم إدراج 3.5 طن بلاستيك في العاشر من رمضان.', time: 'منذ 10 دقائق', unread: true, portal: 'collector' },
    { id: 2, title: 'تم استلام الدفعة الموردة', desc: 'وصلت الشحنة REQ-1042 لمصنع التدوير وتم إيداع المبلغ.', time: 'منذ ساعتين', unread: true, portal: 'generator' },
    { id: 3, title: 'دفعة B2B جديدة مطروحة', desc: 'تم طرح 25 طن بالات PET مغسولة في سوق التوريد.', time: 'منذ 4 ساعات', unread: false, portal: 'factory' }
  ]
};

// ============================================================================
// State store v4 — separates DEMO world from LIVE (per-account) world.
//  * Demo world : full sample data (INITIAL_DATA), saved under its own key.
//  * Live world : starts EMPTY (no sample requests/orders). Every request/order
//                 carries an ownerId so each account only sees its own data.
//  * Accounts   : identified by phone number (prototype — no password).
// Everything lives in the browser's localStorage (per device/browser).
// To share data across devices a real backend (Firebase/Supabase) is needed.
// ============================================================================
const RL_KEYS = {
  session: 'relink_v6_session',
  accounts: 'relink_v6_accounts',
  demo: 'relink_v6_demo_world',
  live: 'relink_v6_live_world'
};
const RL_ADMIN_CODE = 'RELINK-ADMIN';   // access code for the Admin role (prototype)
const RL_COMMISSION = { collections: 0.08, factoryOrders: 0.03 };  // platform revenue model
const rlClone = o => JSON.parse(JSON.stringify(o));

const rlStorage = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return rlStorage._mem[k] || null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { rlStorage._mem[k] = v; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { delete rlStorage._mem[k]; } },
  _mem: {}
};
const rlRead = (k, fallback) => {
  const raw = rlStorage.get(k);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
};

function rlBlankCollectorProfile(name = 'كابتن', fleet = 'ناقل مستقل') {
  return { name, fleetName: fleet, vehiclePlate: 'غير محدد', capacityTons: 5.0, currentLoadTons: 0,
           rating: null, tripsCompletedToday: 0, earningsToday: 0, walletBalance: 0 };
}
function rlBlankFactoryProfile(name = 'مصنع', rep = '', id = '0000') {
  return { companyName: name, representative: rep, monthlyQuotaTons: 200, procuredThisMonthTons: 0,
           budgetSpentEGP: 0, carbonOffsetCertificateId: 'CERT-ESG-2026-' + String(id).slice(-4) };
}
function rlNewLiveWorld() {
  const w = rlClone(INITIAL_DATA);
  w.generatorRequests = [];
  w.factoryOrders = [];
  w.notifications = [];
  w.impactStats = { totalRecycledTons: 0, co2ReducedTons: 0, treesEquivalent: 0, landfillDivertedPercent: 0,
    economicValueEGP: 0, activeGeneratorsCount: 0, activeCollectorsCount: 0, activeFactoriesCount: 0 };
  delete w.collectorProfile;
  delete w.factoryProfile;
  return w;
}

class StateStore {
  constructor() {
    this.accounts = rlRead(RL_KEYS.accounts, {});
    this.session = rlRead(RL_KEYS.session, null);
    this._mount();
  }

  // ---- world / session plumbing -------------------------------------------
  _mount() {
    const s = this.session;
    if (s && s.demo) {
      this.data = rlRead(RL_KEYS.demo, null) || rlClone(INITIAL_DATA);
    } else {
      this.data = rlRead(RL_KEYS.live, null) || rlNewLiveWorld();
      const acc = s && this.accounts[s.accountId];
      this.data.collectorProfile = (acc && acc.role === 'collector' && acc.profile) || rlBlankCollectorProfile();
      this.data.factoryProfile = (acc && acc.role === 'factory' && acc.profile) || rlBlankFactoryProfile();
    }
    this.data.session = this.session;
  }

  save() {
    const { session, collectorProfile, factoryProfile, ...world } = this.data;
    if (this.session && this.session.demo) {
      world.collectorProfile = collectorProfile;
      world.factoryProfile = factoryProfile;
      rlStorage.set(RL_KEYS.demo, JSON.stringify(world));
    } else {
      const acc = this.session && this.accounts[this.session.accountId];
      if (acc) {
        if (acc.role === 'collector') acc.profile = collectorProfile;
        if (acc.role === 'factory') acc.profile = factoryProfile;
      }
      rlStorage.set(RL_KEYS.live, JSON.stringify(world));
    }
    rlStorage.set(RL_KEYS.accounts, JSON.stringify(this.accounts));
    rlStorage.set(RL_KEYS.session, JSON.stringify(this.session));
    if (this._notify && !(this.session && this.session.demo)) this._notify();
  }

  // ---- auth ---------------------------------------------------------------
  login(role, name, phone, org, code) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 5) return { ok: false, error: 'bad_phone' };
    if (role === 'admin' && String(code || '').trim() !== RL_ADMIN_CODE) return { ok: false, error: 'bad_code' };
    const id = 'ACC-' + digits;
    let acc = this.accounts[id];
    let isNew = false;
    if (acc && acc.role !== role) return { ok: false, error: 'role_mismatch', existingRole: acc.role };
    if (!acc) {
      isNew = true;
      const displayName = org || name;
      acc = {
        id, role, name, phone: digits, org: org || '',
        profile: role === 'collector' ? rlBlankCollectorProfile(name, org || 'ناقل مستقل')
               : role === 'factory' ? rlBlankFactoryProfile(displayName, name, digits) : null,
        created: Date.now()
      };
      this.accounts[id] = acc;
    }
    this.session = { role, demo: false, accountId: id, name: acc.name, phone: acc.phone, org: acc.org };
    this._mount();
    this.save();
    return { ok: true, isNew };
  }

  enterDemo() {
    this.session = { role: 'generator', demo: true, accountId: null, name: 'وضع العرض', phone: '', org: '' };
    this._mount();
    this.save();
  }

  logout() {
    this.session = null;
    rlStorage.del(RL_KEYS.session);
    this._mount();
  }

  me() {
    const s = this.session;
    return s && !s.demo ? { id: s.accountId, role: s.role, name: s.name, org: s.org, phone: s.phone } : null;
  }
  isDemo() { return !!(this.session && this.session.demo); }

  // ---- scoped views (what each account is allowed to see) -------------------
  myRequests() {
    const all = this.data.generatorRequests;
    if (this.isDemo()) return all;
    const me = this.me();
    return me ? all.filter(r => r.ownerId === me.id) : [];
  }
  availableRequests() { return this.data.generatorRequests.filter(r => r.status === 'pending'); }
  myTasks() {
    const act = this.data.generatorRequests.filter(r => r.status === 'accepted' || r.status === 'collecting');
    if (this.isDemo()) return act;
    const me = this.me();
    return me ? act.filter(r => r.assignedCollector && r.assignedCollector.id === me.id) : [];
  }
  myFactoryOrders() {
    const all = this.data.factoryOrders || [];
    if (this.isDemo()) return all;
    const me = this.me();
    return me ? all.filter(o => o.ownerId === me.id) : [];
  }
  myNotifications() {
    const all = this.data.notifications;
    if (this.isDemo()) return all;
    const me = this.me();
    if (!me) return [];
    return all.filter(n => n.portal === me.role && (!n.ownerId || n.ownerId === me.id));
  }
  collectorIdentity() {
    const p = this.data.collectorProfile;
    const me = this.me();
    return {
      id: me ? me.id : 'COL-301',
      name: p.name,
      phone: me ? me.phone : '+20 100 123 4567',
      plate: p.vehiclePlate,
      truckType: 'شاحنة دينا 6 طن مجهزة'
    };
  }

  // ---- reset ----------------------------------------------------------------
  reset() {
    if (this.isDemo()) {
      rlStorage.del(RL_KEYS.demo);
      this._mount();
      this.save();
    } else {
      rlStorage.del(RL_KEYS.live);
      rlStorage.del(RL_KEYS.accounts);
      rlStorage.del(RL_KEYS.session);
      this.accounts = {};
      this.session = null;
      this._mount();
    }
  }

  // ---- mutations --------------------------------------------------------------
  addGeneratorRequest(request) {
    const me = this.me();
    if (me) request.ownerId = me.id;
    this.data.generatorRequests.unshift(request);
    this.data.notifications.unshift({
      id: Date.now(),
      title: 'طلب جديد: ' + request.materialName,
      desc: `تم نشر شحنة بحمولة ${request.quantity} ${request.unit} في ${request.city} - ${request.district}`,
      time: 'الآن', unread: true, portal: 'collector'
    });
    this.save();
  }

  updateRequestStatus(requestId, status, collectorInfo = null, receiptInfo = null) {
    const req = this.data.generatorRequests.find(r => r.id === requestId);
    if (!req) return;
    req.status = status;
    req.history = (req.history || []).concat({ status, at: Date.now() });
    if (status === 'completed' && !req.completedAt) req.completedAt = Date.now();
    if (collectorInfo) req.assignedCollector = collectorInfo;
    if (receiptInfo) req.receipt = receiptInfo;

    if (status === 'accepted' && collectorInfo) {
      this.data.notifications.unshift({
        id: Date.now(), ownerId: req.ownerId || undefined,
        title: `تم قبول طلبك ${req.id}`,
        desc: `${collectorInfo.name} سيصل لاستلام ${req.quantity} ${req.unit}.`,
        time: 'الآن', unread: true, portal: 'generator'
      });
    }

    if (status === 'completed') {
      const qtyInTons = req.unit === 'كجم' ? req.quantity / 1000 : req.quantity;
      const st = this.data.impactStats;
      st.totalRecycledTons = +(st.totalRecycledTons + qtyInTons).toFixed(1);
      st.co2ReducedTons = +(st.co2ReducedTons + (qtyInTons * 1.8)).toFixed(1);
      st.treesEquivalent += Math.round(qtyInTons * 90);
      st.economicValueEGP += (req.expectedPrice || Math.round(qtyInTons * 39000));

      // Collector stats (only for the collector who actually did the job)
      const me = this.me();
      const mine = this.isDemo() || (me && req.assignedCollector && req.assignedCollector.id === me.id);
      if (mine && this.data.collectorProfile) {
        this.data.collectorProfile.tripsCompletedToday += 1;
        this.data.collectorProfile.earningsToday += Math.round((req.expectedPrice || 0) * 0.15);
      }

      this.data.notifications.unshift({
        id: Date.now() + 1, ownerId: req.ownerId || undefined,
        title: `اكتملت الشحنة ${req.id} بنجاح ✅`,
        desc: `تم وزن واستلام ${req.quantity} ${req.unit} وإصدار الإيصال الرقمي.`,
        time: 'الآن', unread: true, portal: 'generator'
      });
    }
    this.save();
  }

  addFactoryOrder(batch, method = 'escrow') {
    if (!this.data.factoryOrders) this.data.factoryOrders = [];
    const me = this.me();
    this.data.factoryOrders.unshift({
      id: 'PO-' + Math.floor(1000 + Math.random() * 9000),
      ownerId: me ? me.id : undefined,
      batchId: batch.id, title: batch.title, tons: batch.quantityTons,
      total: batch.totalValue, status: 'paid', paymentMethod: method,
      date: new Date().toLocaleDateString('ar-EG')
    });
    this.save();
  }

  advanceFactoryOrder(id) {
    const order = (this.data.factoryOrders || []).find(o => o.id === id);
    if (!order) return;
    const flow = ['paid', 'shipping', 'delivered', 'certified'];
    const i = flow.indexOf(order.status);
    if (i < flow.length - 1) order.status = flow[i + 1];
    this.save();
  }

  // ---- disputes / cancellations -------------------------------------------------
  _notify_push(n) { this.data.notifications.unshift(Object.assign({ id: Date.now() + Math.random(), time: 'الآن', unread: true }, n)); }

  releaseTask(id, reason) {
    const req = this.data.generatorRequests.find(r => r.id === id);
    if (!req) return;
    const old = req.assignedCollector;
    req.releases = (req.releases || []).concat({ collectorId: old && old.id, collectorName: old && old.name, reason, at: Date.now() });
    req.status = 'pending';
    req.assignedCollector = null;
    this._notify_push({ portal: 'generator', ownerId: req.ownerId, title: `اعتذر الناقل عن الطلب ${req.id}`,
      desc: `السبب: ${reason}. تمت إعادة الطلب لقائمة الناقلين تلقائياً.` });
    this.save();
  }

  openDispute(id, reason, claimedKg) {
    const req = this.data.generatorRequests.find(r => r.id === id);
    if (!req || req.status !== 'completed') return false;
    const me = this.me();
    req.dispute = { status: 'open', reason, claimedKg: Number(claimedKg) || null, at: Date.now(), by: me ? me.id : 'demo' };
    req.status = 'disputed';
    if (req.assignedCollector) this._notify_push({ portal: 'collector', ownerId: req.assignedCollector.id,
      title: `اعتراض على وزن الشحنة ${req.id}`, desc: `السبب: ${reason}. بانتظار مراجعة Admin.` });
    this._notify_push({ portal: 'admin', title: `نزاع جديد على ${req.id}`, desc: reason });
    this.save();
    return true;
  }

  openOrderDispute(id, reason) {
    const o = (this.data.factoryOrders || []).find(x => x.id === id);
    if (!o || o.status !== 'delivered') return false;
    o.dispute = { status: 'open', reason, at: Date.now() };
    o.status = 'disputed';
    this._notify_push({ portal: 'admin', title: `طلب إرجاع على ${o.id}`, desc: reason });
    this.save();
    return true;
  }

  resolveDispute(kind, id, decision) {
    const accept = decision === 'accept';
    if (kind === 'request') {
      const req = this.data.generatorRequests.find(r => r.id === id);
      if (!req || !req.dispute) return;
      if (accept && req.dispute.claimedKg && req.receipt) {
        req.receipt.netWeight = req.dispute.claimedKg;
        req.receipt.totalAmount = Math.round(req.dispute.claimedKg * req.receipt.unitPrice);
        req.receipt.adjusted = true;
      }
      req.dispute.status = accept ? 'accepted' : 'rejected';
      req.dispute.resolvedAt = Date.now();
      req.status = 'completed';
      const txt = accept ? 'تم قبول الاعتراض وتعديل الوزن والمبلغ.' : 'تم رفض الاعتراض وتأكيد الوزن الأصلي.';
      this._notify_push({ portal: 'generator', ownerId: req.ownerId, title: `قرار النزاع على ${req.id}`, desc: txt });
      if (req.assignedCollector) this._notify_push({ portal: 'collector', ownerId: req.assignedCollector.id, title: `قرار النزاع على ${req.id}`, desc: txt });
    } else {
      const o = (this.data.factoryOrders || []).find(x => x.id === id);
      if (!o || !o.dispute) return;
      o.dispute.status = accept ? 'accepted' : 'rejected';
      o.dispute.resolvedAt = Date.now();
      if (accept) {
        o.status = 'returned';
        const batch = this.data.factoryMarketplaceBatches.find(b => b.id === o.batchId);
        if (batch) batch.status = 'available';
        const acc = o.ownerId && this.accounts[o.ownerId];
        const prof = acc ? acc.profile : this.data.factoryProfile;
        if (prof) {
          prof.procuredThisMonthTons = Math.max(0, +(prof.procuredThisMonthTons - o.tons).toFixed(1));
          prof.budgetSpentEGP = Math.max(0, prof.budgetSpentEGP - o.total);
        }
      } else {
        o.status = 'delivered';
      }
      this._notify_push({ portal: 'factory', ownerId: o.ownerId, title: `قرار طلب الإرجاع ${o.id}`,
        desc: accept ? 'تمت الموافقة وسيُرد المبلغ لمحفظة Escrow.' : 'تم رفض طلب الإرجاع.' });
    }
    this.save();
  }

  // ---- ratings ----------------------------------------------------------------
  rateRequest(id, side, stars, comment) {
    const req = this.data.generatorRequests.find(r => r.id === id);
    if (!req) return;
    req.ratings = req.ratings || {};
    req.ratings[side] = { stars: Number(stars), comment: comment || '', at: Date.now() };
    if (side === 'generator' && req.assignedCollector) {
      const cid = req.assignedCollector.id;
      const rated = this.data.generatorRequests.filter(r => r.assignedCollector && r.assignedCollector.id === cid && r.ratings && r.ratings.generator);
      const avg = +(rated.reduce((s, r) => s + r.ratings.generator.stars, 0) / rated.length).toFixed(1);
      const acc = this.accounts[cid];
      if (acc && acc.profile) acc.profile.rating = avg;
      if (this.isDemo()) this.data.collectorProfile.rating = avg;
      this._notify_push({ portal: 'collector', ownerId: cid, title: `تقييم جديد ${stars}★`, desc: comment || `قيّمت المنشأة الشحنة ${req.id}` });
    } else if (side === 'collector') {
      this._notify_push({ portal: 'generator', ownerId: req.ownerId, title: `قيّمك الناقل ${stars}★`, desc: comment || `بخصوص الشحنة ${req.id}` });
    }
    this.save();
  }
  collectorRatingById(cid) {
    const acc = this.accounts[cid];
    if (acc && acc.profile && acc.profile.rating) return acc.profile.rating;
    return this.isDemo() && this.data.collectorProfile ? this.data.collectorProfile.rating : null;
  }

  // ---- admin / impact derived data ---------------------------------------------------
  adminStats() {
    const reqs = this.data.generatorRequests;
    const orders = this.data.factoryOrders || [];
    const accs = Object.values(this.accounts);
    const done = reqs.filter(r => r.status === 'completed');
    const gmvC = done.reduce((s, r) => s + (r.receipt ? r.receipt.totalAmount : r.expectedPrice), 0);
    const gmvO = orders.filter(o => o.status !== 'returned').reduce((s, o) => s + o.total, 0);
    const st = this.data.impactStats;
    const count = role => this.isDemo() ? (st[{ generator: 'activeGeneratorsCount', collector: 'activeCollectorsCount', factory: 'activeFactoriesCount' }[role]] || 0) : accs.filter(a => a.role === role).length;
    return {
      accounts: { generator: count('generator'), collector: count('collector'), factory: count('factory') },
      requestsByStatus: ['pending', 'accepted', 'collecting', 'completed', 'disputed'].reduce((o, k) => (o[k] = reqs.filter(r => r.status === k).length, o), {}),
      ordersCount: orders.length,
      gmv: gmvC + gmvO,
      revenue: Math.round(gmvC * RL_COMMISSION.collections + gmvO * RL_COMMISSION.factoryOrders),
      disputes: reqs.filter(r => r.dispute && r.dispute.status === 'open').map(r => ({ kind: 'request', id: r.id, title: r.materialName, reason: r.dispute.reason, extra: r.dispute.claimedKg ? `الوزن المدّعى: ${r.dispute.claimedKg} كجم` : '' }))
        .concat(orders.filter(o => o.dispute && o.dispute.status === 'open').map(o => ({ kind: 'order', id: o.id, title: o.title, reason: o.dispute.reason, extra: 'طلب إرجاع دفعة' }))),
      accountsList: accs.map(a => ({ id: a.id, role: a.role, name: a.org || a.name, phone: a.phone })),
      requests: reqs.slice(0, 50)
    };
  }

  impactBreakdown() {
    if (this.isDemo()) return null;
    const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const done = this.data.generatorRequests.filter(r => r.status === 'completed');
    const tons = r => (r.receipt ? r.receipt.netWeight : (r.unit === 'كجم' ? r.quantity : r.quantity * 1000)) / 1000;
    const groups = { plastic: 0, paper: 0, metals: 0, ewaste: 0, other: 0 };
    done.forEach(r => { groups[groups[r.materialId] !== undefined ? r.materialId : 'other'] += tons(r); });
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) { const dt = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ y: dt.getFullYear(), m: dt.getMonth(), label: MONTHS[dt.getMonth()], co2: 0, value: 0 }); }
    done.forEach(r => {
      if (!r.completedAt) return;
      const dt = new Date(r.completedAt);
      const slot = months.find(x => x.y === dt.getFullYear() && x.m === dt.getMonth());
      if (slot) { slot.co2 += tons(r) * 1.8; slot.value += (r.receipt ? r.receipt.totalAmount : r.expectedPrice) / 1e6; }
    });
    return {
      materials: [+groups.plastic.toFixed(2), +groups.paper.toFixed(2), +groups.metals.toFixed(2), +groups.ewaste.toFixed(2), +groups.other.toFixed(2)],
      months: months.map(x => x.label), co2: months.map(x => +x.co2.toFixed(2)), value: months.map(x => +x.value.toFixed(3)),
      hasData: done.length > 0
    };
  }

  // ---- backend sync hooks (optional, see js/backend.js) ----------------------------------
  exportLive() {
    return { world: rlStorage.get(RL_KEYS.live) || JSON.stringify(rlNewLiveWorld()), accounts: JSON.stringify(this.accounts) };
  }
  applyRemote(worldStr, accountsStr) {
    try { Object.assign(this.accounts, JSON.parse(accountsStr || '{}')); } catch (e) { /* ignore */ }
    if (worldStr) rlStorage.set(RL_KEYS.live, worldStr);
    rlStorage.set(RL_KEYS.accounts, JSON.stringify(this.accounts));
    if (!this.isDemo()) this._mount();
  }

  purchaseFactoryBatch(batchId) {
    const batch = this.data.factoryMarketplaceBatches.find(b => b.id === batchId);
    if (batch) {
      batch.status = 'reserved';
      const p = this.data.factoryProfile;
      p.procuredThisMonthTons = +(p.procuredThisMonthTons + batch.quantityTons).toFixed(1);
      p.budgetSpentEGP += batch.totalValue;
      this.save();
    }
  }
}

window.relinkStore = new StateStore();
