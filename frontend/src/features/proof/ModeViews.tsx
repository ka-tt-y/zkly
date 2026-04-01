import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Database,
  Globe2,
  Link2,
  LockKeyhole,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { CopyBtn, InfoRow, PipelineStep } from '../../components/ProofComponents';
import {
  getVoyagerContractUrl,
  getVoyagerTxUrl,
} from '../../services/starknetVerifier';
import type { Claim } from '../../utils/signalInterpreter';
import { getProofExplanation, getSignalExplanation } from './content';

function compactValue(value: string, start = 10, end = 8): string {
  if (value.length <= start + end + 1) {
    return value;
  }

  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function ProofHero({
  icon: Icon,
  iconColor,
  name,
  mainClaim,
  isVerified,
  isExpired,
  saved,
  isResultMode,
  createdAt,
  credentialType,
}: {
  icon?: LucideIcon;
  iconColor?: string;
  name: string;
  mainClaim?: Claim;
  isVerified: boolean;
  isExpired: boolean;
  saved: boolean;
  isResultMode: boolean;
  createdAt?: string;
  credentialType: string;
}) {
  const explanation = getProofExplanation(credentialType);

  return (
    <div className="border-b border-stone-100 px-6 py-8 text-center sm:px-8">
      {Icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50">
          <Icon className="h-7 w-7" style={{ color: iconColor }} />
        </div>
      )}

      <h1 className="text-xl font-bold text-teal-950">{name}</h1>

      <div className="mb-5 mt-3 flex items-center justify-center gap-2">
        {isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="h-3 w-3" />
            Verified on Starknet
          </span>
        )}
        {isExpired && (
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700">
            Expired
          </span>
        )}
        {!isExpired && !isVerified && saved && (
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700">
            Verification pending
          </span>
        )}
      </div>

      {mainClaim && (
        <div className="rounded-3xl border border-stone-100 bg-stone-50 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            {mainClaim.label}
          </p>
          <p className="mt-1 text-3xl font-bold text-teal-950">{mainClaim.value}</p>
        </div>
      )}

      {!isResultMode && (
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-stone-500">
          {explanation.what}
        </p>
      )}

      {!isResultMode && createdAt && (
        <p className="mt-3 text-[11px] text-stone-400">
          Created{' '}
          {new Date(createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}

export function ResultModePanel({
  isAnonymous,
  subjectDisplay,
  subjectDisplayMode,
  displayExpiresAt,
  isExpired,
  claims,
  isSaving,
  saveError,
  saved,
  storachaCid,
  verifyStep,
  verifyError,
  verifyTxHash,
  deployTxHash,
  contractAddress,
  selectedChain,
  onSelectChain,
  onVerify,
  onResetVerify,
  onSave,
  onOpenShare,
}: {
  isAnonymous: boolean;
  subjectDisplay?: string;
  subjectDisplayMode?: 'hashed' | 'plaintext';
  displayExpiresAt?: string | null;
  isExpired: boolean;
  claims: Claim[];
  isSaving: boolean;
  saveError: string | null;
  saved: boolean;
  storachaCid: string | null;
  verifyStep: 'idle' | 'calldata' | 'deploying' | 'verifying' | 'done' | 'error';
  verifyError: string | null;
  verifyTxHash: string | null;
  deployTxHash: string | null;
  contractAddress: string | null;
  selectedChain: 'starknet' | 'ethereum' | 'base' | 'arbitrum';
  onSelectChain: (chain: 'starknet' | 'ethereum' | 'base' | 'arbitrum') => void;
  onVerify: () => void;
  onResetVerify: () => void;
  onSave: () => void;
  onOpenShare?: () => void;
}) {
  const chainOptions: Array<{
    key: 'starknet' | 'ethereum' | 'base' | 'arbitrum';
    label: string;
    status: 'enabled' | 'coming-soon';
    hint: string;
  }> = [
    {
      key: 'starknet',
      label: 'Starknet',
      status: 'enabled',
      hint: 'Active',
    },
    {
      key: 'ethereum',
      label: 'Ethereum',
      status: 'coming-soon',
      hint: 'Listed for the cross-chain rollout',
    },
    {
      key: 'base',
      label: 'Base',
      status: 'coming-soon',
      hint: 'Listed for the cross-chain rollout',
    },
    {
      key: 'arbitrum',
      label: 'Arbitrum',
      status: 'coming-soon',
      hint: 'Listed for the cross-chain rollout',
    },
  ];
  const enabledChain = chainOptions.find((option) => option.status === 'enabled');
  const upcomingChains = chainOptions.filter((option) => option.status === 'coming-soon');

  return (
    <>
      <div className="border-b border-stone-100 px-6 py-5 sm:px-8">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          Proof details
        </h2>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {isAnonymous ? (
                <Shield className="h-4 w-4 text-emerald-600" />
              ) : (
                <LockKeyhole className="h-4 w-4 text-amber-600" />
              )}
              <span className="text-xs text-stone-500">Identity mode</span>
            </div>
            <span className="text-sm font-semibold text-teal-950">
              {isAnonymous ? 'Anonymous' : 'Subject-bound'}
            </span>
          </div>

          {!isAnonymous && subjectDisplay && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-amber-700/80">
                  {subjectDisplayMode === 'hashed' ? 'Subject (hashed)' : 'Subject'}
                </span>
                <CopyBtn text={subjectDisplay} />
              </div>
              <p
                className="font-mono text-sm font-semibold text-amber-800 break-all"
                title={subjectDisplay}
              >
                {subjectDisplayMode === 'hashed' ? compactValue(subjectDisplay, 14, 12) : subjectDisplay}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Clock3 className="h-4 w-4 text-stone-500" />
              <span className="text-xs text-stone-500">Expiry</span>
            </div>
            <span className={`text-sm font-semibold ${isExpired ? 'text-red-700' : 'text-teal-950'}`}>
              {displayExpiresAt
                ? new Date(displayExpiresAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No expiry'}
            </span>
          </div>

          {claims.slice(1).map((claim) => (
            <div
              key={claim.label}
              className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3"
            >
              <span className="text-xs text-stone-500">{claim.label}</span>
              <span className="font-mono text-xs text-stone-700">{claim.value}</span>
            </div>
          ))}

          {onOpenShare && saved && storachaCid && (
            <button
              type="button"
              onClick={onOpenShare}
              className="w-full rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100"
            >
              Share proof
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-stone-100 px-6 py-5 sm:px-8">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          Verification chain
        </h2>


        {enabledChain && (
          <button
            type="button"
            onClick={() => onSelectChain(enabledChain.key)}
            className={`mb-4 w-full rounded-3xl border p-5 text-left transition-all ${
              selectedChain === enabledChain.key
                ? 'border-violet-300 bg-violet-50 shadow-sm'
                : 'border-stone-200 bg-white hover:border-violet-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                    <Globe2 className="h-4.5 w-4.5 text-violet-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-teal-950">{enabledChain.label}</p>
                    <p className="text-[11px] text-stone-500">{enabledChain.hint}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-stone-600">
                  zkly deploys the verifier and submits the proof through the backend relayer, so
                  the holder does not need a second wallet.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {selectedChain === enabledChain.key && (
                  <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[10px] font-medium text-violet-700">
                    Selected
                  </span>
                )}
              </div>
            </div>
          </button>
        )}

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-[11px] font-medium text-stone-500">Coming next</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {upcomingChains.map((option) => (
              <div
                key={option.key}
                className="rounded-2xl border border-stone-200 bg-white px-3 py-3 opacity-75"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-teal-950">{option.label}</span>
                  <span className="rounded-full border border-stone-200 px-2 py-0.5 text-[10px] text-stone-500">
                    Soon
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-stone-500">{option.hint}</p>
              </div>
            ))}
          </div>
        </div>

        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
         Save and verify
        </h2>

        <div className="space-y-2.5">
          <PipelineStep
            active={isSaving}
            done={saved}
            error={!!saveError}
            title={
              isSaving
                ? 'Saving to Storacha'
                : storachaCid
                  ? 'Saved to Storacha'
                  : 'Save to Storacha'
            }
            subtitle={
              saved && storachaCid ? (
                <span className="flex items-center gap-1.5">
                  <a
                    href={`https://storacha.link/ipfs/${storachaCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-teal-600 transition-colors hover:text-teal-500"
                  >
                    {storachaCid.slice(0, 20)}... open
                  </a>
                  <CopyBtn text={storachaCid} />
                </span>
              ) : saveError ? (
                <span className="text-[10px] text-red-700">{saveError}</span>
              ) : (
                <span className="text-[10px] text-stone-500">
                  Click save when you want to keep this proof as a Storacha file.
                </span>
              )
            }
            action={
              !saved && !isSaving ? (
                <button
                  onClick={onSave}
                  className={`shrink-0 rounded-2xl px-3 py-1.5 text-[10px] font-medium transition-colors ${
                    saveError
                      ? 'border border-red-200 bg-white text-red-700 hover:bg-red-50'
                      : 'border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}
                >
                  {saveError ? 'Retry save' : 'Save to Storacha'}
                </button>
              ) : undefined
            }
          />

          <PipelineStep
            active={verifyStep === 'deploying' || verifyStep === 'verifying'}
            done={verifyStep === 'done'}
            error={verifyStep === 'error'}
            disabled={!saved}
            title={
              verifyStep === 'done'
                ? 'Verified on Starknet'
                : verifyStep === 'deploying'
                  ? 'Deploying verifier contract'
                  : verifyStep === 'verifying'
                    ? 'Submitting Starknet verification'
                    : verifyStep === 'error'
                      ? 'Verification failed'
                      : 'Ready to deploy and verify'
            }
            subtitle={
              verifyStep === 'done' ? (
                <div className="flex flex-col gap-1">
                  {verifyTxHash && (
                    <a
                      href={getVoyagerTxUrl(verifyTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-violet-600 transition-colors hover:text-violet-500"
                    >
                      Tx: {verifyTxHash.slice(0, 12)}...{verifyTxHash.slice(-6)}
                    </a>
                  )}
                  {contractAddress && (
                    <a
                      href={getVoyagerContractUrl(contractAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-violet-600 transition-colors hover:text-violet-500"
                    >
                      Contract: {contractAddress.slice(0, 12)}...{contractAddress.slice(-6)}
                    </a>
                  )}
                </div>
              ) : verifyStep === 'deploying' || verifyStep === 'verifying' ? (
                <div className="flex flex-col gap-1">
                  {deployTxHash && (
                    <a
                      href={getVoyagerTxUrl(deployTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-violet-600/80 transition-colors hover:text-violet-500"
                    >
                      Deployment: {deployTxHash.slice(0, 12)}...
                    </a>
                  )}
                </div>
              ) : verifyStep === 'error' ? (
                <span className="text-[10px] text-red-700">{verifyError}</span>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-stone-500">
                    Save the proof bundle first, then deploy to the selected chain.
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Selected target: {selectedChain === 'starknet' ? 'Starknet' : selectedChain}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    After verification, zkly updates the Storacha file with the chain record, so
                    you will see one more BTC signature prompt.
                  </span>
                </div>
              )
            }
            action={
              saved && verifyStep === 'idle' ? (
                <button
                  onClick={onVerify}
                  disabled={selectedChain !== 'starknet'}
                  className="shrink-0 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Deploy And Verify
                </button>
              ) : verifyStep === 'error' ? (
                <button
                  onClick={onResetVerify}
                  className="shrink-0 rounded-2xl border border-stone-300 px-3 py-1.5 text-[10px] text-stone-600 transition-colors hover:text-teal-900"
                >
                  Retry
                </button>
              ) : undefined
            }
          />
        </div>
      </div>
    </>
  );
}

export function PublicModePanel({
  credentialType,
  publicSignals,
  isAnonymous,
  isVerified,
  isExpired,
  subjectDisplay,
  subjectDisplayMode,
  displayExpiresAt,
  publicMeta,
  urlId,
}: {
  credentialType: string;
  publicSignals: string[];
  isAnonymous: boolean;
  isVerified: boolean;
  isExpired: boolean;
  subjectDisplay?: string;
  subjectDisplayMode?: 'hashed' | 'plaintext';
  displayExpiresAt?: string | null;
  publicMeta: {
    createdAt?: string;
    sourceApi?: string;
    snapshotTimestamp?: string;
    verificationNetwork?: string;
    starknetTxHash?: string;
  };
  urlId: string;
}) {
  return (
    <>
      <div className="border-b border-stone-100 px-6 py-4 sm:px-8">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            {isVerified ? (
              <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="mx-auto mb-1 h-5 w-5 text-stone-300" />
            )}
            <p className={`text-[11px] font-medium ${isVerified ? 'text-emerald-700' : 'text-stone-400'}`}>
              {isVerified ? 'Verified' : 'File only'}
            </p>
          </div>
          <div className="text-center">
            {isAnonymous ? (
              <Shield className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
            ) : (
              <LockKeyhole className="mx-auto mb-1 h-5 w-5 text-amber-600" />
            )}
            <p className={`text-[11px] font-medium ${isAnonymous ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isAnonymous ? 'Anonymous' : 'Subject-bound'}
            </p>
          </div>
          <div className="text-center">
            {isExpired ? (
              <Clock3 className="mx-auto mb-1 h-5 w-5 text-red-500" />
            ) : (
              <BadgeCheck className="mx-auto mb-1 h-5 w-5 text-teal-700" />
            )}
            <p className={`text-[11px] font-medium ${isExpired ? 'text-red-700' : 'text-teal-700'}`}>
              {displayExpiresAt
                ? `Until ${new Date(displayExpiresAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}`
                : 'No expiry'}
            </p>
          </div>
        </div>

        {!isAnonymous && subjectDisplay && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="text-[11px] text-amber-700/75">Prover:</span>
            <span
              className="flex-1 truncate font-mono text-xs font-medium text-amber-800"
              title={subjectDisplay}
            >
              {subjectDisplayMode === 'hashed' ? compactValue(subjectDisplay, 12, 10) : compactValue(subjectDisplay, 18, 10)}
            </span>
            <CopyBtn text={subjectDisplay} />
          </div>
        )}
      </div>

      <div className="border-b border-stone-100 px-6 py-4 sm:px-8 space-y-2">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-stone-400" />
            <p className="text-xs font-medium text-stone-600">Proof file and verification</p>
          </div>
          <div className="space-y-2.5">
            <div className="rounded-2xl border border-stone-100 bg-white p-3">
              <p className={`text-[11px] font-medium ${publicMeta.starknetTxHash ? 'text-emerald-700' : 'text-stone-500'}`}>
                {publicMeta.starknetTxHash ? 'Verified on Starknet' : 'Saved on Storacha'}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-stone-400">
                {publicMeta.starknetTxHash
                  ? 'This proof file was accepted by zkly and recorded through the Starknet verifier.'
                  : 'This proof file is stored on Storacha and can be inspected or shared even before Starknet verification happens.'}
              </p>
            </div>

            <InfoRow
              label="Storacha file"
              value={urlId}
              mono
              href={`https://storacha.link/ipfs/${urlId}`}
            />
            {publicMeta.sourceApi && <InfoRow label="Data source" value={publicMeta.sourceApi} />}
            {publicMeta.snapshotTimestamp && (
              <InfoRow
                label="Snapshot time"
                value={new Date(Number(publicMeta.snapshotTimestamp) * 1000).toLocaleString('en-US')}
              />
            )}
            {publicMeta.verificationNetwork && (
              <InfoRow label="Can be verified on" value={publicMeta.verificationNetwork} />
            )}
          </div>
                      {publicMeta.starknetTxHash && (
              <InfoRow
                label="Tx hash"
                value={publicMeta.starknetTxHash}
                mono
                href={getVoyagerTxUrl(publicMeta.starknetTxHash)}
              />
            )}
        </div>

        {publicSignals.length > 0 && (
          <details className="group overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-xs font-medium text-stone-600 transition-colors hover:text-teal-900">
              <Database className="h-3.5 w-3.5 text-stone-400" />
              Public signals ({publicSignals.length})
            </summary>
            <div className="px-4 pb-4">
              <p className="mb-2.5 text-[10px] leading-relaxed text-stone-400">
                These are the visible outputs and public inputs. Hidden wallet data stays outside the proof.
              </p>
              <div className="space-y-1.5">
                {publicSignals.map((signal, index) => {
                  const signalMeta = getSignalExplanation(
                    index,
                    credentialType,
                    isAnonymous,
                    subjectDisplayMode,
                  );

                  return (
                    <div key={index} className="rounded-2xl border border-stone-100 bg-white p-3">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-stone-500">
                          <span className="mr-1 font-mono text-stone-400">[{index}]</span>
                          {signalMeta.label}
                        </span>
                        <CopyBtn text={signal} />
                      </div>
                      <p className="break-all font-mono text-[11px] text-stone-600">{signal}</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-stone-400">
                        {signalMeta.explain}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </details>
        )}
      </div>
    </>
  );
}

export function TechnicalDetailsPanel({
  isResultMode,
  identityCommitment,
  subjectCommitment,
  subjectDisplay,
  subjectDisplayMode,
  displayCircuitHash,
  publicSignals,
  proof,
}: {
  isResultMode: boolean;
  identityCommitment: string;
  subjectCommitment: string;
  subjectDisplay?: string;
  subjectDisplayMode?: 'hashed' | 'plaintext';
  displayCircuitHash: string;
  publicSignals: string[];
  proof?: string;
}) {
  return (
    <div className="px-6 py-5 sm:px-8">
      <details className="group">
        <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-600">
          Technical details
        </summary>

        <div className="mt-3 space-y-2">
          {isResultMode && identityCommitment && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] text-stone-400">Identity commitment</p>
                <CopyBtn text={identityCommitment} />
              </div>
              <p className="break-all font-mono text-xs text-stone-600">{identityCommitment}</p>
            </div>
          )}

          {isResultMode && subjectCommitment !== '0' && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] text-stone-400">
                  Subject commitment ({subjectDisplayMode === 'hashed' ? 'hash' : 'plaintext'})
                </p>
                <CopyBtn text={subjectCommitment} />
              </div>
              <p className="break-all font-mono text-xs text-stone-600">{subjectCommitment}</p>
            </div>
          )}

          {subjectCommitment !== '0' && subjectDisplay && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] text-stone-400">
                  {subjectDisplayMode === 'hashed' ? 'Subject shown in this proof (hashed)' : 'Subject shown in this proof'}
                </p>
                <CopyBtn text={subjectDisplay} />
              </div>
              <p className="break-all font-mono text-xs text-stone-600">{subjectDisplay}</p>
            </div>
          )}

          {displayCircuitHash && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] text-stone-400">Circuit hash</p>
                <CopyBtn text={displayCircuitHash} />
              </div>
              <p className="break-all font-mono text-xs text-stone-600">{displayCircuitHash}</p>
            </div>
          )}

          {isResultMode && publicSignals.length > 0 && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] text-stone-400">Public signals</p>
                <CopyBtn text={JSON.stringify(publicSignals)} />
              </div>
              <div className="space-y-0.5">
                {publicSignals.map((signal, index) => (
                  <p key={index} className="break-all font-mono text-[11px] text-stone-500">
                    <span className="text-stone-400">[{index}]</span> {signal}
                  </p>
                ))}
              </div>
            </div>
          )}

          {isResultMode && proof && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] text-stone-400">Groth16 proof</p>
                <CopyBtn text={proof} />
              </div>
              <p className="break-all font-mono text-[11px] text-stone-500">
                {proof.slice(0, 200)}...
              </p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
