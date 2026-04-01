import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Blocks,
  Database,
  EyeOff,
  Landmark,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CREDENTIAL_META } from '../constants/credentialMeta';
import ZklyLogo from '../components/ZklyLogo';

const credentialCards = [
  { type: 'btc-balance', ...CREDENTIAL_META['btc-balance'] },
  { type: 'hodl-duration', ...CREDENTIAL_META['hodl-duration'] },
  { type: 'btc-reputation', ...CREDENTIAL_META['btc-reputation'] },
];

export default function Home() {
  const navigate = useNavigate();
  const { isConnected } = useAuth();

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-4 pt-20 pb-18 sm:px-6 sm:pt-28 sm:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-[8%] h-72 w-72 rounded-full bg-teal-100/70 blur-3xl" />
          <div className="absolute right-[8%] top-[18%] h-80 w-80 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="absolute bottom-[-4rem] left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-cyan-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-teal-950 sm:text-7xl">
               Show the proof.
                <span className="sm:text-6xl block bg-gradient-to-r from-teal-800 via-cyan-700 to-amber-600 bg-clip-text text-transparent">
                 Hide the wallet.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-600 sm:text-xl">
                Zkly turns Bitcoin balance, holding history, and reputation into private proof
                you can carry across chains. Connect a BTC wallet, generate a proof
                privately, save it to Storacha, and verify it on any chain
              </p>


              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() =>
                    isConnected
                      ? navigate('/prove')
                      : window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                  className="rounded-2xl bg-teal-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
                >
                  {isConnected ? 'Create a proof' : 'Connect wallet'}
                </button>
                <button
                  onClick={() => navigate('/verify')}
                  className="rounded-2xl border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-teal-300 hover:text-teal-900"
                >
                  Verify proof
                </button>
              </div>

            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: EyeOff,
                  title: 'Private by default',
                  text: 'Wallet addresses, balances, and identity inputs stay hidden. Verifiers only see the proof artifacts and chain references.',
                },
                {
                  icon: Database,
                  title: 'Portable proof files',
                  text: 'Every proof becomes a Storacha file you can open, share, and verify later.',
                },
                {
                  icon: BadgeCheck,
                  title: 'Cross-chain rollout',
                  text: 'Starknet is available today. Other chains will be added soon',
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)] backdrop-blur"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">
                    <Icon className="h-5 w-5 text-teal-700" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-teal-950">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>

                <h2 className="mt-2 text-2xl font-semibold text-teal-950">
                  Every zkly proof becomes a portable file.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                  Storacha gives every proof a shareable CID. Users can open, copy, and manage
                  those proof files directly from zkly.
                </p>
              </div>
              <button
                onClick={() => navigate('/storacha')}
                className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Open Storacha library
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.2)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-700">
                  Why this matters
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-teal-950">
                  Screenshots and wallet addresses leak too much.
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Landmark,
                    title: 'Collateral checks',
                    text: 'Lending desks want confidence, not your full balance history.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Private gating',
                    text: 'Communities want threshold proof without turning your address into a public identity.',
                  },
                  {
                    icon: ScanSearch,
                    title: 'Safer reputation',
                    text: 'Protocols can evaluate BTC history without demanding an open wallet dossier.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-3xl border border-stone-100 bg-stone-50 p-5">
                    <Icon className="h-5 w-5 text-teal-700" />
                    <h3 className="mt-3 text-sm font-semibold text-teal-950">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-500">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-700">
              Cross-chain flow
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-teal-950">How zkly works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-stone-500">
              zkly takes Bitcoin wallet data, turns it into a private proof, and gives you a file
              you can share and verify.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                icon: Landmark,
                title: 'Bitcoin',
                text: 'Your BTC wallet is the source of the proof, without exposing your full wallet details.',
              },
              {
                icon: Blocks,
                title: 'Proof generation',
                text: 'XeroStark compiles the circuit, generates the Groth16 proof, and prepares verifier deployment data.',
                href: 'https://xerostark.xyz',
              },
    
              {
                icon: Database,
                title: 'Storacha',
                text: 'The proof bundle is uploaded as a content-addressed CID that anyone can fetch and inspect.',
              },
              {
                icon: BadgeCheck,
                title: 'Onchain verification',
                text: 'The proof verifier can be deployed on different blockchains. Starknet is the only live verification chain for zkly proofs today.',
              },
            ].map(({ icon: Icon, title, text, href }) => (
              <div key={title} className="rounded-3xl border border-stone-200 bg-white p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">
                  <Icon className="h-5 w-5 text-teal-700" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-teal-950">{title}</h3>
                {href ? (
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-teal-700 transition-colors hover:text-teal-600"
                    >
                      XeroStark
                    </a>{' '}
                    compiles the circuit, generates the Groth16 proof, and prepares verifier
                    deployment data.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proofs" className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-700">
                Proof modules
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-teal-950">What you can prove today</h2>
            </div>
            <button
              onClick={() => navigate('/prove')}
              className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-teal-300 hover:text-teal-900"
            >
              Browse all proof types
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {credentialCards.map(({ type, icon: Icon, name, description, color }) => (
              <button
                key={type}
                onClick={() => (isConnected ? navigate(`/prove/${type}`) : undefined)}
                disabled={!isConnected}
                className="group flex flex-col rounded-3xl border border-stone-200 bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50">
                  <Icon className="h-6 w-6" style={{ color }} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-teal-950">{name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">{description}</p>
                <span className="mt-5 text-sm font-medium text-teal-700">
                  {isConnected ? 'Create proof' : 'Connect wallet first'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>


      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-teal-950 px-8 py-12 text-center text-white sm:px-12">
          <div className="mx-auto mb-5 flex justify-center">
            <ZklyLogo compact />
          </div>
          <h2 className="text-3xl font-semibold">Ready to prove something useful?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-teal-100">
            Connect a BTC wallet, create a private proof, save it to Storacha, and verify it on
            Starknet.
          </p>
          <button
            onClick={() =>
              isConnected
                ? navigate('/prove')
                : window.scrollTo({ top: 0, behavior: 'smooth' })
            }
            className="mt-8 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-teal-950 transition-colors hover:bg-teal-50"
          >
            {isConnected ? 'Start a proof' : 'Connect BTC wallet'}
          </button>
        </div>
      </section>
    </div>
  );
}
