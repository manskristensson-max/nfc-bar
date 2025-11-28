import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const { firebaseConfig, BAR_ID } = window.__CONFIG__;
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

(async () => {
  // 🔑 Viktigt: logga in anonymt innan vi sätter realtidslyssning
  try { await signInAnonymously(auth); } catch (e) { console.error('Auth failed', e); }

  const grid = document.getElementById('grid');
  const audio = document.getElementById('ding');
  const tables = Array.from({ length: 10 }, (_, i) => String(i + 1));

  function renderTable(tId, data) {
    const el = document.createElement('div');
    el.className = 'table ' + (data?.status || 'idle');
    el.dataset.table = tId;
    el.innerHTML = `
      <div class="name">Bord ${tId}</div>
      <div class="status">${data?.status || 'idle'}</div>
      <div class="updated">${data?.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleTimeString() : ''}</div>
    `;
    el.addEventListener('click', async () => {
      await setDoc(doc(collection(db, 'bars', BAR_ID, 'tables'), tId), {
        status: 'idle',
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    return el;
  }

  // skapa rutorna
  tables.forEach(t => grid.appendChild(renderTable(t, {})));

  // realtidslyssning
  tables.forEach(t => {
    const ref = doc(collection(db, 'bars', BAR_ID, 'tables'), t);
    onSnapshot(ref, snap => {
      const data = snap.data() || { status: 'idle' };
      const el = grid.querySelector(`.table[data-table="${t}"]`);
      if (!el) return;
      const wasRed = el.className.includes('needs_service');
      el.className = 'table ' + (data.status || 'idle');
      el.querySelector('.status').textContent = data.status || 'idle';
      el.querySelector('.updated').textContent = data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleTimeString() : '';
      if (!wasRed && data.status === 'needs_service') audio?.play?.().catch(() => {});
    });
  });
})();
