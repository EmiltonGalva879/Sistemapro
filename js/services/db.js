const DB = {
  _cache: {},
  _ready: false,
  _keys: ['users', 'products', 'sales', 'sales_fiscal', 'sales_normal', 'fiados', 'licenses', 'biz'],
  _listeners: [],

  async init() {
    if (this._ready) return;
    try {
      const seedRef = window.FB_DB.collection('meta').doc('seed');
      const snapshot = await seedRef.get();
      if (!snapshot.exists) {
        await seedRef.set({
          initialized: true,
           users: [{ id: 1, username: 'Sistemapro', email: 'Sistemapro@sistema.local', role: 'ADMIN', createdBy: 'system', created: new Date().toISOString(), licensed: true, companyId: '1' }],
          products: [],
           sales: [],
           sales_fiscal: [],
           sales_normal: [],
           fiados: [],
          licenses: [],
          biz: {}
        });
      }
      await this._loadAll();
      await this._migrateIfNeeded();
      this._subscribeAll();
      this._ready = true;
    } catch (e) {
      this._ready = false;
      console.error('[DB] Init failed:', e);
      // Don't throw - allow app to work with localStorage fallback
      this._loadFromLocalStorage();
    }
  },

  _loadFromLocalStorage() {
    for (const key of this._keys) {
      try {
        const data = localStorage.getItem('salesstock_db_' + key);
        if (data) this._cache[key] = JSON.parse(data);
      } catch (e) {
        this._cache[key] = [];
      }
    }
    if (!this._cache.biz) this._cache.biz = {};
  },

  async _loadAll() {
    for (const key of this._keys) {
      try {
        const doc = await window.FB_DB.collection('data').doc(key).get();
        this._cache[key] = doc.exists ? (doc.data().items || (key === 'biz' ? doc.data() : [])) : (key === 'biz' ? {} : []);
      } catch (e) {
        console.warn(`[DB] Failed to load ${key}:`, e.message);
        this._cache[key] = key === 'biz' ? {} : [];
      }
    }
    // Sync localStorage as backup
    this._syncToLocalStorage();
  },

  _syncToLocalStorage() {
    for (const key of this._keys) {
      try {
        localStorage.setItem('salesstock_db_' + key, JSON.stringify(this._cache[key] || (key === 'biz' ? {} : [])));
      } catch (e) {
        console.warn(`[DB] LocalStorage sync failed for ${key}:`, e.message);
      }
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
        if (key !== 'biz' && !item.companyId && item.id) {
          item.companyId = '1';
          changed = true;
        }
      });
    }
    if (changed) {
      for (const key of this._keys) {
        if (key === 'biz') continue;
        if (this._cache[key] && this._cache[key].length >= 0) {
          try {
            await window.FB_DB.collection('data').doc(key).set({ items: this._cache[key] });
          } catch (e) {
            console.warn(`[DB] Migration write failed for ${key}:`, e.message);
          }
        }
      }
    }
  },

  _subscribeAll() {
    // Clean up existing listeners
    this._listeners.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    this._listeners = [];

    for (const key of this._keys) {
      try {
        const unsub = window.FB_DB.collection('data').doc(key).onSnapshot(
          doc => {
            if (doc.exists) {
              this._cache[key] = key === 'biz' ? doc.data() : (doc.data().items || []);
              this._syncToLocalStorage();
              if (window.state) { window.state._dirty = true; render(); }
            }
          },
          err => console.error(`[DB] Snapshot error for ${key}:`, err)
        );
        this._listeners.push(unsub);
      } catch (e) {
        console.warn(`[DB] Failed to subscribe to ${key}:`, e.message);
      }
    }
  },

  get(key) {
    if (!this._cache[key]) this._cache[key] = key === 'biz' ? {} : [];
    // Return a copy to prevent direct mutation
    return Array.isArray(this._cache[key]) ? [...this._cache[key]] : { ...this._cache[key] };
  },

  set(key, data) {
    if (!this._cache[key]) this._cache[key] = key === 'biz' ? {} : [];
    this._cache[key] = data;
    this._syncToLocalStorage();
    if (window.state) { window.state._dirty = true; render(); }

    return window.FB_DB.collection('data').doc(key).set(
      key === 'biz' ? data : { items: data }
    ).catch(err => {
      console.error(`[DB] Failed to write ${key}:`, err);
      return null;
    });
  },

  // Cleanup method for testing or hot reload
  destroy() {
    this._listeners.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    this._listeners = [];
    this._ready = false;
  }
};

window.App = window.App || {};
window.App.Services = window.App.Services || {};
window.App.Services.DB = DB;