import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const ADMIN_BOOTSTRAP_EMAIL = 'hoang08shh@gmail.com';

export const isFirebaseConfigured = Boolean(
  firebaseConfig &&
    typeof firebaseConfig.projectId === 'string' &&
    firebaseConfig.projectId.length > 0 &&
    firebaseConfig.projectId !== 'remixed-project-id' &&
    typeof firebaseConfig.apiKey === 'string' &&
    firebaseConfig.apiKey.length > 0
);

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

const isBrowserRuntime = typeof window !== 'undefined' && typeof document !== 'undefined';

if (isFirebaseConfigured && isBrowserRuntime) {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
  authInstance = getAuth(appInstance);
}

export const firebaseApp = appInstance;
export const db = dbInstance as Firestore;
export const auth = authInstance as Auth;
export const firebaseProjectId = firebaseConfig?.projectId || '';
export const firestoreDatabaseId = firebaseConfig?.firestoreDatabaseId || '';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isFirebaseQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  return /quota exceeded/i.test(msg);
}

export function isFirebaseAdminUser(user?: FirebaseUser | null): boolean {
  if (!user || !user.email) return false;
  return (
    user.email.trim().toLowerCase() === ADMIN_BOOTSTRAP_EMAIL &&
    user.emailVerified === true
  );
}

export function isFirebaseAdminAuthenticated(): boolean {
  return Boolean(isFirebaseConfigured && authInstance?.currentUser && isFirebaseAdminUser(authInstance.currentUser));
}

export function getFirebaseCurrentUser(): FirebaseUser | null {
  return authInstance?.currentUser || null;
}

export async function signInAdminWithGoogle(): Promise<FirebaseUser> {
  if (!isFirebaseConfigured || !authInstance) {
    throw new Error('Firebase chưa được cấu hình.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(authInstance, provider);
  const signedInUser = result.user;
  if (!isFirebaseAdminUser(signedInUser)) {
    await signOut(authInstance).catch(() => {});
    throw new Error(
      `Tài khoản Google (${signedInUser.email || 'không rõ'}) không có quyền Quản trị viên. Vui lòng chọn đúng tài khoản ${ADMIN_BOOTSTRAP_EMAIL}.`
    );
  }
  return signedInUser;
}

export async function signOutFirebase(): Promise<void> {
  if (authInstance) {
    await signOut(authInstance).catch(() => {});
  }
}

async function testConnection(): Promise<void> {
  if (typeof window === 'undefined' || !isFirebaseConfigured || !dbInstance) return;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (isBrowserRuntime && isFirebaseConfigured) {
  testConnection();
}
