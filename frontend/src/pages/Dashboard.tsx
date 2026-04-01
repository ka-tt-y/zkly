import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBtcWallet } from '../contexts/BtcWalletContext';
import { CopyBtn } from '../components/ProofComponents';
import { getCredentialsLocal } from '../utils/credentialStore';
import type { StoredCredential } from '../utils/credentialStore';
import { CREDENTIAL_META, interpretSignals } from '../utils/signalInterpreter';
import { useMemo } from 'react';


function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isExpired(credential: StoredCredential): boolean {
  if (!credential.expiresAt) return false;
  return new Date(credential.expiresAt).getTime() < Date.now();
}

function expiryLabel(credential: StoredCredential): string | null {
  if (!credential.expiresAt) return null;
  const exp = new Date(credential.expiresAt);
  if (exp.getTime() < Date.now()) return 'Expired';
  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86_400_000);
  if (daysLeft <= 7) return `${daysLeft}d left`;
  return exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


export default function Dashboard() {
  const navigate = useNavigate();
  const { isConnected } = useAuth();
  const { btcAddress } = useBtcWallet();
  const credentials = useMemo<StoredCredential[]>(
    () =>
      getCredentialsLocal().filter(
        (credential) =>
          !btcAddress ||
          !credential.ownerWalletAddress ||
          credential.ownerWalletAddress === btcAddress,
      ),
    [btcAddress],
  );

  const handleView = (cred: StoredCredential) => {
    navigate(`/proofs/${cred.id}`);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <svg className="h-5 w-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-teal-900 mb-2">Connect your wallet</h2>
          <p className="text-sm text-gray-500">Connect a Bitcoin wallet to view your proofs.</p>
        </div>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-teal-900 mb-2">No proofs yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            Create your first zero-knowledge proof to prove your BTC holdings privately.
          </p>
          <button
            onClick={() => navigate('/prove')}
            className="rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors shadow-sm"
          >
            Create Proof
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-teal-900">Your Proofs</h1>
            <p className="text-xs text-gray-500 mt-1">
              {credentials.length} proof{credentials.length !== 1 ? 's' : ''} saved to Storacha
            </p>
          </div>
          <button
            onClick={() => navigate('/prove')}
            className="rounded-lg bg-teal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors shadow-sm"
          >
            + New
          </button>
        </div>



        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {credentials.map((cred) => {
            const meta = CREDENTIAL_META[cred.credentialType];
            const Icon = meta?.icon;
            const claims = interpretSignals(cred.credentialType, cred.publicSignals);
            const expired = isExpired(cred);
            const expLabel = expiryLabel(cred);
            const primaryClaim = claims[0];
            const subjectLabel = cred.subjectDisplayMode === 'hashed' ? 'Subject (hashed)' : 'Subject';

            return (
              <div
                key={cred.id}
                className={`group relative rounded-2xl border bg-white p-6 transition-all duration-200 hover:shadow-lg ${
                  expired
                    ? 'border-red-200 opacity-60 hover:opacity-80 hover:shadow-red-50'
                    : 'border-gray-200 hover:border-teal-200 hover:shadow-teal-50'
                }`}
              >
                  <div className="mb-4 flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      expired ? 'bg-red-50' : 'bg-teal-50'
                    }`}>
                      {Icon ? (
                        <Icon className="h-5 w-5" style={{ color: meta.color }} />
                      ) : (
                        <span className="text-lg">📄</span>
                      )}
                    </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-teal-900 truncate">
                      {meta?.name || cred.credentialName || 'Unknown'}
                    </h3>
                    <p className="text-[11px] text-gray-400">{timeAgo(cred.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {expLabel && (
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                        expired
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        {expLabel}
                      </span>
                    )}
                    {cred.starknetTxHash && (
                      <span className="text-[9px] font-medium bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200">
                        Verified on Starknet
                      </span>
                    )}
                    {cred.storachaCid && !cred.starknetTxHash && (
                      <span className="text-[9px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200">
                        Storacha
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  {primaryClaim && (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] text-gray-400">{primaryClaim.label}</p>
                      <p className={`text-sm font-semibold ${expired ? 'text-gray-400' : 'text-teal-800'}`}>
                        {primaryClaim.value}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
                    <p className="text-[10px] text-stone-400">Stored file</p>
                    {cred.storachaCid ? (
                      <p className={`font-mono text-xs font-semibold ${expired ? 'text-gray-400' : 'text-teal-800'}`}>
                        {cred.storachaCid.slice(0, 14)}...{cred.storachaCid.slice(-8)}
                      </p>
                    ) : (
                      <p className={`text-sm font-semibold ${expired ? 'text-gray-400' : 'text-teal-800'}`}>
                        Unavailable
                      </p>
                    )}
                  </div>
                </div>

                {cred.subjectDisplay && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[10px] text-amber-700/80">{subjectLabel}</p>
                    <p className="truncate text-sm font-semibold text-amber-800">{cred.subjectDisplay}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleView(cred)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-[11px] font-medium text-teal-700 transition-colors hover:bg-teal-100"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Open proof
                  </button>
                  {!cred.starknetTxHash && (
                    <button
                      onClick={() => navigate(`/proofs/${cred.id}`)}
                      className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-[11px] font-medium text-violet-700 transition-colors hover:bg-violet-100"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Verify on Starknet
                    </button>
                  )}
                  {cred.storachaCid && (
                    <CopyBtn
                      text={`${window.location.origin}/p/shared/${cred.storachaCid}`}
                      label="Copy share link"
                      copiedLabel="Link copied"
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[11px] font-medium text-gray-600 hover:border-teal-200 hover:text-teal-800"
                    />
                  )}
                  <button
                    onClick={() => navigate('/storacha')}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[11px] text-gray-500 transition-colors hover:border-teal-200 hover:text-teal-800"
                  >
                    Manage file
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
