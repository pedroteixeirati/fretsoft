import { deleteApp, getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const createUserByAdmin = async (email: string, pass: string) => {
  const secondaryApp = getApps().some((appInstance) => appInstance.name === 'SecondaryApp')
    ? getApp('SecondaryApp')
    : initializeApp(firebaseConfig, 'SecondaryApp');
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const result = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    await signOut(secondaryAuth);
    return result;
  } finally {
    await deleteApp(secondaryApp).catch(() => undefined);
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DataErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleDataError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DataErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map((provider) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Data Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signUpWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const signInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
