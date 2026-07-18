const DB = {
  _cache: {},
  _ready: false,
  _keys: ['users', 'products', 'sales', 'fiados'],

  async init() {
    if (this._ready) return;
    const seedRef = window.FB_DB.collection('meta').doc('seed');
    const snapshot = await seedRef.get();
    if (!snapshot.exists) {
      await seedRef.set({
        initialized: true,
        users: [{ id: 1, username: 'Sistemapro', password: 'Sistemapro1532', role: 'ADMIN', created: new Date().toISOString() }],
        products: [],
        sales: [],
        fiados: []
      });
    }
    await this._loadAll();
    this._subscribeAll();
    this._ready = true;
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
