import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
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
  getDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  FirebaseAuthErrorReport,
  formatFirebaseAuthError,
  isRunningInIframe,
} from './utils/firebaseAuthHelpers.ts';

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
  try {
    // Fallback persistence chain (IndexedDB -> localStorage -> sessionStorage -> inMemory)
    // ensures Google Sign-In works even inside restricted iframes / Safari ITP / Incognito mode.
    authInstance = initializeAuth(appInstance, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    authInstance = getAuth(appInstance);
  }
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

export class FirebaseSignInError extends Error {
  public readonly code: string;
  public readonly report: FirebaseAuthErrorReport;

  constructor(report: FirebaseAuthErrorReport) {
    super(report.message);
    this.name = 'FirebaseSignInError';
    this.code = report.code;
    this.report = report;
  }
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

const verifiedAdminUids = new Set<string>();

export function isFirebaseAdminUser(user?: FirebaseUser | null): boolean {
  if (!user || !user.email) return false;
  if (user.emailVerified !== true) return false;
  if (user.email.trim().toLowerCase() === ADMIN_BOOTSTRAP_EMAIL) {
    return true;
  }
  return verifiedAdminUids.has(user.uid);
}

export async function verifyAndCacheFirebaseAdminUser(user?: FirebaseUser | null): Promise<boolean> {
  if (!user || !user.email || user.emailVerified !== true) return false;
  if (user.email.trim().toLowerCase() === ADMIN_BOOTSTRAP_EMAIL) {
    verifiedAdminUids.add(user.uid);
    return true;
  }
  if (verifiedAdminUids.has(user.uid)) return true;
  if (!dbInstance) return false;
  try {
    const adminSnap = await getDoc(doc(dbInstance, 'admins', user.uid));
    if (adminSnap.exists()) {
      verifiedAdminUids.add(user.uid);
      return true;
    }
  } catch {
    // Non-admin user or read denied
  }
  return false;
}

export function isFirebaseAdminAuthenticated(): boolean {
  return Boolean(isFirebaseConfigured && authInstance?.currentUser && isFirebaseAdminUser(authInstance.currentUser));
}

export function getFirebaseCurrentUser(): FirebaseUser | null {
  return authInstance?.currentUser || null;
}

let inFlightGoogleSignIn: Promise<FirebaseUser> | null = null;

export async function signInAdminWithGoogle(): Promise<FirebaseUser> {
  if (!isFirebaseConfigured || !authInstance) {
    throw new FirebaseSignInError({
      code: 'auth/not-configured',
      message: 'Firebase chưa được cấu hình trong ứng dụng.',
    });
  }

  // Deduplicate rapid double-clicks so Firebase never rejects with auth/cancelled-popup-request
  if (inFlightGoogleSignIn) {
    return inFlightGoogleSignIn;
  }

  const runSignIn = async (): Promise<FirebaseUser> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    let signedInUser: FirebaseUser;
    try {
      const result = await signInWithPopup(authInstance!, provider, browserPopupRedirectResolver);
      signedInUser = result.user;
    } catch (err) {
      const report = formatFirebaseAuthError(err, {
        hostname: typeof window !== 'undefined' ? window.location.hostname : '',
        inIframe: isRunningInIframe(),
        projectId: firebaseProjectId,
        adminEmail: ADMIN_BOOTSTRAP_EMAIL,
      });
      throw new FirebaseSignInError(report);
    }

    // Refresh ID token immediately so Firestore rules receive verified email claims right away
    try {
      await signedInUser.getIdToken(true);
    } catch {
      // Non-fatal; existing token from popup is already fresh
    }

    const isAllowedAdmin = await verifyAndCacheFirebaseAdminUser(signedInUser);
    if (!isAllowedAdmin) {
      const chosenEmail = signedInUser.email || 'không rõ';
      await signOut(authInstance!).catch(() => {});
      const report = formatFirebaseAuthError(
        Object.assign(
          new Error(
            `Tài khoản Google (${chosenEmail}) không có quyền Quản trị viên. Vui lòng chọn đúng tài khoản ${ADMIN_BOOTSTRAP_EMAIL}.`
          ),
          { code: 'auth/admin-email-mismatch' }
        ),
        {
          hostname: typeof window !== 'undefined' ? window.location.hostname : '',
          inIframe: isRunningInIframe(),
          projectId: firebaseProjectId,
          adminEmail: ADMIN_BOOTSTRAP_EMAIL,
        }
      );
      throw new FirebaseSignInError(report);
    }

    return signedInUser;
  };

  inFlightGoogleSignIn = runSignIn().finally(() => {
    inFlightGoogleSignIn = null;
  });

  return inFlightGoogleSignIn;
}

export async function signOutFirebase(): Promise<void> {
  verifiedAdminUids.clear();
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
