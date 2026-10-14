const FirebaseAuth = {
  // Map Firebase Auth error codes to user-friendly messages
  _mapError(code) {
    const messages = {
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/email-already-in-use': 'Este correo ya está registrado',
      'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres)',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/too-many-requests': 'Demasiados intentos. Intente más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifique su internet',
      'auth/popup-closed-by-user': 'Ventana emergente cerrada',
      'auth/cancelled-popup-request': 'Solicitud cancelada',
    };
    return messages[code] || `Error de autenticación: ${code}`;
  },

  async register(username, password, licenseKey) {
    if (!window.FB_AUTH) throw new Error('Firebase no está configurado. Verifica firebase-config.js');
    if (!window.App?.Services?.DB) throw new Error('Base de datos no inicializada');

    username = (username || '').trim();
    if (!username) throw new Error('Nombre de usuario requerido');
    if (username.length < 3) throw new Error('El usuario debe tener al menos 3 caracteres');
    if (username.length > 30) throw new Error('Máximo 30 caracteres');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new Error('Solo letras, números y guión bajo');

    if (!password || password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
    if (!licenseKey?.trim()) throw new Error('Clave de licencia requerida');

    const email = username + '@sistema.local';

    try {
      const cred = await window.FB_AUTH.createUserWithEmailAndPassword(email, password);
      const user = cred.user;

      // Wait for auth to propagate
      await new Promise(r => setTimeout(r, 300));

      await window.App.Services.DB.init();

      // Verify license
      const licenses = await window.App.Services.DB.get('licenses');
      const license = licenses.find(l => l.key === licenseKey.trim());
      if (!license) throw new Error('Clave de licencia inválida');
      if (license.used) throw new Error('Esta licencia ya fue utilizada');

      // Check if username already exists
      const users = await window.App.Services.DB.get('users');
      if (users.find(u => u.username === username)) {
        throw new Error('Este nombre de usuario ya está registrado');
      }

      const profile = {
        id: user.uid,
        username: username,
        email: email,
        role: 'ADMIN',
        created: new Date().toISOString(),
        licensed: true,
        licenseKey: licenseKey.trim(),
        companyId: String(license.companyId || license.key),
        createdBy: '1'
      };

      users.push(profile);
      await window.App.Services.DB.set('users', users);

      // Mark license as used
      license.used = true;
      license.usedBy = user.uid;
      license.usedAt = new Date().toISOString();
      await window.App.Services.DB.set('licenses', licenses);

      return profile;
    } catch (e) {
      // Clean up Firebase user if DB write failed
      if (e.code && e.code.startsWith('auth/')) {
        throw new Error(this._mapError(e.code));
      }
      throw e;
    }
  },

  async login(username, password) {
    if (!window.FB_AUTH) throw new Error('Firebase no está configurado. Verifica firebase-config.js');
    if (!window.App?.Services?.DB) throw new Error('Base de datos no inicializada');

    username = (username || '').trim();
    if (!username) throw new Error('Nombre de usuario requerido');
    if (!password) throw new Error('Contraseña requerida');

    const email = username + '@sistema.local';

    try {
      const cred = await window.FB_AUTH.signInWithEmailAndPassword(email, password);
      const user = cred.user;

      await new Promise(r => setTimeout(r, 300));
      await window.App.Services.DB.init();

      const users = await window.App.Services.DB.get('users');
      let profile = users.find(u => u.email === email);

      if (!profile) {
        // Create profile if doesn't exist (shouldn't happen normally)
        profile = {
          id: user.uid,
          username: username,
          email: email,
          role: 'ADMIN',
          created: new Date().toISOString(),
          licensed: false,
          companyId: user.uid,
          createdBy: '1'
        };
        users.push(profile);
        await window.App.Services.DB.set('users', users);
      }

      return profile;
    } catch (e) {
      if (e.code && e.code.startsWith('auth/')) {
        throw new Error(this._mapError(e.code));
      }
      throw e;
    }
  },

  async loginWithGoogle() {
    if (!window.FB_AUTH) throw new Error('Firebase no está configurado. Verifica firebase-config.js');
    if (!window.App?.Services?.DB) throw new Error('Base de datos no inicializada');

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const cred = await window.FB_AUTH.signInWithPopup(provider);
      const user = cred.user;

      await new Promise(r => setTimeout(r, 300));
      await window.App.Services.DB.init();

      const users = await window.App.Services.DB.get('users');
      let profile = users.find(u => u.email === user.email);

      if (!profile) {
        profile = {
          id: user.uid,
          username: (user.email || '').split('@')[0],
          email: user.email,
          role: 'ADMIN',
          created: new Date().toISOString(),
          licensed: false,
          companyId: user.uid,
          createdBy: '1'
        };
        users.push(profile);
        await window.App.Services.DB.set('users', users);
      }

      return profile;
    } catch (e) {
      if (e.code && e.code.startsWith('auth/')) {
        throw new Error(this._mapError(e.code));
      }
      throw e;
    }
  },

  async logout() {
    if (!window.FB_AUTH) return;
    try {
      await window.FB_AUTH.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
  },

  onAuthChange(callback) {
    if (!window.FB_AUTH) return () => {};
    return window.FB_AUTH.onAuthStateChanged(callback);
  }
};

window.App = window.App || {};
window.App.Services = window.App.Services || {};
window.App.Services.FirebaseAuth = FirebaseAuth;