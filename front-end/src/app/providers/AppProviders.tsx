import React from 'react';
import { FirebaseProvider } from '../../context/FirebaseContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
