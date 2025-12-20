// firebase.js
// firebase.js
console.log('firebase.js: carregando módulo firebase.js');
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuração do Firebase (substitua se necessário)
const firebaseConfig = {
  apiKey: "AIzaSyC0xzvKeVDNcxm5GPQ9F8mYPj8AznFDoxU",
  authDomain: "calendario-de-financas.firebaseapp.com",
  projectId: "calendario-de-financas",
  storageBucket: "calendario-de-financas.firebasestorage.app",
  messagingSenderId: "1084133027012",
  appId: "1:1084133027012:web:62353806ceb4d1921aed91",
  measurementId: "G-DB6YEVYF65"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('✅ Login bem-sucedido:', result.user.email);
    return {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    };
  } catch (error) {
    console.error('❌ Erro no login:', error.code, error.message);
    if (error.code === 'auth/popup-closed-by-user') throw new Error('Login cancelado. Tente novamente.');
    if (error.code === 'auth/popup-blocked') throw new Error('Pop-up bloqueado. Permita pop-ups neste site.');
    if (error.code === 'auth/unauthorized-domain') {
      // Mensagem mais clara para testes locais
      const host = window.location.hostname || 'seu domínio';
      const msg = `Domínio não autorizado para OAuth: ${host}.\n` +
        'Adicione 127.0.0.1 e localhost em Firebase Console → Authentication → Authorized domains,\n' +
        'ou sirva o site via HTTP em http://127.0.0.1:8000 para testes locais.';
      alert(msg);
      throw new Error(msg);
    }
    throw new Error('Erro ao fazer login. Tente novamente.');
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    console.log('✅ Logout bem-sucedido');
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    throw error;
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL });
    } else {
      callback(null);
    }
  });
};

export const saveUserData = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...data, lastUpdated: serverTimestamp() }, { merge: true });
    console.log('✅ Dados salvos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error);
    throw error;
  }
};

export const loadUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      console.log('✅ Dados carregados com sucesso');
      return docSnap.data();
    }
    console.log('ℹ️ Nenhum dado encontrado para este usuário');
    return null;
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    throw error;
  }
};

// Expor também no objeto global para scripts não-módulo
window.firebaseAPI = { signInWithGoogle, logout, onAuthChange, saveUserData, loadUserData };
console.log('firebase.js: window.firebaseAPI definido');

