import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from 'react';
import { useBtcWallet } from './BtcWalletContext';

interface AuthState {
  isConnected: boolean;
  btcAddress: string | null;
  btcConnected: boolean;
  isChecking: boolean;
}

const AuthContext = createContext<AuthState>({
  isConnected: false,
  btcAddress: null,
  btcConnected: false,
  isChecking: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { btcAddress, btcConnected, isConnecting: btcConnecting } = useBtcWallet();
  const getState = useCallback(
    () => ({
      isConnected: btcConnected,
      btcAddress,
      btcConnected,
      isChecking: btcConnecting,
    }),
    [btcAddress, btcConnected, btcConnecting],
  );

  const state = getState();

  return (
    <AuthContext.Provider
      value={{
        ...state,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
