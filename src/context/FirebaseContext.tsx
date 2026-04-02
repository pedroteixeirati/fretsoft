import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, signUpWithEmail, signInWithEmail, logout } from '../firebase';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { OperationType } from '../firebase';

interface UserProfile {
  uid: string;
  email: string;
  role: 'dev' | 'admin' | 'driver' | 'viewer';
  name?: string;
  createdAt: string;
}

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  signUp: (email: string, pass: string, role?: 'admin' | 'driver' | 'viewer') => Promise<any>;
  signIn: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<any>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const handleFirestoreError = (error: any, operation: OperationType, path: string) => {
    const errInfo = {
      error: error.message || String(error),
      code: error.code,
      operationType: operation,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      }
    };
    console.error('Firestore Error Details:', JSON.stringify(errInfo, null, 2));
    throw new Error(`Erro de permissão no Firestore (${operation} em ${path}). Verifique as Security Rules.`);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Buscar perfil do usuário
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
            console.log('Perfil do usuário carregado:', data.role);
          } else {
            // CORREÇÃO AUTOMÁTICA: Se o usuário logou mas não tem perfil (usuário antigo), cria um agora
            let role: 'dev' | 'admin' | 'driver' | 'viewer' = 'driver';
            if (user.email === 'pedroteixeirati@hotmail.com') role = 'dev';
            else if (user.email === 'pedroteixeirati@gmail.com') role = 'admin';
            
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              role: role,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, newProfile);
              setUserProfile(newProfile);
              console.log('Perfil criado automaticamente:', role);
            } catch (err) {
              console.error('Erro ao criar perfil automático:', err);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const normalizeEmail = (identifier: string) => {
    if (identifier.includes('@')) return identifier;
    return `${identifier.toLowerCase().trim()}@novalog.test`;
  };

  const signUp = async (identifier: string, pass: string, requestedRole?: 'admin' | 'driver' | 'viewer') => {
    const email = normalizeEmail(identifier);
    const { createUserByAdmin } = await import('../firebase');
    const result = await createUserByAdmin(email, pass);
    const newUser = result.user;
    
    let role: 'dev' | 'admin' | 'driver' | 'viewer' = requestedRole || 'driver';
    if (email === 'pedroteixeirati@hotmail.com') role = 'dev';
    else if (email === 'pedroteixeirati@gmail.com') role = 'admin';
    
    const profile: UserProfile = {
      uid: newUser.uid,
      email: newUser.email!,
      role: role,
      createdAt: new Date().toISOString()
    };

    const path = `users/${newUser.uid}`;
    try {
      await setDoc(doc(db, 'users', newUser.uid), profile);
      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const signIn = async (identifier: string, pass: string) => {
    const email = normalizeEmail(identifier);
    return signInWithEmail(email, pass);
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      userProfile,
      loading, 
      isAuthReady, 
      signUp, 
      signIn, 
      logout 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
