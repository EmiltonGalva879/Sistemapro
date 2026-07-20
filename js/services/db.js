const DB = {
  _cache: {},
  _ready: false,
  _keys: ['users', 'products', 'sales', 'fiados', 'licenses'],

  async init() {
    if (this._ready) return;
    const seedRef = window.FB_DB.collection('meta').doc('seed');
    const snapshot = await seedRef.get();
    if (!snapshot.exists) {
      await seedRef.set({
        initialized: true,
        users: [{ id: 1, username: 'Sistemapro', password: 'Sistemapro1532', role: 'ADMIN', createdBy: 'system', created: new Date().toISOString(), licensed: true }],
        products: [],
        sales: [],
        fiados: [],
        licenses: [
          { key: 'PRO-2024-DEMO-0001', used: false },
          { key: 'PRO-2024-DEMO-0002', used: false },
          { key: 'PRO-2024-DEMO-0003', used: false }
        ]
      });
    }
    await this._loadAll();
    await this._migrateIfNeeded();
    await this._ensureDefaultLicenses();
    this._subscribeAll();
    this._ready = true;
  },

  async _ensureDefaultLicenses() {
    try {
      const licenses = this._cache['licenses'];
      if (!licenses || licenses.length === 0) {
        const defaults = [
          { key: 'PRO-2024-DEMO-0001', used: false },
          { key: 'PRO-2024-DEMO-0002', used: false },
          { key: 'PRO-2024-DEMO-0003', used: false }
        ];
        this._cache['licenses'] = defaults;
        const docRef = window.FB_DB.collection('data').doc('licenses');
        const doc = await docRef.get();
        if (!doc.exists) {
          await docRef.set({ items: defaults });
        } else {
          const data = doc.data();
          if ((!data || !data.items || data.items.length === 0) && defaults.length > 0) {
            await docRef.set({ items: defaults });
          }
        }
      }
    } catch (e) {
      console.error('Error ensuring default licenses', e);
    }
  },

  async _migrateIfNeeded() {
    let changed = false;
    for (const key of this._keys) {
      const arr = this._cache[key];
      if (!Array.isArray(arr)) continue;
      arr.forEach(item => {
        if (key === 'users' && !item.createdBy && item.role === 'ADMIN' && String(item.id) !== '1') {
          item.createdBy = '1';
          changed = true;
        }
        if (key === 'products' && !item.createdBy) {
          item.createdBy = '1';
          changed = true;
        }
      });
    }
    if (changed) {
      for (const key of this._keys) {
        if (this._cache[key] && this._cache[key].length >= 0) {
          await window.FB_DB.collection('data').doc(key).set({ items: this._cache[key] });
        }
      }
    }
  },

  async _loadAll() {
    for (const key of this._keys) {
      const doc = await window.FB_DB.collection('data').doc(key).get();
      this._cache[key] = doc.exists ? doc.data().items : [];
    }
  },

  _subscribeAll() {
    for (const key of this._keys) {
      window.FB_DB.collection('data').doc(key).onSnapshot(doc => {
        if (doc.exists) {
          this._cache[key] = doc.data().items || [];
          if (window.state) { window.state._dirty = true; render(); }
        }
      });
    }
  },

  get(key) {
    if (!this._cache[key]) this._cache[key] = [];
    return this._cache[key];
  },

  set(key, data) {
    this._cache[key] = data;
    window.FB_DB.collection('data').doc(key).set({ items: data });
  }
};

window.App = window.App || {};
window.App.Services = window.App.Services || {};
window.App.Services.DB = DB;
