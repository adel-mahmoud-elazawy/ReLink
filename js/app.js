// ReLink — Waste to Worth Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // Global State Reference
  const store = window.relinkStore;

  const ROLE_META = {
    generator: { title: 'صاحب مخلفات / منشأة', icon: 'fa-building', desc: 'سجّل شحنة مخلفات واستلم عائدها', badge: 'منشأة منتجة للمخلفات' },
    collector: { title: 'جامع / ناقل', icon: 'fa-truck-moving', desc: 'اقبل مهام الجمع القريبة منك وأصدر الإيصال', badge: 'كابتن معتمد' },
    factory:   { title: 'مصنع تدوير / مشتري', icon: 'fa-industry', desc: 'اشترِ دفعات خام مفروزة بضمان ReLink', badge: 'مشتري معتمد B2B' },
    admin:     { title: 'مشرف المنصة (Admin)', icon: 'fa-user-shield', desc: 'إدارة النزاعات والإيرادات', badge: 'Admin' }
  };

  const STATUS_FLOW = [
    { key: 'pending',    label: 'تم إدراج الطلب',     icon: 'fa-file-lines' },
    { key: 'accepted',   label: 'قبول الناقل',        icon: 'fa-handshake' },
    { key: 'collecting', label: 'الوزن والتحميل',     icon: 'fa-scale-balanced' },
    { key: 'completed',  label: 'الاستلام والتحصيل',  icon: 'fa-circle-check' }
  ];

  const ORDER_STEPS = [
    { key: 'paid',       label: 'تم الدفع (Escrow)' },
    { key: 'shipping',   label: 'قيد الشحن' },
    { key: 'delivered',  label: 'تم الاستلام' },
    { key: 'certified',  label: 'شهادة ESG صادرة' }
  ];

  let activeRole = (store.data.session && store.data.session.role) || 'generator';
  const isDemo = () => !!(store.data.session && store.data.session.demo);
  let nextAction = null;
  let leafletMap = null;
  let mapMarkers = [];
  let charts = {};
  let signaturePad = null;
  window.RL = { renderApp: () => renderApp(), showToast: (m, t) => showToast(m, t), switchRole: r => switchRole(r), triggerConfetti: () => triggerConfetti(), openNewListingModal: () => openNewListingModal() };
  let currentReceiptTarget = null;

  // Initialize UI Components
  initTheme();
  initNavigation();
  try { initOnboarding(); } catch (e) { console.error('onboarding failed', e); }
  try { initDetailsModal(); } catch (e) { console.error('details modal failed', e); }
  initSignatureCanvas();
  renderApp();

  // ----------------------------------------------------
  // Theme Handling (Dark / Light)
  // ----------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem('relink_theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('relink_theme', isDark ? 'dark' : 'light');
        updateThemeIcon();
        // Update Chart colors if initialized
        updateChartsTheme();
      });
      updateThemeIcon();
    }
  }

  function updateThemeIcon() {
    const icon = document.getElementById('themeToggleIcon');
    if (!icon) return;
    const isDark = document.documentElement.classList.contains('dark');
    icon.className = isDark ? 'fa-solid fa-sun text-amber-400 text-lg' : 'fa-solid fa-moon text-slate-600 text-lg';
  }

  // ----------------------------------------------------
  // Navigation & Role Switching
  // ----------------------------------------------------
  function initNavigation() {
    const roleBtns = document.querySelectorAll('[data-role-target]');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('data-role-target');
        switchRole(target);
      });
    });

    // Reset Demo Data Button
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const msg = store.isDemo()
          ? 'هل ترغب في إعادة ضبط بيانات وضع العرض إلى حالتها الافتراضية؟'
          : 'سيتم حذف كل الحسابات والطلبات المخزّنة على هذا الجهاز. هل تريد المتابعة؟';
        if (confirm(msg)) {
          store.reset();
          showToast('تمت إعادة ضبط البيانات بنجاح', 'info');
          renderApp();
          if (!store.session) openOnboarding();
        }
      });
    }

    // Quick Add Button in Navbar
    const navQuickAdd = document.getElementById('navQuickAddBtn');
    if (navQuickAdd) {
      navQuickAdd.addEventListener('click', () => {
        switchRole('generator');
        openNewListingModal();
      });
    }

    // Notification Drawer Toggle
    const notifBtn = document.getElementById('notifToggleBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', () => {
        notifDropdown.classList.toggle('hidden');
      });
      // Close on outside click
      document.addEventListener('click', (ev) => {
        if (!notifBtn.contains(ev.target) && !notifDropdown.contains(ev.target)) {
          notifDropdown.classList.add('hidden');
        }
      });
    }

    // Guided Tour Button
    const tourBtn = document.getElementById('startTourBtn');
    if (tourBtn) {
      tourBtn.addEventListener('click', openTourModal);
    }
  }

  window.switchRole = switchRole;
  function switchRole(roleName) {
    activeRole = roleName;

    // Update active tab styles
    const roleBtns = document.querySelectorAll('[data-role-target]');
    roleBtns.forEach(btn => {
      const target = btn.getAttribute('data-role-target');
      if (target === roleName) {
        btn.classList.add('bg-emerald-600', 'text-white', 'shadow-md', 'shadow-emerald-600/30');
        btn.classList.remove('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
      } else {
        btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-md', 'shadow-emerald-600/30');
        btn.classList.add('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
      }
    });

    // Update Portal Visibility
    const portals = ['generatorPortal', 'collectorPortal', 'factoryPortal', 'impactPortal', 'adminPortal'];
    portals.forEach(pId => {
      const el = document.getElementById(pId);
      if (!el) return;
      if (pId === `${roleName}Portal`) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // Update Active User Badge in Header
    updateHeaderUserBadge(roleName);
    applyRoleVisibility();
    renderNextStep();

    // If Collector Portal opened, ensure Leaflet Map fits size
    if (roleName === 'collector') {
      setTimeout(() => {
        if (leafletMap) {
          leafletMap.invalidateSize();
        } else {
          initCollectorMap();
        }
      }, 200);
    }

    // If Impact Portal opened, render charts
    if (roleName === 'impact') {
      setTimeout(renderImpactCharts, 150);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  // ----------------------------------------------------
  // Onboarding: role selection + simple registration
  // ----------------------------------------------------

  function applyRoleVisibility() {
    const s = store.data.session || {};
    const demo = !!s.demo;
    const role = s.role;
    // Desktop & mobile tabs: in real mode show only own portal + impact
    document.querySelectorAll('[data-role-target]').forEach(btn => {
      const t = btn.getAttribute('data-role-target');
      const allowed = demo || !role || t === role || t === 'impact';
      btn.classList.toggle('hidden', !allowed);
    });
    // "New shipment" button only for generators (or demo)
    const quick = document.getElementById('navQuickAddBtn');
    if (quick) quick.classList.toggle('hidden', !(demo || !role || role === 'generator'));
    // Demo badge + switch/logout buttons
    const lbl = document.getElementById('logoutLabel');
    if (lbl) lbl.textContent = demo ? 'تبديل الدور' : (role ? 'تسجيل الخروج' : 'تسجيل الدخول');
    const demoBadge = document.getElementById('demoModeBadge');
    if (demoBadge) demoBadge.classList.toggle('hidden', !demo);
  }

  function initOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay) return;
    const cards = overlay.querySelectorAll('[data-pick-role]');
    const formWrap = document.getElementById('onboardForm');
    const stepRole = document.getElementById('onboardStepRole');
    let picked = null;

    cards.forEach(c => c.addEventListener('click', () => {
      picked = c.getAttribute('data-pick-role');
      const cw = document.getElementById('onboardCodeWrap');
      if (cw) cw.classList.toggle('hidden', picked !== 'admin');
      document.getElementById('onboardPickedTitle').textContent = ROLE_META[picked].title;
      stepRole.classList.add('hidden');
      formWrap.classList.remove('hidden');
    }));

    document.getElementById('onboardBack').addEventListener('click', () => {
      formWrap.classList.add('hidden');
      stepRole.classList.remove('hidden');
    });

    formWrap.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('onboardName').value.trim();
      const phone = document.getElementById('onboardPhone').value.trim();
      const org = document.getElementById('onboardOrg').value.trim();
      if (!name || !phone) return;
      const codeEl = document.getElementById('onboardCode');
      const res = store.login(picked, name, phone, org, codeEl ? codeEl.value : '');
      if (!res.ok) {
        if (res.error === 'bad_code') {
          showToast('كود Admin غير صحيح', 'error');
        } else if (res.error === 'role_mismatch') {
          showToast(`هذا الرقم مسجّل بالفعل كـ «${ROLE_META[res.existingRole].title}» — اختر نفس الدور أو استخدم رقماً آخر`, 'error');
        } else {
          showToast('أدخل رقم جوال صحيح', 'error');
        }
        return;
      }
      activeRole = picked;
      overlay.classList.add('hidden');
      showToast(res.isNew ? `أهلاً ${name} 👋 تم إنشاء حسابك` : `أهلاً بعودتك ${store.session.name} 👋`, 'success');
      formWrap.reset();
      renderApp();
    });

    document.getElementById('onboardDemoBtn').addEventListener('click', () => {
      store.enterDemo();
      activeRole = 'generator';
      overlay.classList.add('hidden');
      renderApp();
    });

    // Header user chip -> back to role selection
    const chip = document.getElementById('headerUserChip');
    if (chip) chip.addEventListener('click', openOnboarding);
    const logout = document.getElementById('logoutBtn');
    if (logout) logout.addEventListener('click', () => {
      store.logout();
      renderApp();
      openOnboarding();
    });

    if (!store.session) openOnboarding();
  }

  function openOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay) return;
    document.getElementById('onboardForm').classList.add('hidden');
    document.getElementById('onboardStepRole').classList.remove('hidden');
    overlay.classList.remove('hidden');
  }

  // ----------------------------------------------------
  // Request details modal (order page)
  // ----------------------------------------------------

  function initDetailsModal() {
    const m = document.getElementById('requestDetailsModal');
    if (!m) return;
    document.getElementById('btnCloseRequestDetails').addEventListener('click', () => m.classList.add('hidden'));
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
  }

  window.openRequestDetails = function(reqId) {
    const req = store.data.generatorRequests.find(r => r.id === reqId);
    const m = document.getElementById('requestDetailsModal');
    if (!req || !m) return;
    const idx = STATUS_FLOW.findIndex(x => x.key === req.status);
    const timeline = STATUS_FLOW.map((st, i) => {
      const done = i <= idx;
      return `<li class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-full flex items-center justify-center text-xs ${done ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}"><i class="fa-solid ${st.icon}"></i></span>
        <span class="text-sm ${done ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-400'}">${st.label}</span>
      </li>`;
    }).join('');
    const row = (k, v) => `<div class="flex justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800"><span class="text-slate-400">${k}</span><strong class="text-slate-800 dark:text-slate-100">${v}</strong></div>`;
    const commission = Math.round(req.expectedPrice * 0.08);
    document.getElementById('requestDetailsBody').innerHTML = `
      <span class="text-[11px] font-mono text-slate-400">${req.id}</span>
      <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1">${req.materialName}</h3>
      <p class="text-xs text-slate-500 mb-4"><i class="fa-solid fa-location-dot text-emerald-600"></i> ${req.city} - ${req.district}</p>
      <ol class="space-y-3 mb-5">${timeline}</ol>
      <div class="mb-4">
        ${row('الكمية', `${req.quantity} ${req.unit}`)}
        ${row('الجودة / الفرز', req.sortingQuality || '-')}
        ${row('موعد الاستلام', `${req.preferredDate} • ${req.timeSlot || ''}`)}
        ${row('نوع التسعير', req.pricingType === 'bidding' ? 'مزايدة' : 'سعر ثابت')}
        ${row('العائد المتوقع', req.expectedPrice.toLocaleString('ar-EG') + ' ج.م')}
        ${row('عمولة المنصة (8%)', commission.toLocaleString('ar-EG') + ' ج.م')}
        ${row('صافي المنشأة', (req.expectedPrice - commission).toLocaleString('ar-EG') + ' ج.م')}
        ${req.payout ? row('طريقة الصرف', (window.RLX ? RLX.PAY_LABELS[req.payout.method] : req.payout.method) + (req.payout.number ? ' • ' + req.payout.number : '')) : ''}
        ${req.dispute ? row('النزاع', req.dispute.status === 'open' ? 'قيد المراجعة' : (req.dispute.status === 'accepted' ? 'قُبل الاعتراض' : 'رُفض الاعتراض')) + row('سبب الاعتراض', req.dispute.reason) : ''}
      </div>
      ${req.assignedCollector ? `<div class="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3 text-xs mb-4"><strong>${req.assignedCollector.name}</strong><br><span class="text-slate-500">${req.assignedCollector.plate} • ${req.assignedCollector.truckType}</span></div>` : '<p class="text-xs text-slate-400 mb-4">بانتظار قبول أقرب ناقل…</p>'}
      ${(req.photos && req.photos.length) ? `<div class="flex gap-2 mb-4">${req.photos.map(ph => `<img src="${ph}" class="w-20 h-20 rounded-xl object-cover" alt="">`).join('')}</div>` : ''}
      ${req.receipt ? `<button class="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold mb-2" onclick="document.getElementById('requestDetailsModal').classList.add('hidden');viewReceiptModal('${req.id}')">عرض الإيصال الرقمي</button>` : ''}
      ${req.status === 'completed' && !req.dispute ? `<button class="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-bold" onclick="document.getElementById('requestDetailsModal').classList.add('hidden');RLX.disputeFlow('${req.id}')">اعتراض على الوزن</button>` : ''}
    `;
    m.classList.remove('hidden');
  };


  // ----------------------------------------------------
  // "Next step" guidance banner (journey organisation)
  // ----------------------------------------------------
  window.relinkNextAction = function() { if (nextAction) nextAction(); };

  function renderNextStep() {
    const el = document.getElementById('nextStepBanner');
    if (!el) return;
    const reqs = store.myRequests();
    const tasks = store.myTasks();
    const pendingAll = store.availableRequests();
    const count = st => reqs.filter(r => r.status === st).length;
    let step = null;

    if (activeRole === 'generator') {
      if (reqs.length === 0) {
        step = { n: '1', title: 'ابدأ بتسجيل أول شحنة', desc: 'حدد نوع المادة والكمية والموعد، وسنعرضها فوراً على الناقلين القريبين.', btn: 'تسجيل شحنة جديدة', act: openNewListingModal };
      } else if (count('pending') > 0) {
        const first = reqs.find(r => r.status === 'pending');
        step = { n: '2', title: `لديك ${count('pending')} طلب بانتظار ناقل`, desc: 'راجع تفاصيل الطلب أو عدّل موعده بينما ننتظر قبول أقرب ناقل.', btn: 'عرض تفاصيل الطلب', act: () => openRequestDetails(first.id) };
      } else if (count('accepted') + count('collecting') > 0) {
        const first = reqs.find(r => r.status === 'accepted' || r.status === 'collecting');
        step = { n: '3', title: 'الناقل في الطريق إليك', desc: 'جهّز المواد في موقع الاستلام، وسيتم الوزن وإصدار الإيصال عند وصوله.', btn: 'تتبع الشحنة', act: () => openRequestDetails(first.id) };
      } else {
        const done = reqs.find(r => r.status === 'completed');
        step = done ? { n: '4', title: 'اكتملت شحنتك بنجاح', desc: 'راجع الإيصال الرقمي، قيّم الناقل، أو سجّل شحنة جديدة.', btn: 'عرض الإيصال', act: () => viewReceiptModal(done.id) } : { n: '!', title: 'اعتراضك قيد المراجعة', desc: 'سيقرر Admin ويصلك إشعار بالقرار.' };
      }
    } else if (activeRole === 'collector') {
      const active = tasks.length;
      if (active > 0) {
        step = { n: '2', title: `لديك ${active} مهمة قيد التنفيذ`, desc: 'أكّد وصولك للمنشأة، ثم أدخل الوزن النهائي لإصدار الإيصال الرقمي.', btn: 'الذهاب للمهام', act: () => document.getElementById('collectorActiveTasksContainer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) };
      } else if (pendingAll.length > 0) {
        step = { n: '1', title: `${pendingAll.length} طلب جديد متاح قرب موقعك`, desc: 'افتح الطلب من القائمة أو الخريطة واضغط «قبول مهمة الجمع».', btn: 'عرض الطلبات القريبة', act: () => document.getElementById('collectorFeedContainer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) };
      } else {
        step = { n: '1', title: 'لا توجد طلبات جديدة الآن', desc: 'سيصلك إشعار فور نشر أي شحنة في نطاقك.' };
      }
    } else if (activeRole === 'admin') {
      const nd = store.adminStats().disputes.length;
      step = nd > 0 ? { n: '!', title: `${nd} نزاع بانتظار قرارك`, desc: 'راجع الأسباب ثم اقبل أو ارفض الاعتراض.', btn: 'عرض النزاعات', act: () => document.getElementById('adminPortal')?.scrollIntoView({ behavior: 'smooth' }) } : null;
    } else if (activeRole === 'factory') {
      const orders = store.myFactoryOrders();
      if (orders.length === 0) {
        step = { n: '1', title: 'اختر دفعتك الأولى', desc: 'تصفّح الدفعات المفروزة أدناه، وراجع النقاوة والسعر، ثم اضغط «شراء وتوريد فوري».', btn: 'تصفح السوق', act: () => document.getElementById('factoryMarketplaceContainer')?.scrollIntoView({ behavior: 'smooth' }) };
      } else {
        step = { n: '2', title: `لديك ${orders.length} طلب شراء قيد المتابعة`, desc: 'تابع مراحل الشحن والاستلام حتى صدور شهادة الاستدامة.', btn: 'عرض طلباتي', act: () => document.getElementById('factoryOrdersContainer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) };
      }
    }

    if (!step) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    nextAction = step.act || null;
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center flex-shrink-0">${step.n}</div>
          <div>
            <span class="text-[10px] font-bold text-emerald-600 block">الخطوة التالية</span>
            <strong class="text-sm text-slate-900 dark:text-white block">${step.title}</strong>
            <span class="text-xs text-slate-500 dark:text-slate-400">${step.desc}</span>
          </div>
        </div>
        ${step.btn ? `<button onclick="relinkNextAction()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap">${step.btn}</button>` : ''}
      </div>`;
  }

  function updateHeaderUserBadge(role) {
    const badgeAvatar = document.getElementById('headerUserAvatar');
    const badgeName = document.getElementById('headerUserName');
    const badgeRole = document.getElementById('headerUserRole');

    if (!badgeName || !badgeRole) return;

    const sess = store.data.session;
    if (role === 'generator') {
      badgeAvatar.innerHTML = '<i class="fa-solid fa-building text-emerald-600 dark:text-emerald-400"></i>';
      badgeName.textContent = (sess && !sess.demo && (sess.org || sess.name)) || 'مصنع الأغذية الحديثة';
      badgeRole.textContent = 'منشأة منتجة للمخلفات';
    } else if (role === 'collector') {
      badgeAvatar.innerHTML = '<i class="fa-solid fa-truck-fast text-amber-500"></i>';
      badgeName.textContent = store.data.collectorProfile.name;
      badgeRole.textContent = 'كابتن معتمد - أسطول نسيم البيئة';
    } else if (role === 'factory') {
      badgeAvatar.innerHTML = '<i class="fa-solid fa-industry text-blue-500"></i>';
      badgeName.textContent = store.data.factoryProfile.companyName;
      badgeRole.textContent = 'مشتري معتمد B2B - تصنيع وتدوير';
    } else if (role === 'admin') {
      badgeAvatar.innerHTML = '<i class="fa-solid fa-user-shield text-emerald-600"></i>';
      badgeName.textContent = 'مشرف المنصة';
      badgeRole.textContent = 'Admin — إدارة ReLink';
    } else {
      badgeAvatar.innerHTML = '<i class="fa-solid fa-chart-line text-teal-500"></i>';
      badgeName.textContent = 'المراقب البيئي الذكي';
      badgeRole.textContent = 'منظومة ReLink الوطنية';
    }
    if (sess && !sess.demo && sess.role === role) {
      badgeName.textContent = sess.org || sess.name;
    }
  }

  // ----------------------------------------------------
  // Master Render Function
  // ----------------------------------------------------
  function renderApp() {
    renderNotifications();
    renderGeneratorPortal();
    renderCollectorPortal();
    renderFactoryPortal();
    renderImpactPortal();
    if (window.RLX) RLX.renderAdmin();
    switchRole(activeRole);
  }

  // ----------------------------------------------------
  // Portal 1: Waste Generators
  // ----------------------------------------------------
  function renderGeneratorPortal() {
    const requests = store.myRequests();

    // Calculate Generator Stats
    const totalQtyTons = requests.reduce((acc, curr) => {
      const q = curr.unit === 'كجم' ? curr.quantity / 1000 : curr.quantity;
      return acc + q;
    }, 0);

    const totalIncome = requests.reduce((acc, curr) => acc + (curr.expectedPrice || 0), 0);
    const activeReqs = requests.filter(r => r.status !== 'completed').length;
    const completedReqs = requests.filter(r => r.status === 'completed').length;

    document.getElementById('genStatTotalQty').textContent = totalQtyTons.toFixed(1) + ' طن';
    document.getElementById('genStatIncome').textContent = totalIncome.toLocaleString('ar-EG') + ' ج.م';
    document.getElementById('genStatActive').textContent = activeReqs + ' طلبات';
    document.getElementById('genStatCompleted').textContent = completedReqs + ' مكتملة';

    // Render Filtered Requests List
    renderGeneratorRequestCards();

    // Hook New Request Form
    initNewRequestForm();
  }

  function renderGeneratorRequestCards(filterStatus = 'all') {
    const container = document.getElementById('generatorRequestsContainer');
    if (!container) return;

    let requests = store.myRequests();
    if (filterStatus !== 'all') {
      requests = requests.filter(r => r.status === filterStatus);
    }

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <i class="fa-solid fa-folder-open text-4xl mb-3"></i>
          <p class="text-base font-semibold">لا توجد طلبات تطابق هذا التصنيف حالياً</p>
          <button class="mt-4 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition" onclick="document.getElementById('btnOpenNewListingModal').click()">
            <i class="fa-solid fa-plus ml-1.5"></i> تسجيل شحنة جديدة
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const statusBadge = getStatusBadge(req.status);
      const stepper = getStepperHtml(req.status);
      const materialMeta = store.data.materials.find(m => m.id === req.materialId) || { color: 'emerald', icon: 'fa-box' };

      return `
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div>
            <!-- Header of card -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl flex-shrink-0">
                  <i class="fa-solid ${materialMeta.icon}"></i>
                </div>
                <div>
                  <span class="text-xs text-slate-400 font-mono tracking-wider">${req.id}</span>
                  <h4 class="font-bold text-slate-900 dark:text-white text-base leading-snug cursor-pointer hover:text-emerald-600" onclick="openRequestDetails('${req.id}')">${req.materialName} <i class="fa-solid fa-angle-left text-[10px]"></i></h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <i class="fa-solid fa-location-dot text-emerald-600 text-[10px]"></i> ${req.city} - ${req.district}
                  </p>
                </div>
              </div>
              <div>${statusBadge}</div>
            </div>

            <!-- Stepper Progress Tracker -->
            <div class="mb-5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div class="text-[11px] font-semibold text-slate-400 mb-2 flex justify-between">
                <span>مسار تنفيذ الشحنة:</span>
                <span>${req.timeSlot || 'الموعد المحدد'}</span>
              </div>
              ${stepper}
            </div>

            <!-- Meta details grid -->
            <div class="grid grid-cols-2 gap-2.5 text-xs mb-4">
              <div class="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span class="text-slate-400 block mb-0.5">الوزن المقدر</span>
                <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">${req.quantity} ${req.unit}</span>
              </div>
              <div class="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span class="text-slate-400 block mb-0.5">العائد المتوقع</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400 text-sm">${req.expectedPrice.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>

            ${(req.photos && req.photos.length) ? `<div class="flex gap-2 mb-4">${req.photos.map(ph => `<img src="${ph}" class="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="">`).join('')}</div>` : ''}
            <!-- Assigned Collector Info if any -->
            ${req.assignedCollector ? `
              <div class="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <i class="fa-solid fa-truck-moving text-sm"></i>
                  </div>
                  <div>
                    <span class="font-bold text-slate-800 dark:text-slate-200 block">${req.assignedCollector.name}${(() => { const rt = store.collectorRatingById(req.assignedCollector.id); return rt ? ` <span class="text-amber-500 text-[11px]">★ ${rt}</span>` : ''; })()}</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">لوحة: ${req.assignedCollector.plate} • ${req.assignedCollector.truckType}</span>
                  </div>
                </div>
                <a href="tel:${req.assignedCollector.phone}" class="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-emerald-50 transition" title="اتصال">
                  <i class="fa-solid fa-phone text-xs"></i>
                </a>
              </div>
            ` : ''}
          </div>

          <!-- Actions Footer -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            ${req.status === 'disputed' ? `
              <div class="w-full text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2"><i class="fa-solid fa-scale-unbalanced"></i> نزاع على الوزن قيد مراجعة Admin</div>
            ` : req.status === 'completed' ? `
              <div class="w-full space-y-2">
                <button class="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2" onclick="viewReceiptModal('${req.id}')"><i class="fa-solid fa-receipt"></i> عرض إيصال الاستلام الرقمي</button>
                <div class="flex gap-2 text-[11px] font-bold">
                  <button class="flex-1 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600" onclick="RLX.disputeFlow('${req.id}')">اعتراض على الوزن</button>
                  ${(req.ratings && req.ratings.generator) ? `<span class="flex-1 py-2 text-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600">قيّمت ${req.ratings.generator.stars}★</span>` : `<button class="flex-1 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600" onclick="RLX.rateFlow('${req.id}','generator')">قيّم الناقل ★</button>`}
                </div>
              </div>
            ` : req.status === 'collecting' ? `
              <div class="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                الشاحنة في طريقها إليك الآن
              </div>
              <button class="text-xs text-slate-500 hover:text-emerald-600 font-medium underline" onclick="switchRole('collector')">
                معاينة مسار السائق
              </button>
            ` : req.status === 'accepted' ? `
              <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">تم التنسيق مع جامع المخلفات</span>
              <button class="text-xs text-slate-400 hover:text-rose-500" onclick="cancelRequest('${req.id}')">إلغاء</button>
            ` : `
              <span class="text-xs text-slate-400">بانتظار قبول أقرب ناقل</span>
              <button class="text-xs text-rose-500 hover:text-rose-600 font-medium" onclick="cancelRequest('${req.id}')">إلغاء الطلب</button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'pending':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
          <i class="fa-regular fa-clock"></i> قيد الانتظار
        </span>`;
      case 'accepted':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
          <i class="fa-solid fa-check"></i> تم القبول
        </span>`;
      case 'collecting':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
          <i class="fa-solid fa-truck-fast"></i> جاري الجمع
        </span>`;
      case 'completed':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
          <i class="fa-solid fa-circle-check"></i> مكتمل
        </span>`;
      case 'disputed':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200/60"><i class="fa-solid fa-scale-unbalanced"></i> نزاع قيد المراجعة</span>`;
      default:
        return `<span class="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600">${status}</span>`;
    }
  }

  function getStepperHtml(status) {
    const steps = [
      { key: 'pending', label: 'إدراج الطلب', icon: 'fa-file-lines' },
      { key: 'accepted', label: 'قبول الناقل', icon: 'fa-handshake' },
      { key: 'collecting', label: 'الوزن والتحميل', icon: 'fa-scale-balanced' },
      { key: 'completed', label: 'الاستلام والتحصيل', icon: 'fa-circle-check' }
    ];

    const order = ['pending', 'accepted', 'collecting', 'completed'];
    const currentIndex = status === 'disputed' ? 3 : order.indexOf(status);

    return `
      <div class="relative flex items-center justify-between">
        <div class="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 z-0">
          <div class="h-full bg-emerald-500 transition-all duration-300" style="width: ${(currentIndex / (steps.length - 1)) * 100}%"></div>
        </div>
        ${steps.map((st, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return `
            <div class="relative z-10 flex flex-col items-center">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                isDone
                  ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }">
                <i class="fa-solid ${st.icon} text-[10px]"></i>
              </div>
              <span class="text-[10px] mt-1 font-medium ${isCurrent ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}">${st.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Generator Filter Tabs
  const genFilterBtns = document.querySelectorAll('[data-gen-filter]');
  genFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      genFilterBtns.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white');
        b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      });
      btn.classList.add('bg-emerald-600', 'text-white');
      btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      const filter = btn.getAttribute('data-gen-filter');
      renderGeneratorRequestCards(filter);
    });
  });

  // Modal & Form Logic for New Listing
  function initNewRequestForm() {
    const modal = document.getElementById('newListingModal');
    const openBtn = document.getElementById('btnOpenNewListingModal');
    const closeBtn = document.getElementById('btnCloseNewListingModal');
    const form = document.getElementById('newListingForm');

    if (openBtn) {
      openBtn.addEventListener('click', openNewListingModal);
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', closeNewListingModal);
    }

    // Material selector change triggers auto-price recalculation
    const materialSelect = document.getElementById('newMaterialSelect');
    const qtyInput = document.getElementById('newMaterialQty');
    const unitSelect = document.getElementById('newMaterialUnit');
    const priceOutput = document.getElementById('calculatedEstimatedPrice');

    function updatePriceEstimate() {
      if (!materialSelect || !qtyInput || !priceOutput) return;
      const matId = materialSelect.value;
      const qty = parseFloat(qtyInput.value) || 0;
      const unit = unitSelect ? unitSelect.value : 'طن';

      const found = store.data.materials.find(m => m.id === matId);
      if (found) {
        const factor = unit === 'طن' ? 1000 : 1;
        const total = Math.round(qty * factor * (found.pricePerKg || 1));
        priceOutput.textContent = total.toLocaleString('ar-EG') + ' ج.م';
      }
    }

    if (materialSelect) materialSelect.addEventListener('change', updatePriceEstimate);
    if (qtyInput) qtyInput.addEventListener('input', updatePriceEstimate);
    if (unitSelect) unitSelect.addEventListener('change', updatePriceEstimate);

    // Form Submission
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const matId = document.getElementById('newMaterialSelect').value;
        const matMeta = store.data.materials.find(m => m.id === matId);
        const qty = parseFloat(document.getElementById('newMaterialQty').value) || 1;
        const unit = document.getElementById('newMaterialUnit').value;
        const district = document.getElementById('newDistrictSelect').value;
        const preferredDate = document.getElementById('newPreferredDate').value || '2026-10-15';
        const pricingType = document.querySelector('input[name="pricingType"]:checked')?.value || 'fixed';
        const notes = document.getElementById('newMaterialNotes').value || 'مفروز ونظيف وجاهز للشحن';

        const factor = unit === 'طن' ? 1000 : 1;
        const expectedPrice = Math.round(qty * factor * (matMeta?.pricePerKg || 2));

        const newRequest = {
          id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
          generatorName: (store.me() && (store.me().org || store.me().name)) || 'مصنع الأغذية الحديثة',
          generatorType: 'منشأة صناعية',
          materialId: matId,
          materialName: matMeta?.name || 'مخلفات مفروزة',
          quantity: qty,
          unit: unit,
          sortingQuality: notes,
          city: 'القاهرة الكبرى',
          district: district,
          locationCoords: [30.1 + (Math.random() - 0.5) * 0.2, 31.4 + (Math.random() - 0.5) * 0.3],
          preferredDate: preferredDate,
          timeSlot: 'الفترة الصباحية (8:00 - 12:00)',
          pricingType: pricingType,
          expectedPrice: expectedPrice,
          status: 'pending',
          assignedCollector: null,
          createdDate: 'الآن',
          image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
          photos: window.RLX ? RLX.takePhotos() : [],
          payout: { method: (document.getElementById('newPayoutMethod') || {}).value || 'instapay', number: ((document.getElementById('newPayoutNumber') || {}).value || '').trim() },
          receipt: null
        };

        store.addGeneratorRequest(newRequest);
        closeNewListingModal();
        showToast('تم إدراج الشحنة بنجاح في شبكة ReLink!', 'success');
        triggerConfetti();
        renderApp();
      };
    }
  }

  function openNewListingModal() {
    const modal = document.getElementById('newListingModal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeNewListingModal() {
    const modal = document.getElementById('newListingModal');
    if (modal) modal.classList.add('hidden');
  }

  window.cancelRequest = function(id) {
    if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
      const idx = store.data.generatorRequests.findIndex(r => r.id === id);
      if (idx !== -1) {
        store.data.generatorRequests.splice(idx, 1);
        store.save();
        showToast('تم إلغاء الطلب', 'info');
        renderApp();
      }
    }
  };

  // ----------------------------------------------------
  // Portal 2: Waste Collectors (Radar & Live Map)
  // ----------------------------------------------------
  function renderCollectorPortal() {
    const profile = store.data.collectorProfile;
    const _sess = store.data.session;
    document.getElementById('colName').textContent = (_sess && !_sess.demo && _sess.role === 'collector') ? _sess.name : profile.name;
    document.getElementById('colFleet').textContent = profile.fleetName;
    document.getElementById('colTripsToday').textContent = profile.tripsCompletedToday + ' رحلات';
    const _rt = document.getElementById('colRatingText');
    if (_rt) _rt.textContent = profile.rating ? `تقييم ${profile.rating} ★` : 'ناقل جديد — بلا تقييم بعد';
    document.getElementById('colEarningsToday').textContent = profile.earningsToday.toLocaleString('ar-EG') + ' ج.م';
    document.getElementById('colLoadTons').textContent = `${profile.currentLoadTons} / ${profile.capacityTons} طن`;
    document.getElementById('colCapacityBar').style.width = `${(profile.currentLoadTons / profile.capacityTons) * 100}%`;

    // Render Nearby Available Feed
    renderCollectorNearbyFeed();

    // Render In-Progress Tasks
    renderCollectorActiveTasks();
  }

  function initCollectorMap() {
    const mapElement = document.getElementById('collectorMap');
    if (!mapElement || leafletMap) return;

    // Center on Riyadh coordinates
    leafletMap = L.map('collectorMap', {
      zoomControl: true,
      attributionControl: false
    }).setView([30.10, 31.45], 10);

    // Tile providers with automatic fallback (some servers block file:// origins)
    const providers = [
      { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', opts: { subdomains: 'abcd', maxZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO' } },
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 19, attribution: 'Tiles &copy; Esri' } }
    ];
    let providerIdx = 0, tileErrors = 0, tileLayerRef = null;
    function useProvider(i) {
      if (tileLayerRef) leafletMap.removeLayer(tileLayerRef);
      tileErrors = 0;
      tileLayerRef = L.tileLayer(providers[i].url, providers[i].opts).addTo(leafletMap);
      tileLayerRef.on('tileerror', () => {
        tileErrors++;
        if (tileErrors < 4) return;
        if (providerIdx < providers.length - 1) {
          providerIdx++;
          useProvider(providerIdx);
        } else {
          // Last resort: offline grid background so markers stay usable
          mapElement.style.background = 'linear-gradient(#e6efe9 1px, transparent 1px) 0 0/48px 48px, linear-gradient(90deg, #e6efe9 1px, transparent 1px) 0 0/48px 48px, #f4f8f5';
        }
      });
    }
    useProvider(0);

    updateMapMarkers();
  }

  function updateMapMarkers() {
    if (!leafletMap) return;

    // Clear existing markers
    mapMarkers.forEach(m => leafletMap.removeLayer(m));
    mapMarkers = [];

    // Add Collector Truck Marker (Live location)
    const truckIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-emerald-400 opacity-75"></span>
          <div class="relative w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
            <i class="fa-solid fa-truck text-sm"></i>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const collectorTruckMarker = L.marker([30.06, 31.34], { icon: truckIcon }).addTo(leafletMap);
    collectorTruckMarker.bindPopup(`
      <div class="text-right font-sans p-1">
        <strong class="text-emerald-700 block mb-1">موقع شاحنتك الحالي</strong>
        <p class="text-xs text-slate-600">شاحنة دينا 6 طن (جاهزة للتحميل)</p>
      </div>
    `);
    mapMarkers.push(collectorTruckMarker);

    // Add Pending & Active Requests as interactive markers
    const reqs = store.availableRequests().concat(store.myTasks());

    reqs.forEach(req => {
      const coords = req.locationCoords || [30.10, 31.45];
      const isPending = req.status === 'pending';

      const markerHtml = `
        <div class="relative cursor-pointer group">
          <div class="w-8 h-8 rounded-full ${isPending ? 'bg-amber-500' : 'bg-indigo-600'} text-white flex items-center justify-center shadow-md border-2 border-white transform transition hover:scale-110">
            <i class="fa-solid ${isPending ? 'fa-box' : 'fa-truck-ramp-box'} text-xs"></i>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'pickup-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(leafletMap);

      const popupContent = `
        <div class="text-right font-sans min-w-[200px] p-1.5" dir="rtl">
          <span class="text-[11px] font-bold text-slate-400 block">${req.id}</span>
          <h4 class="font-bold text-slate-800 text-sm mb-1">${req.materialName}</h4>
          <p class="text-xs text-slate-600 mb-2">${req.generatorName} (${req.district})</p>
          <div class="bg-slate-100 p-2 rounded-lg text-xs flex justify-between mb-3 font-semibold">
            <span>الكمية: ${req.quantity} ${req.unit}</span>
            <span class="text-emerald-600">${req.expectedPrice.toLocaleString('ar-EG')} ج.م</span>
          </div>
          ${isPending ? `
            <button class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm" onclick="acceptPickupRequest('${req.id}')">
              <i class="fa-solid fa-check ml-1"></i> قبول الشحنة فوراً
            </button>
          ` : `
            <span class="text-xs text-indigo-600 font-bold block text-center">الشحنة قيد التنفيذ</span>
          `}
        </div>
      `;

      marker.bindPopup(popupContent);
      mapMarkers.push(marker);
    });
  }

  function renderCollectorNearbyFeed() {
    const container = document.getElementById('collectorFeedContainer');
    if (!container) return;

    const pendingRequests = store.availableRequests();

    if (pendingRequests.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 text-slate-400 dark:text-slate-500">
          <i class="fa-solid fa-circle-check text-3xl mb-2 text-emerald-500"></i>
          <p class="text-sm font-semibold">تم قبول جميع طلبات الجمع المتاحة في منطقتك حالياً</p>
        </div>
      `;
      return;
    }

    container.innerHTML = pendingRequests.map(req => {
      const distanceMock = (Math.random() * 8 + 1.5).toFixed(1);
      return `
        <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-400 transition flex flex-col justify-between gap-3">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">متاح للجمع</span>
                <span class="text-xs text-slate-400 font-mono">${req.id}</span>
              </div>
              <h5 class="font-bold text-slate-900 dark:text-white text-sm">${req.materialName}</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400">${req.generatorName} • ${req.district}</p>
            </div>
            <div class="text-left font-sans">
              <span class="text-emerald-600 dark:text-emerald-400 font-black text-sm block">${req.expectedPrice.toLocaleString('ar-EG')} ج.م</span>
              <span class="text-[11px] text-slate-400">يبعد ${distanceMock} كم</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
            <span class="text-slate-600 dark:text-slate-300"><i class="fa-solid fa-weight-scale ml-1 text-slate-400"></i> ${req.quantity} ${req.unit}</span>
            <span class="text-slate-600 dark:text-slate-300"><i class="fa-solid fa-clock ml-1 text-slate-400"></i> ${req.timeSlot}</span>
          </div>

          <button class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm" onclick="acceptPickupRequest('${req.id}')">
            <i class="fa-solid fa-handshake"></i> قبول مهمة الجمع
          </button>
        </div>
      `;
    }).join('');
  }

  function renderCollectorActiveTasks() {
    const container = document.getElementById('collectorActiveTasksContainer');
    if (!container) return;

    const activeTasks = store.myTasks();

    if (activeTasks.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <i class="fa-solid fa-truck-ramp-box text-3xl mb-2 text-slate-300"></i>
          <p class="text-sm font-semibold">لا توجد مهام جمع قيد التنفيذ حالياً</p>
          <p class="text-xs text-slate-400 mt-1">اختر من الطلبات المتاحة على الخريطة للبدء</p>
        </div>
      `;
      return;
    }

    container.innerHTML = activeTasks.map(task => {
      const isArrived = task.status === 'collecting';

      return `
        <div class="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/50 shadow-md">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">مهمة نشطة الآن</span>
            </div>
            <span class="text-xs font-mono text-slate-400">${task.id}${!isArrived ? ` <button class="text-[11px] text-rose-500 underline mr-2" onclick="RLX.releaseFlow('${task.id}')">تخلٍّ عن المهمة</button>` : ''}</span>
          </div>

          <h5 class="font-bold text-slate-900 dark:text-white text-base mb-1">${task.materialName}</h5>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3"><i class="fa-solid fa-location-pin text-emerald-600 ml-1"></i> ${task.generatorName} - ${task.district}</p>

          <div class="grid grid-cols-2 gap-2 text-xs mb-4">
            <div class="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span class="text-slate-400 block">الكمية المقدرة:</span>
              <strong class="text-slate-800 dark:text-slate-200">${task.quantity} ${task.unit}</strong>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <span class="text-slate-400 block">قيمة العمولة المقدرة:</span>
              <strong class="text-emerald-600">${Math.round(task.expectedPrice * 0.15)} ج.م</strong>
            </div>
          </div>

          <div class="space-y-2">
            ${!isArrived ? `
              <button class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2" onclick="advanceCollectorTask('${task.id}', 'collecting')">
                <i class="fa-solid fa-location-arrow"></i> تأكيد الوصول للمنشأة وبدء الوزن
              </button>
            ` : `
              <button class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30" onclick="openReceiptIssuerModal('${task.id}')">
                <i class="fa-solid fa-scale-balanced"></i> إدخال الوزن النهائي وإصدار الإيصال الرقمي
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  window.acceptPickupRequest = function(id) {
    const collectorInfo = store.collectorIdentity();
    store.updateRequestStatus(id, 'accepted', collectorInfo);
    showToast(`تم قبول الشحنة ${id} بنجاح وإشعار المنشأة!`, 'success');
    renderApp();
    if (leafletMap) updateMapMarkers();
  };

  window.advanceCollectorTask = function(id, nextStatus) {
    store.updateRequestStatus(id, nextStatus);
    showToast('تم تحديث حالة المهمة: وصلت للموقع وجاري الوزن', 'info');
    renderApp();
  };

  // ----------------------------------------------------
  // Digital Collection Receipt & Signature Pad
  // ----------------------------------------------------
  function initSignatureCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 120;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#059669';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function startDraw(e) {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    function stopDraw() {
      isDrawing = false;
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    window.addEventListener('touchend', stopDraw);

    const clearBtn = document.getElementById('clearSignatureBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
  }

  window.openReceiptIssuerModal = function(requestId) {
    currentReceiptTarget = store.data.generatorRequests.find(r => r.id === requestId);
    if (!currentReceiptTarget) return;

    const modal = document.getElementById('receiptIssuerModal');
    if (!modal) return;

    document.getElementById('issuerReqId').textContent = currentReceiptTarget.id;
    document.getElementById('issuerGeneratorName').textContent = currentReceiptTarget.generatorName;
    document.getElementById('issuerMaterialName').textContent = currentReceiptTarget.materialName;

    // Prefill weights
    const estQtyKg = currentReceiptTarget.unit === 'طن' ? currentReceiptTarget.quantity * 1000 : currentReceiptTarget.quantity;
    const grossWeightInput = document.getElementById('inputGrossWeight');
    const tareWeightInput = document.getElementById('inputTareWeight');
    const netWeightDisplay = document.getElementById('displayNetWeight');
    const totalPayoutDisplay = document.getElementById('displayTotalPayout');

    // Default gross = tare + actual
    tareWeightInput.value = 5200; // truck tare kg
    grossWeightInput.value = 5200 + estQtyKg;

    function calcNet() {
      const gross = parseFloat(grossWeightInput.value) || 0;
      const tare = parseFloat(tareWeightInput.value) || 0;
      const net = Math.max(0, gross - tare);
      netWeightDisplay.textContent = net.toLocaleString('ar-EG') + ' كجم (' + (net / 1000).toFixed(2) + ' طن)';

      const mat = store.data.materials.find(m => m.id === currentReceiptTarget.materialId);
      const rate = mat?.pricePerKg || 3.0;
      const total = Math.round(net * rate);
      totalPayoutDisplay.textContent = total.toLocaleString('ar-EG') + ' ج.م';
      return { net, total, rate };
    }

    grossWeightInput.oninput = calcNet;
    tareWeightInput.oninput = calcNet;
    calcNet();

    // Confirm Issue Receipt Handler
    const confirmBtn = document.getElementById('btnConfirmIssueReceipt');
    confirmBtn.onclick = () => {
      const { net, total, rate } = calcNet();
      const receiptNo = 'RL-REC-' + Math.floor(1000 + Math.random() * 9000);

      const receiptData = {
        receiptNo: receiptNo,
        issueDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        grossWeight: parseFloat(grossWeightInput.value),
        tareWeight: parseFloat(tareWeightInput.value),
        netWeight: net,
        unit: 'كجم',
        unitPrice: rate,
        totalAmount: total,
        collectorSign: store.data.collectorProfile.name,
        generatorSign: currentReceiptTarget.generatorName,
        qrCodeSeed: `RL-VERIFIED-${receiptNo}-METRIC`
      };

      store.updateRequestStatus(currentReceiptTarget.id, 'completed', null, receiptData);
      modal.classList.add('hidden');
      showToast('تم اعتماد وزن الشحنة وإصدار الإيصال الرقمي بنجاح!', 'success');
      triggerConfetti();
      renderApp();

      // Open View Receipt right away
      const issuedId = currentReceiptTarget.id;
      setTimeout(() => {
        viewReceiptModal(issuedId);
        setTimeout(() => { if (window.RLX) RLX.rateFlow(issuedId, 'collector'); }, 1800);
      }, 500);
    };

    modal.classList.remove('hidden');
  };

  window.closeReceiptIssuerModal = function() {
    const modal = document.getElementById('receiptIssuerModal');
    if (modal) modal.classList.add('hidden');
  };

  window.viewReceiptModal = function(requestId) {
    const req = store.data.generatorRequests.find(r => r.id === requestId);
    if (!req || !req.receipt) {
      showToast('الإيصال غير متوفر لهذه الشحنة', 'error');
      return;
    }

    const modal = document.getElementById('viewReceiptModal');
    if (!modal) return;

    const r = req.receipt;
    document.getElementById('receiptModalNo').textContent = r.receiptNo;
    document.getElementById('receiptModalDate').textContent = r.issueDate;
    document.getElementById('receiptModalGenName').textContent = req.generatorName;
    document.getElementById('receiptModalColName').textContent = req.assignedCollector?.name || r.collectorSign;
    document.getElementById('receiptModalPlate').textContent = req.assignedCollector?.plate || 'أ ب د 4821';
    document.getElementById('receiptModalMaterial').textContent = req.materialName;
    document.getElementById('receiptModalGross').textContent = r.grossWeight.toLocaleString('ar-EG') + ' كجم';
    document.getElementById('receiptModalTare').textContent = r.tareWeight.toLocaleString('ar-EG') + ' كجم';
    document.getElementById('receiptModalNet').textContent = r.netWeight.toLocaleString('ar-EG') + ' كجم';
    document.getElementById('receiptModalRate').textContent = r.unitPrice + ' ج.م / كجم';
    document.getElementById('receiptModalTotal').textContent = r.totalAmount.toLocaleString('ar-EG') + ' ج.م';

    // QR + verification link + payout line (see features.js)
    if (window.RLX) RLX.decorateReceipt(req);

    modal.classList.remove('hidden');
  };

  window.closeViewReceiptModal = function() {
    const modal = document.getElementById('viewReceiptModal');
    if (modal) modal.classList.add('hidden');
  };

  // ----------------------------------------------------
  // Portal 3: Recycling Factories & B2B Marketplace
  // ----------------------------------------------------
  function renderFactoryPortal() {
    const profile = store.data.factoryProfile;
    const fn = document.getElementById('factoryName'); if (fn) fn.textContent = profile.companyName;
    document.getElementById('factoryProcuredTons').textContent = profile.procuredThisMonthTons.toFixed(1) + ' طن';
    document.getElementById('factoryQuotaPercent').textContent = `${Math.round((profile.procuredThisMonthTons / profile.monthlyQuotaTons) * 100)}% من الحصة الشهرية`;
    document.getElementById('factoryBudgetSpent').textContent = profile.budgetSpentEGP.toLocaleString('ar-EG') + ' ج.م';

    renderFactoryBatches();
    renderFactoryOrders();
  }


  function renderFactoryOrders() {
    const box = document.getElementById('factoryOrdersContainer');
    if (!box) return;
    const orders = store.myFactoryOrders();
    if (!orders.length) {
      box.innerHTML = '<div class="col-span-full text-xs text-slate-400 py-6 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">لا توجد طلبات شراء بعد — اختر دفعة من السوق بالأسفل واضغط «شراء وتوريد فوري».</div>';
      return;
    }
    box.innerHTML = orders.map(o => {
      const disputed = o.status === 'disputed', returned = o.status === 'returned';
      const i = ORDER_STEPS.findIndex(x => x.key === o.status);
      const steps = (disputed || returned) ? '' : ORDER_STEPS.map((st, k) => `<span class="text-[10px] px-2 py-1 rounded-full ${k <= i ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}">${st.label}</span>`).join('');
      const pay = window.RLX ? (RLX.PAY_LABELS[o.paymentMethod] || o.paymentMethod || 'Escrow') : 'Escrow';
      let actions = '';
      if (disputed) actions = '<div class="text-rose-600 font-bold flex items-center gap-2"><i class="fa-solid fa-scale-unbalanced"></i> طلب الإرجاع قيد مراجعة Admin</div>';
      else if (returned) actions = '<div class="text-slate-500 font-bold">تم إرجاع الدفعة ورد المبلغ لمحفظة Escrow</div>';
      else if (o.status === 'certified') actions = `<button class="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold" onclick="document.getElementById('btnViewEsgCertificate').click()">عرض شهادة الاستدامة</button>`;
      else actions = `<button class="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold" onclick="advanceFactoryOrder('${o.id}')">تقدّم للمرحلة التالية (محاكاة)</button>`
        + (o.status === 'delivered' ? `<button class="w-full mt-2 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold" onclick="RLX.orderDisputeFlow('${o.id}')">فتح نزاع / طلب إرجاع</button>` : '');
      return `<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs">
        <div class="flex justify-between mb-1 text-slate-400"><span class="font-mono">${o.id}</span><span>${o.date}</span></div>
        <strong class="text-sm text-slate-900 dark:text-white block mb-1">${o.title}</strong>
        <span class="text-slate-500 block mb-1">${o.tons} طن • ${o.total.toLocaleString('ar-EG')} ج.م</span>
        <span class="text-slate-400 block mb-3">الدفع: ${pay}</span>
        <div class="flex flex-wrap gap-1.5 mb-3">${steps}</div>
        ${actions}
      </div>`;
    }).join('');
  }

  window.advanceFactoryOrder = function(id) {
    store.advanceFactoryOrder(id);
    renderFactoryOrders();
    showToast('تم تحديث حالة طلب الشراء', 'info');
  };

  function renderFactoryBatches(categoryFilter = 'all') {
    const container = document.getElementById('factoryMarketplaceContainer');
    if (!container) return;

    let batches = store.data.factoryMarketplaceBatches;
    if (categoryFilter !== 'all') {
      batches = batches.filter(b => b.category === categoryFilter);
    }

    container.innerHTML = batches.map(batch => {
      const isAvailable = batch.status === 'available';

      return `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition duration-200">
          <div>
            <div class="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img src="${batch.image}" alt="${batch.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
              <div class="absolute top-3 right-3">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                  isAvailable ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-700 text-white'
                }">
                  ${isAvailable ? 'متاح للشحن الفوري' : 'تم الحجز / قيد التوريد'}
                </span>
              </div>
              <div class="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-mono">
                ${batch.quantityTons} طن بالات
              </div>
            </div>

            <div class="p-5">
              <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>${batch.id}</span>
                <span>${batch.supplier}</span>
              </div>
              <h4 class="font-bold text-slate-900 dark:text-white text-base mb-2 leading-snug">${batch.title}</h4>

              <!-- Purity & Lab metrics -->
              <div class="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60 mb-3 text-xs">
                <div class="flex justify-between mb-1">
                  <span class="text-slate-600 dark:text-slate-400">درجة النقاوة:</span>
                  <strong class="text-emerald-700 dark:text-emerald-400">${batch.purity}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600 dark:text-slate-400">نسبة الرطوبة:</span>
                  <strong class="text-emerald-700 dark:text-emerald-400">${batch.moisture}</strong>
                </div>
              </div>

              <!-- Specs list -->
              <ul class="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                ${batch.specs.map(s => `<li class="flex items-center gap-1.5"><i class="fa-solid fa-check text-emerald-500 text-[10px]"></i> ${s}</li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- Price & Action Footer -->
          <div class="p-5 pt-0">
            <div class="flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mb-4">
              <div>
                <span class="text-xs text-slate-400 block">السعر للطن</span>
                <strong class="text-slate-900 dark:text-white text-base font-bold">${batch.unitPricePerTon.toLocaleString('ar-EG')} ج.م</strong>
              </div>
              <div class="text-left">
                <span class="text-xs text-slate-400 block">إجمالي الدفعة</span>
                <strong class="text-emerald-600 dark:text-emerald-400 text-lg font-black">${batch.totalValue.toLocaleString('ar-EG')} ج.م</strong>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button class="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition" onclick="openBiddingModal('${batch.id}')">
                تقديم عرض RFQ
              </button>
              <button class="py-2.5 px-3 ${
                isAvailable ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              } text-xs font-bold rounded-xl transition shadow-sm" ${isAvailable ? `onclick="instantPurchaseBatch('${batch.id}')"` : 'disabled'}>
                ${isAvailable ? 'شراء وتوريد فوري' : 'محجوز'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Factory Category Tabs
  const factoryFilterBtns = document.querySelectorAll('[data-factory-filter]');
  factoryFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      factoryFilterBtns.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white');
        b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      });
      btn.classList.add('bg-emerald-600', 'text-white');
      btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      const cat = btn.getAttribute('data-factory-filter');
      renderFactoryBatches(cat);
    });
  });

  window.instantPurchaseBatch = function(batchId, method) {
    const batch = store.data.factoryMarketplaceBatches.find(b => b.id === batchId);
    if (!batch) return;
    const finish = (m) => {
      store.purchaseFactoryBatch(batchId);
      store.addFactoryOrder(batch, m);
      showToast('تمت عملية الشراء بنجاح وحجز الشحنة لخط الإنتاج!', 'success');
      triggerConfetti();
      renderApp();
    };
    if (method) { finish(method); return; }   // programmatic use (scenario / tests)
    RLX.askPayment({
      title: 'تأكيد شراء الدفعة',
      subtitle: `${batch.title} • ${batch.quantityTons} طن`,
      amountText: batch.totalValue.toLocaleString('ar-EG') + ' ج.م',
      confirmLabel: 'تأكيد الشراء'
    }, finish);
  };

  window.openBiddingModal = function(batchId) {
    const batch = store.data.factoryMarketplaceBatches.find(b => b.id === batchId);
    if (!batch) return;

    const offer = prompt(`أدخل عرض السعر المقترح للطن بالجنيه المصري (السعر الحالي: ${batch.unitPricePerTon} ج.م):`, batch.unitPricePerTon - 5000);
    if (offer) {
      showToast(`تم إرسال عرض الشراء المخصص بقيمة ${offer} ج.م/طن إلى المورد`, 'info');
    }
  };

  // Certificate Modal View
  const viewCertBtn = document.getElementById('btnViewEsgCertificate');
  if (viewCertBtn) {
    viewCertBtn.addEventListener('click', () => {
      const modal = document.getElementById('esgCertificateModal');
      if (modal) modal.classList.remove('hidden');
    });
  }
  const closeCertBtn = document.getElementById('btnCloseEsgCertificate');
  if (closeCertBtn) {
    closeCertBtn.addEventListener('click', () => {
      const modal = document.getElementById('esgCertificateModal');
      if (modal) modal.classList.add('hidden');
    });
  }

  // ----------------------------------------------------
  // Portal 4: Circular Economy Impact Hub
  // ----------------------------------------------------
  function renderImpactPortal() {
    const stats = store.data.impactStats;
    const badge = document.getElementById('impactDataBadge');
    if (badge) badge.textContent = store.isDemo() ? 'بيانات تجريبية — وضع العرض' : 'بيانات فعلية محسوبة من الشحنات المكتملة';

    document.getElementById('statRecycledTons').textContent = stats.totalRecycledTons.toLocaleString('ar-EG');
    document.getElementById('statCo2Reduced').textContent = stats.co2ReducedTons.toLocaleString('ar-EG');
    document.getElementById('statTreesEq').textContent = stats.treesEquivalent.toLocaleString('ar-EG');
    document.getElementById('statEconomicValue').textContent = stats.economicValueEGP.toLocaleString('ar-EG') + ' ج.م';

    renderImpactCharts();
  }

  function renderImpactCharts() {
    if (typeof Chart === 'undefined') return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const bd = store.impactBreakdown();   // null in demo mode -> sample series

    // Chart 1: Material Distribution (Doughnut)
    const ctx1 = document.getElementById('materialsDistributionChart');
    if (ctx1) {
      if (charts.materials) charts.materials.destroy();
      charts.materials = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['بلاستيك (PET/HDPE)', 'ورق وكرتون', 'ألومنيوم ومعادن', 'مخلفات إلكترونية', 'مواد أخرى'],
          datasets: [{
            data: (bd && bd.materials) || [42, 28, 18, 8, 4],
            backgroundColor: [
              '#10b981', // emerald
              '#f59e0b', // amber
              '#3b82f6', // blue
              '#a855f7', // purple
              '#06b6d4'  // cyan
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              rtl: true,
              labels: { color: textColor, font: { family: 'Cairo', size: 12 } }
            }
          },
          cutout: '70%'
        }
      });
    }

    // Chart 2: Monthly CO2 Avoided vs Economic Return (Bar & Line Combo)
    const ctx2 = document.getElementById('monthlyImpactChart');
    if (ctx2) {
      if (charts.monthly) charts.monthly.destroy();
      charts.monthly = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: (bd && bd.months) || ['مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر'],
          datasets: [
            {
              label: 'أطنان CO2 المخفضة',
              data: (bd && bd.co2) || [210, 320, 480, 620, 840, 1120],
              backgroundColor: '#10b981',
              borderRadius: 8
            },
            {
              type: 'line',
              label: 'القيمة الاقتصادية (مليون ج.م)',
              data: (bd && bd.value) || [2.2, 3.2, 5.0, 7.0, 8.8, 11.5],
              yAxisID: 'y1',
              borderColor: '#0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              tension: 0.35,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              rtl: true,
              labels: { color: textColor, font: { family: 'Cairo', size: 12 } }
            }
          },
          scales: {
            y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: textColor, font: { family: 'Cairo' } } },
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Cairo' } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Cairo' } }
            }
          }
        }
      });
    }
  }

  function updateChartsTheme() {
    renderImpactCharts();
  }

  // ----------------------------------------------------
  // Notifications System
  // ----------------------------------------------------
  function renderNotifications() {
    const list = document.getElementById('notifList');
    const badge = document.getElementById('notifBadge');
    if (!list) return;

    const notifs = store.myNotifications();
    const unreadCount = notifs.filter(n => n.unread).length;

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    list.innerHTML = notifs.slice(0, 6).map(n => `
      <div class="p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex items-start gap-3">
        <div class="w-8 h-8 rounded-full ${n.unread ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'} flex items-center justify-center flex-shrink-0 text-xs">
          <i class="fa-solid fa-bell"></i>
        </div>
        <div>
          <h6 class="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">${n.title}</h6>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">${n.desc}</p>
          <span class="text-[10px] text-slate-400 mt-1 block">${n.time}</span>
        </div>
      </div>
    `).join('');
  }

  // ----------------------------------------------------
  // Guided Demo Tour Modal
  // ----------------------------------------------------
  function openTourModal() {
    const modal = document.getElementById('tourModal');
    if (modal) modal.classList.remove('hidden');
  }

  window.closeTourModal = function() {
    const modal = document.getElementById('tourModal');
    if (modal) modal.classList.add('hidden');
  };

  window.tourJumpTo = function(role) {
    closeTourModal();
    switchRole(role);
    showToast(`تم الانتقال إلى لوحة: ${getRoleArabicName(role)}`, 'info');
  };

  function getRoleArabicName(role) {
    switch (role) {
      case 'generator': return 'أصحاب المخلفات والمنشآت';
      case 'collector': return 'العاملون وجامعو المخلفات';
      case 'factory': return 'مصانع وشركات التدوير';
      case 'impact': return 'مؤشرات الاقتصاد الدائري';
      case 'admin': return 'لوحة Admin';
    }
  }

  // ----------------------------------------------------
  // Toast Utility & Confetti Celebration
  // ----------------------------------------------------
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';

    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl font-medium text-xs transform transition-all duration-300 translate-y-2 opacity-0 ${bgClass}`;
    toast.innerHTML = `
      <i class="fa-solid ${icon} text-sm"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 20);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }
});
