// ============================================================================
//  CONFIGURACIÓN DE FIREBASE
//  Credenciales reales de tu proyecto (Configuración -> Tus apps -> Web).
//  Usa el SDK "compat" (global firebase.*) que esperan db.js y los servicios.
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAjsNdKlF3asaARhSgdpPKF0QnjPVbeNUY",
  authDomain: "salesstock-pro-652c4.firebaseapp.com",
  projectId: "salesstock-pro-652c4",
  storageBucket: "salesstock-pro-652c4.firebasestorage.app",
  messagingSenderId: "600308258603",
  appId: "1:600308258603:web:afa209cfe53999ef89d76e"
};

firebase.initializeApp(firebaseConfig);

window.FB_AUTH = firebase.auth();
window.FB_DB = firebase.firestore();
