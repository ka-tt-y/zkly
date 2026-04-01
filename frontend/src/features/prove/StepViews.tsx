import {
  BadgeCheck,
  CalendarClock,
  FileCheck2,
  Fingerprint,
  Hash,
  LoaderCircle,
  LockKeyhole,
  Shield,
  Type,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type {
  ExpiryOption,
  ProveStep,
  ThresholdConfig,
} from '../../constants/thresholdConfig';
import { PIPELINE_LABELS } from '../../constants/thresholdConfig';
import { SummaryRow } from '../../components/WizardComponents';
import { WizardFrame } from './WizardFrame';
import type { SubjectDisplayMode } from '../../utils/subjectIdentity';

function ContinueButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl bg-teal-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
    >
      {label}
    </button>
  );
}

function InlineError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-xs text-red-700">{error}</p>
    </div>
  );
}

export function ThresholdStep({
  currentStep,
  onBack,
  icon: Icon,
  credentialName,
  credentialDescription,
  thresholdConfig,
  selectedPreset,
  customThreshold,
  walletAddress,
  error,
  onSelectPreset,
  onChangeCustomThreshold,
  onContinue,
}: {
  currentStep: 'threshold';
  onBack: () => void;
  icon: LucideIcon;
  credentialName: string;
  credentialDescription: string;
  thresholdConfig: ThresholdConfig;
  selectedPreset: string | null;
  customThreshold: string;
  walletAddress: string;
  error: string | null;
  onSelectPreset: (value: string) => void;
  onChangeCustomThreshold: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <WizardFrame
      currentStep={currentStep}
      onBack={onBack}
      backLabel="Home"
      icon={Icon}
      iconBgClass="bg-teal-50"
      iconColorClass="text-teal-700"
      title={credentialName}
      description={credentialDescription}
    >
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-sm font-medium text-teal-950">
            {thresholdConfig.question}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {thresholdConfig.presets.map((preset) => {
              const active = selectedPreset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onSelectPreset(preset.value)}
                  className={`rounded-2xl border px-3 py-3.5 text-center transition-all ${
                    active
                      ? 'border-teal-300 bg-teal-50 shadow-sm'
                      : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  <div
                    className={`text-lg font-bold ${active ? 'text-teal-900' : 'text-stone-700'}`}
                  >
                    {preset.label}
                  </div>
                  <div
                    className={`mt-0.5 text-[10px] ${active ? 'text-teal-700' : 'text-stone-400'}`}
                  >
                    {preset.sublabel}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onSelectPreset('custom')}
            className={`mt-3 w-full rounded-2xl border px-4 py-3 text-left text-xs transition-all ${
              selectedPreset === 'custom'
                ? 'border-teal-300 bg-teal-50 text-teal-800'
                : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300'
            }`}
          >
            Use a custom threshold
          </button>

          {selectedPreset === 'custom' && (
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-medium text-stone-500">
                {thresholdConfig.customLabel}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={customThreshold}
                onChange={(event) => onChangeCustomThreshold(event.target.value)}
                placeholder={thresholdConfig.customPlaceholder}
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-teal-950 outline-none transition-colors focus:border-teal-500 focus:bg-white"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white">
            <Wallet className="h-4 w-4 text-teal-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wide text-stone-400">BTC wallet</p>
            <p className="truncate font-mono text-xs text-teal-900">{walletAddress}</p>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </div>

        <InlineError error={error} />

        <ContinueButton label="Continue" onClick={onContinue} />
      </div>
    </WizardFrame>
  );
}

export function IdentityStep({
  currentStep,
  onBack,
  privacyMode,
  subjectDisplay,
  subjectDisplayMode,
  error,
  onSelectPrivacyMode,
  onChangeSubjectDisplay,
  onSelectSubjectDisplayMode,
  onContinue,
}: {
  currentStep: 'privacy';
  onBack: () => void;
  privacyMode: 'anonymous' | 'identified';
  subjectDisplay: string;
  subjectDisplayMode: SubjectDisplayMode;
  error: string | null;
  onSelectPrivacyMode: (mode: 'anonymous' | 'identified') => void;
  onChangeSubjectDisplay: (value: string) => void;
  onSelectSubjectDisplayMode: (mode: SubjectDisplayMode) => void;
  onContinue: () => void;
}) {
  return (
    <WizardFrame
      currentStep={currentStep}
      onBack={onBack}
      backLabel="Back"
      icon={Fingerprint}
      iconBgClass="bg-emerald-50"
      iconColorClass="text-emerald-700"
      title="Identity Binding"
      description="Choose whether the proof stays anonymous or is tied to a subject you can later prove."
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-xs leading-relaxed text-stone-500">
            Your BTC wallet still backs the proof. This step only decides whether the proof
            should also be linked to a separate subject like an email, username, or member ID.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSelectPrivacyMode('anonymous')}
            className={`w-full rounded-2xl border p-5 text-left transition-all ${
              privacyMode === 'anonymous'
                ? 'border-emerald-200 bg-emerald-50 shadow-sm'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  privacyMode === 'anonymous' ? 'bg-emerald-100' : 'bg-white'
                }`}
              >
                <Shield
                  className={`h-4.5 w-4.5 ${
                    privacyMode === 'anonymous' ? 'text-emerald-700' : 'text-stone-500'
                  }`}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    privacyMode === 'anonymous' ? 'text-emerald-800' : 'text-stone-700'
                  }`}
                >
                  Anonymous proof
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                  Best for gating access or proving threshold eligibility without giving the
                  verifier anything extra to link back to you.
                </p>
              </div>
              {privacyMode === 'anonymous' && (
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectPrivacyMode('identified')}
            className={`w-full rounded-2xl border p-5 text-left transition-all ${
              privacyMode === 'identified'
                ? 'border-amber-200 bg-amber-50 shadow-sm'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  privacyMode === 'identified' ? 'bg-amber-100' : 'bg-white'
                }`}
              >
                <LockKeyhole
                  className={`h-4.5 w-4.5 ${
                    privacyMode === 'identified' ? 'text-amber-700' : 'text-stone-500'
                  }`}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    privacyMode === 'identified' ? 'text-amber-800' : 'text-stone-700'
                  }`}
                >
                  Subject-bound proof
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                  Use this when a verifier should be able to confirm the proof belongs to a
                  specific subject without ever seeing your BTC address.
                </p>
              </div>
              {privacyMode === 'identified' && (
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              )}
            </div>
          </button>
        </div>

        {privacyMode === 'identified' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <label className="mb-1.5 block text-xs font-medium text-amber-800">
                Subject value
              </label>
              <p className="mb-3 text-[10px] leading-relaxed text-stone-500">
                Enter the exact value a verifier will later use with this proof. Then choose
                whether zkly should save it as plain text or save only its hash.
              </p>
              <input
                type="text"
                value={subjectDisplay}
                onChange={(event) => onChangeSubjectDisplay(event.target.value)}
                placeholder="user@example.com or membership-id-42"
                className="w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-teal-950 outline-none transition-colors focus:border-teal-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelectSubjectDisplayMode('hashed')}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  subjectDisplayMode === 'hashed'
                    ? 'border-amber-200 bg-amber-50 shadow-sm'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                      subjectDisplayMode === 'hashed' ? 'bg-white' : 'bg-stone-100'
                    }`}
                  >
                    <Hash
                      className={`h-4 w-4 ${
                        subjectDisplayMode === 'hashed' ? 'text-amber-700' : 'text-stone-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-teal-950">Hash the subject</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                      zkly stores only the hash. The raw subject is not shown on the proof page
                      or saved in the Storacha file.
                    </p>
                  </div>
                  {subjectDisplayMode === 'hashed' && (
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectSubjectDisplayMode('plaintext')}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  subjectDisplayMode === 'plaintext'
                    ? 'border-teal-200 bg-teal-50 shadow-sm'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                      subjectDisplayMode === 'plaintext' ? 'bg-white' : 'bg-stone-100'
                    }`}
                  >
                    <Type
                      className={`h-4 w-4 ${
                        subjectDisplayMode === 'plaintext' ? 'text-teal-700' : 'text-stone-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-teal-950">Save plain text</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                      zkly shows the subject on the proof page and stores it in the shared file.
                      Best when the verifier should read the value directly.
                    </p>
                  </div>
                  {subjectDisplayMode === 'plaintext' && (
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        <InlineError error={error} />

        <ContinueButton label="Continue" onClick={onContinue} />
      </div>
    </WizardFrame>
  );
}

export function ExpiryStep({
  currentStep,
  onBack,
  expiryOption,
  expiresAt,
  expiryOptions,
  onSelectExpiryOption,
  onChangeExpiryDate,
  onContinue,
}: {
  currentStep: 'expiry';
  onBack: () => void;
  expiryOption: string;
  expiresAt: string;
  expiryOptions: ExpiryOption[];
  onSelectExpiryOption: (value: string) => void;
  onChangeExpiryDate: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <WizardFrame
      currentStep={currentStep}
      onBack={onBack}
      backLabel="Back"
      icon={CalendarClock}
      iconBgClass="bg-sky-50"
      iconColorClass="text-sky-700"
      title="Proof Expiry"
      description="Tell verifiers how long this credential should stay valid."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-xs leading-relaxed text-stone-500">
            Balance and reputation claims can become stale. Set an expiry when that matters,
            or leave it open-ended when the proof should stay reusable.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-teal-950">Choose a duration</p>
          <div className="grid grid-cols-3 gap-2">
            {expiryOptions.map((option) => {
              const active = expiryOption === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelectExpiryOption(option.value)}
                  className={`rounded-2xl border px-3 py-3 text-center transition-all ${
                    active
                      ? 'border-teal-300 bg-teal-50 shadow-sm'
                      : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  <div className={`text-xs font-bold ${active ? 'text-teal-900' : 'text-stone-700'}`}>
                    {option.label}
                  </div>
                  <div className={`mt-0.5 text-[10px] ${active ? 'text-teal-700' : 'text-stone-400'}`}>
                    {option.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {expiryOption === 'custom' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">
              Custom expiry date
            </label>
            <input
              type="date"
              value={expiresAt}
              min={new Date().toISOString().split('T')[0]}
              onChange={(event) => onChangeExpiryDate(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-teal-950 outline-none transition-colors focus:border-teal-500"
            />
          </div>
        )}

        <div
          className={`rounded-2xl border px-4 py-3 ${
            expiresAt
              ? 'border-amber-200 bg-amber-50'
              : 'border-stone-200 bg-stone-50'
          }`}
        >
          {expiresAt ? (
            <>
              <p className="text-xs font-medium text-amber-800">
                Expires{' '}
                {new Date(expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="mt-1 text-[10px] text-amber-700/75">Custom expiry date selected</p>
            </>
          ) : (
            <p className="text-xs text-stone-500">No expiry. This proof remains valid until you choose to replace it.</p>
          )}
        </div>

        <ContinueButton label="Continue" onClick={onContinue} />
      </div>
    </WizardFrame>
  );
}

export function ReviewStep({
  currentStep,
  onBack,
  onEdit,
  onGenerate,
  credentialName,
  thresholdDisplay,
  walletAddress,
  privacyMode,
  subjectDisplay,
  subjectDisplayMode,
  expiresAt,
}: {
  currentStep: 'review';
  onBack: () => void;
  onEdit: () => void;
  onGenerate: () => void;
  credentialName: string;
  thresholdDisplay: string;
  walletAddress: string;
  privacyMode: 'anonymous' | 'identified';
  subjectDisplay: string;
  subjectDisplayMode: SubjectDisplayMode;
  expiresAt: string;
}) {
  const shortenedAddress =
    walletAddress.length > 16
      ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
      : walletAddress;

  return (
    <WizardFrame
      currentStep={currentStep}
      onBack={onBack}
      backLabel="Back"
      icon={FileCheck2}
      iconBgClass="bg-teal-50"
      iconColorClass="text-teal-700"
      title={`${credentialName} review`}
      description="Check the configuration before your wallet signs and the proof generation starts."
    >
      <div className="space-y-5">
        <div className="space-y-2.5">
          <SummaryRow label="Threshold" value={thresholdDisplay} highlight />
          <SummaryRow label="BTC wallet" value={shortenedAddress} mono />
          <SummaryRow
            label="Identity mode"
            value={privacyMode === 'anonymous' ? 'Anonymous' : 'Subject-bound'}
          />
          {privacyMode === 'identified' && subjectDisplay && (
            <SummaryRow
              label="Subject binding"
              value={
                subjectDisplayMode === 'hashed'
                  ? 'Hash only'
                  : `Plain text: ${subjectDisplay}`
              }
            />
          )}
          <SummaryRow
            label="Expiry"
            value={
              expiresAt
                ? new Date(expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'No expiry'
            }
          />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium text-amber-800">
            Your BTC wallet will sign one message
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-amber-700/80">
            <li>A short authorization message used to derive your private proof secret.</li>
            <li>It does not move funds or submit a blockchain transaction.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-[11px] font-medium text-teal-700">Snapshot source</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-teal-700/80">
            zkly uses public Bitcoin data to prepare the proof, while keeping your address and
            detailed wallet data out of the final result.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="rounded-2xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 hover:text-teal-900"
          >
            Edit
          </button>
          <button
            onClick={onGenerate}
            className="flex-1 rounded-2xl bg-teal-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
          >
            Generate proof
          </button>
        </div>
      </div>
    </WizardFrame>
  );
}

export function GenerateStep({
  icon: Icon,
  credentialName,
  proveStep,
  snapshotInfo,
  circuitHash,
  error,
  onEdit,
  onRetry,
  onViewProof,
}: {
  icon: LucideIcon;
  credentialName: string;
  proveStep: ProveStep;
  snapshotInfo: string | null;
  circuitHash: string | null;
  error: string | null;
  onEdit: () => void;
  onRetry: () => void;
  onViewProof: () => void;
}) {
  const stepIndex = PIPELINE_LABELS.findIndex((item) => item.key === proveStep);
  const doneIndex = proveStep === 'done' ? PIPELINE_LABELS.length : stepIndex;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <WizardIndicator />

        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50">
              <Icon className="h-7 w-7 text-teal-700" />
            </div>
            <h2 className="text-lg font-semibold text-teal-950">{credentialName}</h2>
            <p className="mt-1 text-xs text-stone-500">
              {proveStep === 'done'
                ? 'Proof generated successfully'
                : proveStep === 'error'
                  ? 'Something went wrong'
                  : 'Generating your proof'}
            </p>
          </div>

          {proveStep !== 'error' && (
            <div className="mb-6 space-y-3">
              {PIPELINE_LABELS.map((item, index) => {
                const done = index < doneIndex;
                const active = index === stepIndex && proveStep !== 'done';
                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                      done
                        ? 'border-emerald-200 bg-emerald-50'
                        : active
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    {done ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                    ) : active ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full">
                        <LoaderCircle className="h-5 w-5 animate-spin text-teal-700" />
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-[10px] font-medium text-stone-400">
                        {index + 1}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          done
                            ? 'text-emerald-700'
                            : active
                              ? 'text-teal-900'
                              : 'text-stone-400'
                        }`}
                      >
                        {item.label}
                      </p>
                      {active && (
                        <p className="mt-0.5 text-[11px] text-stone-500">
                          {proveStep === 'snapshot' && 'Fetching the wallet snapshot from Blockstream and preparing private inputs'}
                          {proveStep === 'compiling' && 'Preparing the circuit through XeroStark'}
                          {proveStep === 'proving' && 'Computing the zero-knowledge proof'}
                        </p>
                      )}
                      {done && item.key === 'snapshot' && snapshotInfo && (
                        <p className="mt-0.5 text-[11px] text-emerald-700/80">
                          Snapshot ready: {snapshotInfo}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {proveStep === 'done' && (
            <button
              onClick={onViewProof}
              className="w-full rounded-2xl bg-teal-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
            >
              View proof
            </button>
          )}

          {proveStep === 'error' && error && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onEdit}
                  className="flex-1 rounded-2xl border border-stone-300 px-4 py-2.5 text-xs font-medium text-stone-600 transition-colors hover:text-teal-900"
                >
                  Edit
                </button>
                <button
                  onClick={onRetry}
                  className="flex-1 rounded-2xl bg-teal-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {circuitHash && proveStep !== 'error' && (
            <p className="mt-4 truncate px-4 text-center font-mono text-[10px] text-stone-400">
              Circuit: {circuitHash.slice(0, 24)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WizardIndicator() {
  return (
    <div className="mb-8 flex items-center justify-center">
      <div className="flex items-center gap-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-900 text-[10px] font-bold text-white">
          5
        </div>
        <span className="hidden text-[10px] font-medium text-teal-900 sm:inline">Generate</span>
      </div>
    </div>
  );
}
