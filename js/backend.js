// Optional backend sync (Firebase Firestore). Disabled unless window.RELINK_FIREBASE is set in js/config.js.
// Syncs the LIVE world (requests, orders, notifications, accounts) as one document; demo mode never syncs.
// Limitations (prototype): last-write-wins on the whole document; Firestore doc limit is ~1 MB (photos count).
(function () {
  'use strict';
  const cfg = window.RELINK_FIREBASE;
  if (!cfg || !cfg.apiKey) return;
  const BASE = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const clientId = Math.random().toString(36).slice(2);
  let timer = null, docRef = null, first = true;

  const load = src => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  function push() {
    const ex = window.relinkStore.exportLive();
    docRef.set({ world: ex.world, accounts: ex.accounts, by: clientId, updated: Date.now() }).catch(e => console.warn('ReLink sync push failed', e));
  }
  async function init() {
    await load(BASE + 'firebase-app-compat.js');
    await load(BASE + 'firebase-firestore-compat.js');
    firebase.initializeApp(cfg);
    docRef = firebase.firestore().collection('relink').doc('live');
    docRef.onSnapshot(snap => {
      const store = window.relinkStore;
      if (first) {
        first = false;
        if (!snap.exists) push();                       // first device seeds the cloud copy
        else if (snap.data().by !== clientId) { store.applyRemote(snap.data().world, snap.data().accounts); window.RL && window.RL.renderApp(); }
        store._notify = () => { clearTimeout(timer); timer = setTimeout(push, 500); };
        return;
      }
      if (!snap.exists || snap.data().by === clientId) return;
      store.applyRemote(snap.data().world, snap.data().accounts);
      window.RL && window.RL.renderApp();
    }, e => console.warn('ReLink sync listener failed', e));
  }
  init().catch(e => console.warn('ReLink sync disabled:', e));
})();
