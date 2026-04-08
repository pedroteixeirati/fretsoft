import { useFirebase } from '../../../context/FirebaseContext';

export function useAuth() {
  return useFirebase();
}

export default useAuth;
