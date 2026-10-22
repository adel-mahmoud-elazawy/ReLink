/* ============================================================================
 * ReLink v6 — feature modules
 *  - reason / rating / payment modals (disputes, cancellations, ratings, payments)
 *  - photo compression for shipment pictures
 *  - public receipt verification page (QR → ?verify=...)
 *  - Admin dashboard (revenue, accounts, disputes)
 *  - 2-minute auto-play demo scenario
 * Depends on window.relinkStore (data.js) and window.RL (exposed by app.js).
 * ========================================================================== */
(function () {
  'use strict';
  const RLX = (window.RLX = {});
  const S = () => window.relinkStore;
  const RL = () => window.RL || {};
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('ar-EG');
  const money = n => fmt(Math.round(n)) + ' ج.م';
  const toast = (m, t) => RL().showToast && RL().showToast(m, t || 'info');

  RLX.PAY_LABELS = {
    escrow: 'ReLink Escrow (محفظة الضمان)',
    instapay: 'InstaPay',
    fawry: 'Fawry',
    vodafone: 'Vodafone Cash',
    bank: 'تحويل بنكي'
  };
  RLX.STATUS_LABELS = {
    pending: 'قيد الانتظار', accepted: 'تم القبول', collecting: 'جاري الجمع', completed: 'مكتمل', disputed: 'نزاع قيد المراجعة'
  };

  const INPUT = 'w-full py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500';
  const BTN_GHOST = 'px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold';

  function ensureModal(id, inner, z) {
    let m = $(id);
    if (!m) {
      m = document.createElement('div');
      m.id = id;
      m.className = 'hidden fixed inset-0 ' + (z || 'z-[65]') + ' overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4';
      document.body.appendChild(m);
    }
    m.innerHTML = inner;
    return m;
  }
  const show = m => m.classList.remove('hidden');
  const hide = m => m.classList.add('hidden');

  // ---------------------------------------------------------------- reason modal
  RLX.askReason = function (opt, cb) {
    const m = ensureModal('rlReasonModal', `
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6">
        <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1">${esc(opt.title)}</h3>
        <p class="text-xs text-slate-500 mb-4">${esc(opt.subtitle || '')}</p>
        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">السبب</label>
        <select id="rlReasonSel" class="${INPUT} mb-3">${opt.reasons.map(r => `<option>${esc(r)}</option>`).join('')}</select>
        ${opt.withWeight ? `<label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الوزن الذي تراه صحيحاً (كجم)</label>
        <input id="rlReasonKg" type="number" min="1" class="${INPUT} mb-3" placeholder="مثال: 1100">` : ''}
        <textarea id="rlReasonNote" rows="2" class="${INPUT}" placeholder="تفاصيل إضافية (اختياري)"></textarea>
        <div class="flex gap-2 mt-4">
          <button id="rlReasonCancel" class="${BTN_GHOST}">إلغاء</button>
          <button id="rlReasonOk" class="flex-1 py-2.5 rounded-xl ${opt.danger === false ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white text-xs font-black">${esc(opt.confirmLabel || 'تأكيد')}</button>
        </div>
      </div>`);
    $('rlReasonCancel').onclick = () => hide(m);
    $('rlReasonOk').onclick = () => {
      const note = $('rlReasonNote').value.trim();
      const reason = $('rlReasonSel').value + (note ? ' — ' + note : '');
      const kgEl = $('rlReasonKg');
      if (opt.withWeight && !(Number(kgEl.value) > 0)) { toast('أدخل الوزن الذي تراه صحيحاً', 'error'); return; }
      hide(m);
      cb({ reason, claimedKg: kgEl ? kgEl.value : null });
    };
    show(m);
  };

  // ---------------------------------------------------------------- rating modal
  RLX.askRating = function (opt, cb) {
    let stars = 0;
    const m = ensureModal('rlRatingModal', `
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
        <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1">${esc(opt.title)}</h3>
        <p class="text-xs text-slate-500 mb-4">${esc(opt.subtitle || '')}</p>
        <div id="rlStars" class="flex justify-center gap-2 text-3xl mb-4" dir="ltr">
          ${[1, 2, 3, 4, 5].map(i => `<button data-s="${i}" class="text-slate-300 hover:scale-110 transition">★</button>`).join('')}
        </div>
        <textarea id="rlRatingNote" rows="2" class="${INPUT}" placeholder="تعليق (اختياري)"></textarea>
        <div class="flex gap-2 mt-4">
          <button id="rlRatingSkip" class="${BTN_GHOST}">لاحقاً</button>
          <button id="rlRatingOk" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black">إرسال التقييم</button>
        </div>
      </div>`);
    const paint = () => m.querySelectorAll('#rlStars button').forEach(b => {
      b.classList.toggle('text-amber-400', Number(b.dataset.s) <= stars);
      b.classList.toggle('text-slate-300', Number(b.dataset.s) > stars);
    });
    m.querySelectorAll('#rlStars button').forEach(b => b.onclick = () => { stars = Number(b.dataset.s); paint(); });
    $('rlRatingSkip').onclick = () => hide(m);
    $('rlRatingOk').onclick = () => {
      if (!stars) { toast('اختر عدد النجوم أولاً', 'error'); return; }
      hide(m);
      cb(stars, $('rlRatingNote').value.trim());
    };
    show(m);
  };

  // ---------------------------------------------------------------- payment modal
  RLX.askPayment = function (opt, cb) {
    const methods = opt.methods || ['escrow', 'instapay', 'fawry', 'bank'];
    const m = ensureModal('rlPayModal', `
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6">
        <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1">${esc(opt.title)}</h3>
        <p class="text-xs text-slate-500 mb-4">${esc(opt.subtitle || '')}</p>
        <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-sm font-black text-emerald-700 dark:text-emerald-300 mb-4">
          <span>المبلغ</span><span>${esc(opt.amountText)}</span>
        </div>
        <div class="space-y-2" id="rlPayList">
          ${methods.map((k, i) => `<label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input type="radio" name="rlPay" value="${k}" ${i === 0 ? 'checked' : ''} class="text-emerald-600"> ${esc(RLX.PAY_LABELS[k])}</label>`).join('')}
        </div>
        <p class="text-[11px] text-slate-400 mt-3">محاكاة للدفع داخل النموذج الأولي — لا يتم خصم أي مبالغ حقيقية.</p>
        <div class="flex gap-2 mt-4">
          <button id="rlPayCancel" class="${BTN_GHOST}">إلغاء</button>
          <button id="rlPayOk" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black">${esc(opt.confirmLabel || 'تأكيد الدفع')}</button>
        </div>
      </div>`);
    $('rlPayCancel').onclick = () => hide(m);
    $('rlPayOk').onclick = () => {
      const v = m.querySelector('input[name=rlPay]:checked');
      hide(m);
      cb(v ? v.value : 'escrow');
    };
    show(m);
  };

  // ---------------------------------------------------------------- flows used by templates
  RLX.disputeFlow = function (id) {
    RLX.askReason({
      title: 'اعتراض على وزن الشحنة', subtitle: 'سيُحوَّل الاعتراض إلى Admin للمراجعة وإشعار الناقل.',
      reasons: ['الوزن المسجّل أعلى من الفعلي', 'الجودة أقل من المسجّل', 'لم تُسلَّم الكمية كاملة', 'أخرى'],
      withWeight: true, confirmLabel: 'إرسال الاعتراض'
    }, r => {
      if (S().openDispute(id, r.reason, r.claimedKg)) { toast('تم إرسال الاعتراض إلى Admin', 'info'); RL().renderApp(); }
    });
  };
  RLX.releaseFlow = function (id) {
    RLX.askReason({
      title: 'التخلي عن المهمة', subtitle: 'ستعود الشحنة لقائمة الناقلين وتُبلَّغ المنشأة.',
      reasons: ['عطل في المركبة', 'تعذّر الوصول في الموعد', 'الكمية أكبر من سعة المركبة', 'أخرى'], confirmLabel: 'تأكيد التخلي'
    }, r => { S().releaseTask(id, r.reason); toast('تمت إعادة الشحنة لقائمة الناقلين', 'info'); RL().renderApp(); });
  };
  RLX.orderDisputeFlow = function (id) {
    RLX.askReason({
      title: 'فتح نزاع / طلب إرجاع', subtitle: 'سيراجع Admin الطلب ويقرر الإرجاع أو رفضه.',
      reasons: ['الجودة أقل من المواصفات', 'النقاوة أقل من المعلن', 'الكمية المستلمة ناقصة', 'تلف أثناء النقل', 'أخرى'], confirmLabel: 'إرسال الطلب'
    }, r => { if (S().openOrderDispute(id, r.reason)) { toast('تم إرسال طلب الإرجاع إلى Admin', 'info'); RL().renderApp(); } });
  };
  RLX.rateFlow = function (id, side) {
    const req = S().data.generatorRequests.find(r => r.id === id);
    if (!req) return;
    const target = side === 'generator' ? (req.assignedCollector ? req.assignedCollector.name : 'الناقل') : req.generatorName;
    RLX.askRating({ title: side === 'generator' ? 'قيّم الناقل' : 'قيّم المنشأة', subtitle: `${target} • الشحنة ${id}` }, (stars, note) => {
      S().rateRequest(id, side, stars, note); toast('شكراً لتقييمك ⭐', 'success'); RL().renderApp();
    });
  };

  // ---------------------------------------------------------------- photos
  RLX.compressImage = function (file, maxDim, quality) {
    maxDim = maxDim || 480; quality = quality || 0.55;
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, maxDim / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject; img.src = fr.result;
      };
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  };
  let pendingPhotos = [];
  function renderPhotoPreview() {
    const box = $('newPhotosPreview');
    if (!box) return;
    box.innerHTML = pendingPhotos.map((p, i) => `<div class="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <img src="${p}" class="w-full h-full object-cover" alt="">
      <button type="button" data-rm="${i}" class="absolute top-0 left-0 w-5 h-5 bg-rose-600 text-white text-[10px] rounded-br-lg">×</button></div>`).join('');
    box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { pendingPhotos.splice(Number(b.dataset.rm), 1); renderPhotoPreview(); });
  }
  RLX.takePhotos = function () {
    const out = pendingPhotos.slice(); pendingPhotos = []; renderPhotoPreview();
    const inp = $('newPhotosInput'); if (inp) inp.value = '';
    return out;
  };
  function initPhotos() {
    const inp = $('newPhotosInput');
    if (!inp) return;
    inp.addEventListener('change', async () => {
      const files = Array.from(inp.files || []);
      for (const f of files) {
        if (pendingPhotos.length >= 3) { toast('الحد الأقصى 3 صور للشحنة', 'info'); break; }
        try { pendingPhotos.push(await RLX.compressImage(f)); } catch (e) { toast('تعذّر قراءة الصورة', 'error'); }
      }
      inp.value = '';
      renderPhotoPreview();
    });
  }

  // ---------------------------------------------------------------- receipt verification (QR)
  const SALT = 'relink-v6-demo-salt';
  function fnv(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }
  function sign(f) {
    const base = [f.n, f.d, f.g, f.c, f.m, f.w, f.a].join('|');
    return fnv(base + SALT) + fnv(SALT + base.split('').reverse().join(''));
  }
  function b64e(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = ''; bytes.forEach(b => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64d(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
  }
  RLX.verifyUrl = function (req) {
    const r = req.receipt;
    const f = { n: r.receiptNo, d: r.issueDate, g: req.generatorName, c: (req.assignedCollector && req.assignedCollector.name) || r.collectorSign, m: req.materialName, w: r.netWeight, a: r.totalAmount };
    f.s = sign(f);
    return location.href.split('#')[0].split('?')[0] + '?verify=' + b64e(f);
  };
  RLX.decorateReceipt = function (req) {
    const url = RLX.verifyUrl(req);
    const qr = $('receiptModalQR');
    if (qr) qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(url);
    const total = $('receiptModalTotal');
    if (!total) return;
    const host = total.parentElement;
    let extra = $('rlReceiptExtra');
    if (!extra) { extra = document.createElement('div'); extra.id = 'rlReceiptExtra'; host.insertAdjacentElement('afterend', extra); }
    const pay = req.payout ? `<div class="flex justify-between text-xs mb-1"><span class="text-slate-500">طريقة الصرف:</span><strong>${esc(RLX.PAY_LABELS[req.payout.method] || req.payout.method)}${req.payout.number ? ' • ' + esc(req.payout.number) : ''}</strong></div>` : '';
    const adj = req.receipt.adjusted ? '<div class="text-[11px] font-bold text-amber-600 mb-1">تم تعديل الوزن بعد مراجعة Admin</div>' : '';
    extra.className = 'mb-3';
    extra.innerHTML = pay + adj + `<a href="${esc(url)}" target="_blank" class="text-[11px] font-bold text-emerald-700 underline">فتح صفحة التحقق العامة للإيصال</a>`;
  };
  RLX.showVerifyPage = function (token) {
    let res = null, ok = false;
    try { const f = b64d(token); const s = f.s; ok = sign(f) === s; res = f; } catch (e) { ok = false; }
    const row = (k, v) => `<div class="flex justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs"><span class="text-slate-400">${k}</span><strong class="text-slate-800 dark:text-slate-100 text-left">${esc(v)}</strong></div>`;
    const m = ensureModal('rlVerifyPage', `
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6">
        <div class="text-center mb-4">
          <div class="w-14 h-14 mx-auto rounded-2xl ${ok ? 'bg-emerald-600' : 'bg-rose-600'} text-white flex items-center justify-center text-2xl mb-2"><i class="fa-solid ${ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i></div>
          <h2 class="text-xl font-black text-slate-900 dark:text-white">${ok ? 'إيصال موثّق ✔' : 'إيصال غير صالح'}</h2>
          <p class="text-xs text-slate-500">${ok ? 'بيانات الإيصال مطابقة للتوقيع الرقمي.' : 'الرابط تالف أو تم التلاعب ببياناته.'}</p>
        </div>
        ${ok && res ? row('رقم الإيصال', res.n) + row('التاريخ', res.d) + row('المنشأة', res.g) + row('الناقل', res.c) + row('المادة', res.m) + row('الوزن الصافي', fmt(res.w) + ' كجم') + row('المبلغ', money(res.a)) : ''}
        <p class="text-[10px] text-slate-400 mt-3">التوقيع يُحسب داخل المتصفح (نموذج أولي). في النسخة الإنتاجية يتم التحقق من الخادم.</p>
        <button id="rlVerifyClose" class="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black">الانتقال إلى ReLink</button>
      </div>`, 'z-[80]');
    $('rlVerifyClose').onclick = () => { hide(m); try { history.replaceState(null, '', location.href.split('?')[0]); } catch (e) { /* ignore */ } };
    show(m);
  };

  // ---------------------------------------------------------------- Admin dashboard
  RLX.resolve = function (kind, id, decision) {
    S().resolveDispute(kind, id, decision);
    toast(decision === 'accept' ? 'تم قبول الاعتراض' : 'تم رفض الاعتراض', 'info');
    RL().renderApp();
  };
  RLX.renderAdmin = function () {
    const main = document.querySelector('main');
    if (!main || !S()) return;
    let sec = $('adminPortal');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'adminPortal';
      sec.className = 'hidden space-y-6';
      main.appendChild(sec);
    }
    const a = S().adminStats();
    const roleName = { generator: 'منشأة', collector: 'ناقل', factory: 'مصنع', admin: 'Admin' };
    const card = (label, value, sub, color) => `<div class="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
      <span class="text-[11px] text-slate-400 block mb-1">${label}</span><strong class="text-xl font-black ${color || 'text-slate-900 dark:text-white'}">${value}</strong>
      <span class="text-[11px] text-slate-400 block mt-1">${sub || ''}</span></div>`;
    const disputes = a.disputes.length ? a.disputes.map(d => `
      <div class="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><span class="font-mono text-slate-400">${esc(d.id)}</span> <strong class="text-slate-900 dark:text-white">${esc(d.title)}</strong>
          <div class="text-slate-600 dark:text-slate-300 mt-1">السبب: ${esc(d.reason)}</div>${d.extra ? `<div class="text-slate-500">${esc(d.extra)}</div>` : ''}</div>
        <div class="flex gap-2 flex-shrink-0">
          <button onclick="RLX.resolve('${d.kind}','${esc(d.id)}','accept')" class="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold">قبول</button>
          <button onclick="RLX.resolve('${d.kind}','${esc(d.id)}','reject')" class="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">رفض</button>
        </div></div>`).join('') : '<p class="text-xs text-slate-400 py-4 text-center">لا توجد نزاعات مفتوحة حالياً ✅</p>';
    const accounts = S().isDemo()
      ? '<p class="text-xs text-slate-400 py-3">في وضع العرض تظهر الأعداد فقط. سجّل حسابات حقيقية لرؤية القائمة.</p>'
      : (a.accountsList.length ? `<div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="text-slate-400 text-right"><th class="py-2">الاسم</th><th>الدور</th><th>الجوال</th></tr></thead><tbody>
        ${a.accountsList.map(x => `<tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-2 font-bold text-slate-800 dark:text-slate-100">${esc(x.name)}</td><td>${roleName[x.role] || x.role}</td><td class="font-mono">${esc(x.phone)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="text-xs text-slate-400 py-3">لا توجد حسابات بعد.</p>');
    const rows = a.requests.length ? a.requests.map(r => `<tr class="border-t border-slate-100 dark:border-slate-800">
      <td class="py-2 font-mono">${esc(r.id)}</td><td>${esc(r.materialName)}</td><td>${esc(r.generatorName)}</td>
      <td>${esc(RLX.STATUS_LABELS[r.status] || r.status)}</td><td class="font-bold text-emerald-600">${money(r.receipt ? r.receipt.totalAmount : r.expectedPrice)}</td></tr>`).join('')
      : '<tr><td colspan="5" class="py-4 text-center text-slate-400">لا توجد شحنات بعد.</td></tr>';
    sec.innerHTML = `
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div><h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"><i class="fa-solid fa-user-shield text-emerald-600"></i> لوحة تحكم المنصة (Admin)</h2>
        <p class="text-xs text-slate-500">${S().isDemo() ? 'بيانات تجريبية — وضع العرض' : 'بيانات فعلية من الحسابات المسجّلة على هذا الجهاز'}</p></div>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${card('إجمالي قيمة التداول (GMV)', money(a.gmv), 'شحنات مكتملة + طلبات المصانع')}
        ${card('إيرادات المنصة', money(a.revenue), '8% من الشحنات + 3% من طلبات المصانع', 'text-emerald-600')}
        ${card('الحسابات', fmt(a.accounts.generator + a.accounts.collector + a.accounts.factory), `${fmt(a.accounts.generator)} منشأة • ${fmt(a.accounts.collector)} ناقل • ${fmt(a.accounts.factory)} مصنع`)}
        ${card('الشحنات', fmt(a.requestsByStatus.completed) + ' مكتملة', `${fmt(a.requestsByStatus.pending)} بانتظار • ${fmt(a.requestsByStatus.disputed)} نزاع`)}
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 class="font-black text-slate-900 dark:text-white flex items-center gap-2"><i class="fa-solid fa-scale-unbalanced text-rose-500"></i> النزاعات المفتوحة (${fmt(a.disputes.length)})</h3>${disputes}</div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800"><h3 class="font-black text-slate-900 dark:text-white mb-2">الحسابات</h3>${accounts}</div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 overflow-x-auto"><h3 class="font-black text-slate-900 dark:text-white mb-2">آخر الشحنات</h3>
          <table class="w-full text-xs"><thead><tr class="text-slate-400 text-right"><th class="py-2">الرقم</th><th>المادة</th><th>المنشأة</th><th>الحالة</th><th>القيمة</th></tr></thead><tbody>${rows}</tbody></table></div>
      </div>`;
  };

  // ---------------------------------------------------------------- auto-play scenario
  let scn = null;
  function scnPanel() {
    let p = $('rlScenarioPanel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'rlScenarioPanel';
      p.className = 'hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[75] w-[min(92vw,560px)] bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/40 p-4';
      document.body.appendChild(p);
    }
    return p;
  }
  function scnSteps() {
    const st = S();
    const ctx = {};
    const go = role => { try { RL().switchRole(role); } catch (e) { /* ignore */ } };
    return [
      { t: 'المشكلة', d: 'مصر تنتج أكثر من 100 مليون طن مخلفات سنوياً (تقدير GIZ)، ومعظم المواد القابلة للتدوير تضيع. ReLink تربط من يملك المخلفات بمن يحتاجها.', run: () => go('generator') },
      { t: '1) المنشأة تسجّل شحنة', d: 'مصنع الأغذية يدرج 4 طن PET مفروز ويختار الصرف عبر InstaPay. تظهر الشحنة فوراً للناقلين.', run: () => {
        ctx.id = 'REQ-' + (7000 + Math.floor(Math.random() * 999));
        st.addGeneratorRequest({
          id: ctx.id, generatorName: 'مصنع الأغذية الحديثة', generatorType: 'منشأة صناعية', materialId: 'plastic', materialName: 'بلاستيك شفاف PET (قوارير نقية)',
          quantity: 4, unit: 'طن', sortingQuality: 'مفروز ونظيف بنسبة 97%', city: 'القاهرة الكبرى', district: 'العاشر من رمضان - المنطقة الصناعية',
          locationCoords: [30.292, 31.748], preferredDate: new Date().toISOString().slice(0, 10), timeSlot: 'الفترة الصباحية (8:00 - 12:00)', pricingType: 'fixed',
          expectedPrice: 96000, status: 'pending', assignedCollector: null, createdDate: 'الآن', receipt: null,
          image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
          payout: { method: 'instapay', number: '01012345678' }
        });
        RL().renderApp(); go('generator');
      } },
      { t: '2) الجامع يرى الطلب', d: 'يظهر الطلب على رادار الناقل مع المسافة والعمولة المتوقعة.', run: () => go('collector') },
      { t: '3) الجامع يقبل المهمة', d: 'يضغط «قبول مهمة الجمع» فتصل المنشأة إشعاراً فورياً.', run: () => { st.updateRequestStatus(ctx.id, 'accepted', st.collectorIdentity()); RL().renderApp(); go('collector'); } },
      { t: '4) الوصول والوزن', d: 'الناقل يؤكد وصوله للمنشأة ويبدأ الوزن على الميزان.', run: () => { st.updateRequestStatus(ctx.id, 'collecting'); RL().renderApp(); go('collector'); } },
      { t: '5) إيصال رقمي بـ QR', d: 'يصدر الإيصال بالوزن الصافي (3,920 كجم). امسح الـ QR لفتح صفحة التحقق العامة.', run: () => {
        const r = { receiptNo: 'RL-REC-' + (7000 + Math.floor(Math.random() * 999)), issueDate: new Date().toISOString().replace('T', ' ').substring(0, 16), grossWeight: 9120, tareWeight: 5200, netWeight: 3920, unit: 'كجم', unitPrice: 24, totalAmount: 94080, collectorSign: st.data.collectorProfile.name, generatorSign: 'مصنع الأغذية الحديثة', qrCodeSeed: 'RL-SCENARIO' };
        st.updateRequestStatus(ctx.id, 'completed', null, r); RL().renderApp();
        if (window.viewReceiptModal) window.viewReceiptModal(ctx.id);
      } },
      { t: '6) المنشأة تقيّم الناقل', d: 'تصرف المبلغ على InstaPay وتقيّم الناقل ⭐ لبناء الثقة.', run: () => {
        if (window.closeViewReceiptModal) window.closeViewReceiptModal();
        st.rateRequest(ctx.id, 'generator', 5, 'التزام ممتاز بالموعد'); RL().renderApp(); go('generator');
      } },
      { t: '7) المصنع يشتري دفعة', d: 'مصنع التدوير يشتري دفعة جاهزة بالدفع عبر InstaPay ويتابع الطلب حتى شهادة ESG.', run: () => {
        const b = st.data.factoryMarketplaceBatches.find(x => x.status === 'available');
        if (b) { st.purchaseFactoryBatch(b.id); st.addFactoryOrder(b, 'instapay'); }
        RL().renderApp(); go('factory');
      } },
      { t: '8) الأثر يتحدّث', d: 'أرقام الأثر البيئي والاقتصادي ارتفعت تلقائياً بعد الشحنة المكتملة.', run: () => go('impact') },
      { t: '9) Admin والإيرادات', d: 'المنصة تربح 8% من الشحنات و3% من طلبات المصانع، وتدير النزاعات من هنا.', run: () => go('admin') }
    ];
  }
  RLX.startScenario = function () {
    const st = S();
    if (!st.isDemo()) {
      if (!confirm('سيتم الانتقال إلى وضع العرض (Demo) لتشغيل السيناريو. حسابك الحقيقي وبياناته لن تتأثر. متابعة؟')) return;
      st.enterDemo();
      const ov = $('onboardingOverlay'); if (ov) ov.classList.add('hidden');
      RL().renderApp();
    }
    if (window.closeTourModal) window.closeTourModal();
    RLX.stopScenario(true);
    scn = { i: -1, steps: scnSteps(), paused: false, timer: null };
    next();
  };
  function paint() {
    const p = scnPanel();
    const s = scn.steps[scn.i];
    const total = scn.steps.length;
    p.classList.remove('hidden');
    p.innerHTML = `
      <div class="flex items-center justify-between mb-1.5"><span class="text-[11px] text-emerald-300 font-bold">السيناريو التلقائي • ${scn.i + 1}/${total}</span>
        <button onclick="RLX.stopScenario()" class="text-slate-400 hover:text-white text-xs">إيقاف ✕</button></div>
      <strong class="block text-sm mb-1">${esc(s.t)}</strong><p class="text-xs text-slate-300 leading-relaxed">${esc(s.d)}</p>
      <div class="h-1 bg-slate-700 rounded-full mt-3 overflow-hidden"><div class="h-full bg-emerald-500 transition-all" style="width:${((scn.i + 1) / total) * 100}%"></div></div>
      <div class="flex gap-2 mt-3 text-xs font-bold">
        <button onclick="RLX.scenarioToggle()" class="px-3 py-1.5 rounded-lg bg-slate-700">${scn.paused ? '▶ استئناف' : '⏸ إيقاف مؤقت'}</button>
        <button onclick="RLX.scenarioNext()" class="px-3 py-1.5 rounded-lg bg-emerald-600">التالي ◀</button></div>`;
  }
  function next() {
    if (!scn) return;
    clearTimeout(scn.timer);
    scn.i++;
    if (scn.i >= scn.steps.length) { finish(); return; }
    try { scn.steps[scn.i].run(); } catch (e) { console.error('scenario step failed', e); }
    paint();
    if (!scn.paused) scn.timer = setTimeout(next, 9000);
  }
  function finish() {
    const p = scnPanel();
    p.innerHTML = `<strong class="block text-sm mb-1">انتهى السيناريو ✅</strong>
      <p class="text-xs text-slate-300">رحلة كاملة: منشأة ← ناقل ← إيصال QR ← مصنع ← أثر ← Admin.</p>
      <div class="flex gap-2 mt-3 text-xs font-bold">
        <button onclick="RLX.resetDemoAfter()" class="px-3 py-1.5 rounded-lg bg-emerald-600">إعادة ضبط بيانات العرض</button>
        <button onclick="RLX.stopScenario()" class="px-3 py-1.5 rounded-lg bg-slate-700">إغلاق</button></div>`;
    scn = null;
  }
  RLX.scenarioNext = () => next();
  RLX.scenarioToggle = () => { if (!scn) return; scn.paused = !scn.paused; clearTimeout(scn.timer); if (!scn.paused) scn.timer = setTimeout(next, 3000); paint(); };
  RLX.stopScenario = function (silent) { if (scn) { clearTimeout(scn.timer); scn = null; } const p = scnPanel(); p.classList.add('hidden'); if (!silent) p.innerHTML = ''; };
  RLX.resetDemoAfter = function () { if (S().isDemo()) { S().reset(); RL().renderApp(); } RLX.stopScenario(); toast('تمت إعادة ضبط بيانات العرض', 'info'); };

  // ---------------------------------------------------------------- bootstrap
  document.addEventListener('DOMContentLoaded', () => {
    initPhotos();
    try { RLX.renderAdmin(); } catch (e) { console.error(e); }
    const token = new URLSearchParams(location.search).get('verify');
    if (token) RLX.showVerifyPage(token);
  });
})();
