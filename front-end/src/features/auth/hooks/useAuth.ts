import { useFirebase } from '../../../context/FirebaseContext';

export function useAuth() {
  const auth = useFirebase();

  return {
    user: auth.user,
    userProfile: auth.userProfile,
    loading: auth.loading,
    isAuthReady: auth.isAuthReady,
    refreshProfile: auth.refreshProfile,
    signUp: auth.signUp,
    signIn: auth.signIn,
    logout: auth.logout,
  };
}
