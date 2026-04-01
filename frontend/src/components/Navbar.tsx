import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Wallet } from 'lucide-react';
import { useBtcWallet } from '../contexts/BtcWalletContext';
import ZklyLogo from './ZklyLogo';

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Navbar() {
  const location = useLocation();
  const {
    btcAddress,
    btcConnected,
    connectedWallet,
    availableWallets,
    isConnecting,
    connect,
    disconnect,
    error,
  } = useBtcWallet();

  const [menuOpen, setMenuOpen] = useState(false);
  const installedWallets = availableWallets.filter((wallet) => wallet.installed);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <ZklyLogo compact />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {[
            { href: '/', label: 'Home' },
            { href: '/proofs', label: 'Proofs' },
            { href: '/storacha', label: 'Files' },
            { href: '/verify', label: 'Verify' },
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm transition-colors ${
                isActive(item.href)
                  ? 'text-teal-950'
                  : 'text-stone-500 hover:text-teal-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="relative flex items-center gap-3">
          {btcConnected && btcAddress ? (
            <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50">
                <Wallet className="h-4 w-4 text-teal-700" />
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">
                  {connectedWallet || 'wallet'}
                </p>
                <p className="font-mono text-xs text-teal-950">{shortenAddress(btcAddress)}</p>
              </div>
              <button
                onClick={disconnect}
                className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] text-stone-500 transition-colors hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
              >
                {isConnecting ? 'Connecting...' : 'Connect BTC wallet'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-14 w-72 rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
                  <div className="px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                      Wallets
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                      Connect one Bitcoin wallet. zkly handles the Starknet verification relay in
                      the backend.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {availableWallets.map((wallet) => (
                      <button
                        key={wallet.type}
                        onClick={() => {
                          connect(wallet.type).finally(() => setMenuOpen(false));
                        }}
                        disabled={!wallet.installed || isConnecting}
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-teal-950">{wallet.name}</p>
                          <p className="text-[11px] text-stone-400">
                            {wallet.installed ? 'Detected in this browser' : 'Not installed'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                            wallet.installed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {wallet.installed ? 'Ready' : 'Missing'}
                        </span>
                      </button>
                    ))}
                  </div>

                  {!installedWallets.length && (
                    <p className="px-3 pb-2 pt-3 text-xs leading-relaxed text-stone-500">
                      No supported Bitcoin wallet was detected. Install Unisat, Leather, or
                      Xverse, then refresh.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-700">
          {error}
        </div>
      )}
    </nav>
  );
}
