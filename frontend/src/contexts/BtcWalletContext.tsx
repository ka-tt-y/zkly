import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type BtcWalletType = 'unisat' | 'leather' | 'xverse';

interface BtcWalletInfo {
  type: BtcWalletType;
  name: string;
  installed: boolean;
}

interface BtcWalletContextValue {
  btcAddress: string | null;
  btcConnected: boolean;
  connectedWallet: BtcWalletType | null;
  availableWallets: BtcWalletInfo[];
  isConnecting: boolean;
  connect: (type: BtcWalletType) => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  error: string | null;
}

const BtcWalletContext = createContext<BtcWalletContextValue | null>(null);

export const useBtcWallet = () => {
  const ctx = useContext(BtcWalletContext);
  if (!ctx) throw new Error('useBtcWallet must be used inside BtcWalletProvider');
  return ctx;
};

declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      signMessage: (message: string) => Promise<string>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
    btc?: {
      request: (method: string, params?: Record<string, unknown>) => Promise<{
        result: {
          addresses?: { address: string; type: string }[];
          signature?: string;
        };
      }>;
    };
    BitcoinProvider?: {
      request: (method: string, params?: unknown[]) => Promise<unknown>;
    };
  }
}

function detectWallets(): BtcWalletInfo[] {
  return [
    {
      type: 'unisat' as BtcWalletType,
      name: 'Unisat',
      installed: typeof window !== 'undefined' && !!window.unisat,
    },
    {
      type: 'leather' as BtcWalletType,
      name: 'Leather',
      installed: typeof window !== 'undefined' && !!window.btc,
    },
    {
      type: 'xverse' as BtcWalletType,
      name: 'Xverse',
      installed: typeof window !== 'undefined' && !!window.BitcoinProvider,
    },
  ];
}


const STORAGE_KEY = 'zkly_btc_wallet';

export function BtcWalletProvider({ children }: { children: ReactNode }) {
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<BtcWalletType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<BtcWalletInfo[]>([]);

  useEffect(() => {
    const detect = () => setAvailableWallets(detectWallets());
    detect();
    const timer = setTimeout(detect, 1000);
    return () => clearTimeout(timer);
  }, []);

  const connectWallet = useCallback(async (type: BtcWalletType) => {
    setIsConnecting(true);
    setError(null);
    try {
      let address: string;

      switch (type) {
        case 'unisat': {
          if (!window.unisat) throw new Error('Unisat wallet not found. Please install it.');
          const accounts = await window.unisat.requestAccounts();
          if (!accounts.length) throw new Error('No accounts returned from Unisat');
          address = accounts[0];
          break;
        }
        case 'leather': {
          if (!window.btc) throw new Error('Leather wallet not found. Please install it.');
          const response = await window.btc.request('getAddresses');
          const addrs = response.result.addresses;
          if (!addrs?.length) throw new Error('No addresses returned from Leather');
          // Prefer native segwit (p2wpkh)
          const segwit = addrs.find((a) => a.type === 'p2wpkh') || addrs[0];
          address = segwit.address;
          break;
        }
        case 'xverse': {
          if (!window.BitcoinProvider) throw new Error('Xverse wallet not found. Please install it.');
          const result = (await window.BitcoinProvider.request('getAccounts', [])) as {
            result: string[];
          };
          const accounts = Array.isArray(result) ? result : (result as { result: string[] }).result;
          if (!accounts?.length) throw new Error('No accounts returned from Xverse');
          address = accounts[0];
          break;
        }
        default:
          throw new Error(`Unknown wallet type: ${type}`);
      }

      setBtcAddress(address);
      setConnectedWallet(type);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ type }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect BTC wallet';
      setError(msg);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setBtcAddress(null);
    setConnectedWallet(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const { type } = JSON.parse(saved) as { type: BtcWalletType };
      // Don't auto-connect if wallet is not installed
      const wallets = detectWallets();
      const wallet = wallets.find((w) => w.type === type);
      if (wallet?.installed) {
        connectWallet(type).catch(() => {});
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [connectWallet]);

  // Listen for account changes (Unisat)
  useEffect(() => {
    if (connectedWallet !== 'unisat' || !window.unisat) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        disconnect();
      } else {
        setBtcAddress(accs[0]);
      }
    };

    window.unisat.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.unisat?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [connectedWallet, disconnect]);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!connectedWallet || !btcAddress) {
        throw new Error('No BTC wallet connected');
      }

      switch (connectedWallet) {
        case 'unisat': {
          if (!window.unisat) throw new Error('Unisat wallet not available');
          return await window.unisat.signMessage(message);
        }
        case 'leather': {
          if (!window.btc) throw new Error('Leather wallet not available');
          const response = await window.btc.request('signMessage', {
            message,
            paymentType: 'p2wpkh',
          });
          if (!response.result.signature) throw new Error('No signature returned');
          return response.result.signature;
        }
        case 'xverse': {
          if (!window.BitcoinProvider) throw new Error('Xverse wallet not available');
          const result = (await window.BitcoinProvider.request('signMessage', [
            message,
          ])) as { signature: string } | string;
          const sig = typeof result === 'string' ? result : (result as { signature: string }).signature;
          if (!sig) throw new Error('No signature returned from Xverse');
          return sig;
        }
        default:
          throw new Error(`Cannot sign with wallet type: ${connectedWallet}`);
      }
    },
    [connectedWallet, btcAddress],
  );

  return (
    <BtcWalletContext.Provider
      value={{
        btcAddress,
        btcConnected: !!btcAddress,
        connectedWallet,
        availableWallets,
        isConnecting,
        connect: connectWallet,
        disconnect,
        signMessage,
        error,
      }}
    >
      {children}
    </BtcWalletContext.Provider>
  );
}
