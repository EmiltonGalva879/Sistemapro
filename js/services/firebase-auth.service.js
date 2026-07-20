const FirebaseAuth = {
  async register(username, password) {
    const email = username + '@sistema.local';
    const cred = await window.FB_AUTH.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    await new Promise(r => setTimeout(r, 500));
    await window.App.Services.DB.init();
    const profile = {
      id: user.uid,
      username: username,
      email: email,
      role: 'ADMIN',
      created: new Date().toISOString(),
      licensed: false
    };
    const users = await window.App.Services.DB.get('users');
    users.push(profile);
    await window.App.Services.DB.set('users', users);
    return profile;
  },

  async login(username, password) {
    if (username === 'Sistemapro') {
      throw new Error('USE_LOCAL');
    }
    const email = username + '@sistema.local';
    const cred = await window.FB_AUTH.signInWithEmailAndPassword(email, password);
    const user = cred.user;
    await new Promise(r => setTimeout(r, 500));
    await window.App.Services.DB.init();
    const users = await window.App.Services.DB.get('users');
    let profile = users.find(u => u.email === email);
    if (!profile) {
      profile = { id: user.uid, username: username, email: email, role: 'ADMIN', created: new Date().toISOString(), licensed: false };
      users.push(profile);
      await window.App.Services.DB.set('users', users);
    }
    return profile;
  },

  async loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await window.FB_AUTH.signInWithPopup(provider);
    const user = cred.user;
    try {
      await new Promise(r => setTimeout(r, 500));
      await window.App.Services.DB.init();
    } catch (e) {
      console.error('DB init after google', e);
    }
    const users = await window.App.Services.DB.get('users');
    let profile = users.find(u => u.email === user.email);
    if (!profile) {
      profile = { id: user.uid, username: (user.email || '').split('@')[0], email: user.email, role: 'ADMIN', created: new Date().toISOString(), licensed: false };
      users.push(profile);
      await window.App.Services.DB.set('users', users);
    }
    return profile;
  },

  async logout() {
    await window.FB_AUTH.signOut();
  },

  onAuthChange(callback) {
    window.FB_AUTH.onAuthStateChanged(callback);
  }
};

window.App = window.App || {};
window.App.Services = window.App.Services || {};
window.App.Services.FirebaseAuth = FirebaseAuth;

