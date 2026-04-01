import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CREDENTIAL_META } from '../constants/credentialMeta';

const proofCards = [
  { type: 'btc-balance', ...CREDENTIAL_META['btc-balance'] },
  { type: 'hodl-duration', ...CREDENTIAL_META['hodl-duration'] },
  { type: 'btc-reputation', ...CREDENTIAL_META['btc-reputation'] },
] as const;

export default function ProofCatalog() {
  const navigate = useNavigate();
  const { isConnected } = useAuth();

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-700">
              Proof modules
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-teal-950">Choose a proof to create</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
              Start from one of zkly’s three Bitcoin proof flows. Your BTC wallet stays the only
              wallet the user needs to connect.
            </p>
          </div>

          {!isConnected && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-500 shadow-sm">
              <Wallet className="h-4 w-4 text-teal-700" />
              Connect a BTC wallet to enable proof creation
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {proofCards.map(({ type, icon: Icon, name, description, color }) => (
            <button
              key={type}
              onClick={() => (isConnected ? navigate(`/prove/${type}`) : undefined)}
              disabled={!isConnected}
              className="group flex flex-col rounded-3xl border border-stone-200 bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50">
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-teal-950">{name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">{description}</p>
              <span className="mt-5 text-sm font-medium text-teal-700">
                {isConnected ? 'Create proof' : 'Connect wallet first'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
