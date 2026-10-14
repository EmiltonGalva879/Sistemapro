const firebaseConfig = (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) || {
  apiKey: "AIzaSyAjsNdKlF3asaARhSgdpPKF0QnjPVbeNUY",
  authDomain: "salesstock-pro-652c4.firebaseapp.com",
  projectId: "salesstock-pro-652c4",
  storageBucket: "salesstock-pro-652c4.firebasestorage.app",
  messagingSenderId: "600308258603",
  appId: "1:600308258603:web:afa209cfe53999ef89d76e",
  measurementId: "G-KG421BEGJF"
};

try {
  firebase.initializeApp(firebaseConfig);

  window.FB_AUTH = firebase.auth();
  window.FB_DB = firebase.firestore();

  window.FB_AUTH.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  if (typeof firebase.appCheck === 'function') {
    const _recaptchaKey = (typeof window !== 'undefined' && window.__RECAPTCHA_SITE_KEY__) || '';
    if (_recaptchaKey) {
      firebase.appCheck().activate(_recaptchaKey, true);
    }
  }
} catch (e) {
  console.error('[Firebase] Error al inicializar:', e);
}