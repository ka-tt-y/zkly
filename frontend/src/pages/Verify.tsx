import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Search, ShieldCheck } from 'lucide-react';
import { CopyBtn } from '../components/ProofComponents';
import { hashSubjectValue } from '../utils/subjectIdentity';

export default function Verify() {
  const navigate = useNavigate();
  const [cid, setCid] = useState('');
  const [cidError, setCidError] = useState<string | null>(null);
  const [subjectInput, setSubjectInput] = useState('');
  const [subjectCommitment, setSubjectCommitment] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);

  const handleLookup = () => {
    const trimmed = cid.trim();
    if (!trimmed) {
      setCidError('Please enter a Storacha CID.');
      return;
    }

    setCidError(null);
    navigate(`/p/shared/${trimmed}`);
  };

  const handleHash = async () => {
    const value = subjectInput.trim();
    if (!value) return;

    setIsHashing(true);
    try {
      setSubjectCommitment(await hashSubjectValue(value));
    } catch {
      setSubjectCommitment(null);
    } finally {
      setIsHashing(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50">
            <ShieldCheck className="h-6 w-6 text-teal-700" />
          </div>
          <h1 className="text-3xl font-semibold text-teal-950">Verify a zkly credential</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
            Open a proof bundle by Storacha CID, or compute the subject commitment a verifier
            should compare against the proof&apos;s public signals.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">
              <Search className="h-5 w-5 text-teal-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-teal-950">Open by Storacha CID</h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                Paste the CID from a zkly share link to inspect the proof bundle, public signals,
                on-chain status, and claim summary.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={cid}
              onChange={(event) => {
                setCid(event.target.value);
                setCidError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleLookup();
              }}
              placeholder="bafy..."
              className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 font-mono text-sm text-stone-700 outline-none transition-colors focus:border-teal-300 focus:bg-white"
            />
            <button
              onClick={handleLookup}
              className="rounded-2xl bg-teal-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
            >
              Open proof
            </button>
          </div>

          {cidError && <p className="mt-2 text-xs text-red-700">{cidError}</p>}
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
              <Hash className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-teal-950">Subject commitment helper</h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                When a proof uses hashed subject binding, the verifier hashes the same subject value
                and compares that commitment to public signal `[3]`.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={subjectInput}
              onChange={(event) => setSubjectInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleHash();
              }}
              placeholder="user@example.com"
              className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-700 outline-none transition-colors focus:border-amber-300 focus:bg-white"
            />
            <button
              onClick={handleHash}
              disabled={isHashing || !subjectInput.trim()}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-amber-200 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isHashing ? 'Hashing...' : 'Compute'}
            </button>
          </div>

          {subjectCommitment && (
            <div className="mt-4 rounded-2xl border border-stone-100 bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                    Subject commitment
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-stone-700">
                    {subjectCommitment}
                  </p>
                </div>
                <CopyBtn
                  text={subjectCommitment}
                  label="Copy"
                  copiedLabel="Copied"
                  className="text-[11px] text-stone-500 hover:text-teal-700"
                />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
                Compare this against public signal `[3]` on the proof page when the proof uses a
                hashed subject mode.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
