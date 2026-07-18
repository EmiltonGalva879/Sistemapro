const FirebaseAuth = {
  async register(email, password) {
    const cred = await window.FB_AUTH.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    await window.App.Services.DB.init();
    const profile = {
      id: user.uid,
      username: email.split('@')[0],
      email: email,
      role: 'USER',
      created: new Date().toISOString()
    };
    const users = await window.App.Services.DB.get('users');
    users.push(profile);
    await window.App.Services.DB.set('users', users);
    return profile;
  },

  async login(email, password) {
    const cred = await window.FB_AUTH.signInWithEmailAndPassword(email, password);
    const user = cred.user;
    await window.App.Services.DB.init();
    const users = await window.App.Services.DB.get('users');
    let profile = users.find(u => u.email === email);
    if (!profile) {
      profile = { id: user.uid, username: email.split('@')[0], email: email, role: 'USER', created: new Date().toISOString() };
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
      await window.App.Services.DB.init();
    } catch (e) {
      console.error('DB init after google', e);
    }
    const users = await window.App.Services.DB.get('users');
    let profile = users.find(u => u.email === user.email);
    if (!profile) {
      profile = { id: user.uid, username: (user.email || '').split('@')[0], email: user.email, role: 'USER', created: new Date().toISOString() };
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

