import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };

function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Email atau password tidak cocok. Di HP, matikan autofill/suggesti keyboard lalu ketik ulang manual (perhatikan huruf besar-kecil dan spasi).";
    case "auth/user-disabled":
      return "Akun admin ini dinonaktifkan. Aktifkan kembali di Firebase Console.";
    case "auth/operation-not-allowed":
      return "Metode Email/Password belum diaktifkan. Buka Firebase Console → Authentication → Sign-in method.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan login. Tunggu beberapa menit lalu coba lagi.";
    case "auth/network-request-failed":
      return "Koneksi internet bermasalah. Cek jaringan HP lalu coba lagi.";
    default:
      return error instanceof Error
        ? error.message
        : "Login gagal. Periksa email dan password lalu coba lagi.";
  }
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<User> {
  if (!auth) {
    throw new Error("Firebase Auth belum dikonfigurasi di server");
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function logoutAdmin(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function watchAdmin(
  callback: (user: User | null) => void,
): () => void {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}
