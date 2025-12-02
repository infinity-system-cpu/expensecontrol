// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyALVRX-_Xy3r37sh7ibsdlcP0v2OXg1KUk",
    authDomain: "expensecontrol-7e0d5.firebaseapp.com",
    projectId: "expensecontrol-7e0d5",
    storageBucket: "expensecontrol-7e0d5.firebasestorage.app",
    messagingSenderId: "549485478456",
    appId: "1:549485478456:web:106f758d8487c320a71ccd"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore y hacerlo globalmente accesible
window.firebaseDb = firebase.firestore();

// Opcional: También hacer `db` global para compatibilidad con otros archivos
window.db = window.firebaseDb;

console.log("Firebase inicializado y disponible globalmente como firebaseDb y db.");