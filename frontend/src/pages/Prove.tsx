import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBtcWallet } from '../contexts/BtcWalletContext';
import { CIRCUITS, type CredentialType } from '../circuits';
import { CREDENTIAL_META } from '../constants/credentialMeta';
import { setupCircuit, generateProof } from '../api/xerostark';
import { getCachedCircuitHash, cacheCircuitHash } from '../api/circuitHashes';
import {
  EXPIRY_OPTIONS,
  THRESHOLD_CONFIG,
  type ProveStep,
  type WizardStep,
} from '../constants/thresholdConfig';
import {
  buildBtcBalanceInputs,
  buildBtcReputationInputs,
  buildHodlDurationInputs,
} from '../utils/circuitInputs';
import {
  fetchAddressSnapshot,
  type AddressSnapshot,
} from '../services/bitcoinSnapshot';
import {
  buildSubjectBinding,
  type SubjectDisplayMode,
} from '../utils/subjectIdentity';
import {
  ExpiryStep,
  GenerateStep,
  IdentityStep,
  ReviewStep,
  ThresholdStep,
} from '../features/prove/StepViews';
import { Wallet } from 'lucide-react';

export default function Prove() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { btcAddress, btcConnected, signMessage } = useBtcWallet();

  const credentialType = type as CredentialType;
  const credentialMeta = CREDENTIAL_META[credentialType];
  const thresholdConfig = THRESHOLD_CONFIG[credentialType];

  const [wizardStep, setWizardStep] = useState<WizardStep>('threshold');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customThreshold, setCustomThreshold] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'anonymous' | 'identified'>('anonymous');
  const [subjectDisplay, setSubjectDisplay] = useState('');
  const [subjectDisplayMode, setSubjectDisplayMode] = useState<SubjectDisplayMode>('hashed');
  const [expiresAt, setExpiresAt] = useState('');
  const [expiryOption, setExpiryOption] = useState('none');

  const [step, setStep] = useState<ProveStep>('input');
  const [error, setError] = useState<string | null>(null);
  const [circuitHash, setCircuitHash] = useState<string | null>(null);
  const [snapshotInfo, setSnapshotInfo] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AddressSnapshot | null>(null);
  const [proofResult, setProofResult] = useState<{
    proof: string;
    publicSignals: string[];
    circuitHash: string;
    classHash?: string;
    subjectCommitment?: string;
    subjectDisplay?: string;
    subjectDisplayMode?: SubjectDisplayMode;
  } | null>(null);

  const walletAddress = btcAddress ?? '';

  const getThresholdValue = useCallback((): string => {
    if (selectedPreset && selectedPreset !== 'custom') return selectedPreset;
    if (!customThreshold.trim()) return thresholdConfig?.presets[0]?.value || '0';
    if (thresholdConfig?.fromDisplayValue) return thresholdConfig.fromDisplayValue(customThreshold);
    return customThreshold;
  }, [customThreshold, selectedPreset, thresholdConfig]);

  useEffect(() => {
    if (expiryOption === 'none') {
      setExpiresAt('');
      return;
    }

    if (expiryOption === 'custom') {
      return;
    }

    const days = Number.parseInt(expiryOption, 10);
    if (Number.isNaN(days)) return;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    setExpiresAt(nextDate.toISOString().split('T')[0]);
  }, [expiryOption]);

  const deriveIdentitySecret = useCallback(async () => {
    const signature = await signMessage(
      [
        'Zkly proof authorization',
        '',
        `Proof type: ${credentialMeta?.name || credentialType}`,
        'Purpose: create your private proof secret',
        '',
        'This does not move funds or create a blockchain transaction.',
        `Wallet: ${walletAddress}`,
      ].join('\n'),
    );
    const data = new TextEncoder().encode(signature);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);

    let identitySecret = 0n;
    for (let index = 0; index < 16; index += 1) {
      identitySecret = (identitySecret << 8n) | BigInt(hashArray[index]);
    }

    let salt = 0;
    for (let index = 16; index < 20; index += 1) {
      salt = (salt << 8) | hashArray[index];
    }

    return {
      identitySecret: identitySecret.toString(),
      salt: salt.toString(),
    };
  }, [credentialMeta?.name, credentialType, signMessage, walletAddress]);

  const handleGenerate = useCallback(async () => {
    if (!btcConnected || !walletAddress || !credentialMeta || !thresholdConfig) return;

    setError(null);
    setSnapshotInfo(null);
    setSnapshot(null);
    setWizardStep('generate');
    setStep('snapshot');

    try {
      const { identitySecret, salt } = await deriveIdentitySecret();
      const thresholdValue = getThresholdValue();
      const subjectBinding =
        privacyMode === 'identified' && subjectDisplay.trim()
          ? await buildSubjectBinding(subjectDisplay, subjectDisplayMode)
          : null;

      const computedValues: Record<string, string> = {
        btcAddress: walletAddress,
        identitySecret,
        salt,
        subjectIdentifier: subjectBinding?.subjectCommitment || '0',
        [thresholdConfig.field]: thresholdValue,
      };

      const nextSnapshot = await fetchAddressSnapshot(walletAddress);
      setSnapshot(nextSnapshot);

      let circuitInputs: Record<string, string>;

      if (credentialType === 'btc-balance') {
        circuitInputs = buildBtcBalanceInputs(nextSnapshot, computedValues);
        setSnapshotInfo(`${(Number(nextSnapshot.derived.balance) / 1e8).toFixed(8)} BTC`);
      } else if (credentialType === 'hodl-duration') {
        circuitInputs = buildHodlDurationInputs(nextSnapshot, computedValues);
        setSnapshotInfo(`${nextSnapshot.derived.walletAgeMonths} months`);
      } else {
        circuitInputs = buildBtcReputationInputs(nextSnapshot, computedValues);
        setSnapshotInfo(
          `${nextSnapshot.derived.txCount} txs · ${(Number(nextSnapshot.derived.totalReceived) / 1e8).toFixed(4)} BTC received`,
        );
      }

      setStep('compiling');

      let hash: string | null = null;
      let classHash: string | undefined;

      const cached = await getCachedCircuitHash(credentialType);
      if (cached) {
        hash = cached.circuit_hash;
        classHash = cached.class_hash;
      }

      if (!hash) {
        const circuitSource = await CIRCUITS[credentialType].circuit();
        const setupResult = await setupCircuit(circuitSource);
        hash = setupResult.circuit_hash;
        classHash = setupResult.class_hash || undefined;

        if (hash) {
          cacheCircuitHash(credentialType, hash, classHash).catch(() => {});
        }
      }

      if (!hash) {
        throw new Error('Failed to obtain circuit hash');
      }

      setCircuitHash(hash);
      setStep('proving');

      const proof = await generateProof({
        circuit_hash: hash,
        inputs: circuitInputs,
      });

      const publicSignals: string[] = Array.isArray(proof.public_signals)
        ? proof.public_signals
        : typeof proof.public_signals === 'string'
          ? JSON.parse(proof.public_signals)
          : [];

      setProofResult({
        proof: typeof proof.proof === 'string' ? proof.proof : JSON.stringify(proof.proof),
        publicSignals,
        circuitHash: hash,
        classHash,
        subjectCommitment: subjectBinding?.subjectCommitment,
        subjectDisplay: subjectBinding?.subjectDisplay,
        subjectDisplayMode: subjectBinding?.subjectDisplayMode,
      });
      setStep('done');
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Proof generation failed',
      );
      setStep('error');
    }
  }, [
    btcConnected,
    walletAddress,
    credentialMeta,
    thresholdConfig,
    deriveIdentitySecret,
    getThresholdValue,
    privacyMode,
    subjectDisplay,
    subjectDisplayMode,
    credentialType,
  ]);

  const handleViewProof = useCallback(() => {
    if (!proofResult || !credentialMeta) return;

    navigate('/proof', {
      state: {
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals,
        circuitHash: proofResult.circuitHash,
        classHash: proofResult.classHash,
        credentialType,
        credentialName: credentialMeta.name,
        sourceApi: snapshot?.sourceApi || 'blockstream-bitcoin-address',
        snapshotTimestamp: snapshot?.derived.snapshotTimestamp,
        verificationNetwork: 'starknet',
        ownerWalletAddress: walletAddress,
        expiresAt: expiresAt || undefined,
        subjectCommitment:
          privacyMode === 'identified'
            ? proofResult.subjectCommitment || undefined
            : undefined,
        subjectDisplay:
          privacyMode === 'identified'
            ? proofResult.subjectDisplay || undefined
            : undefined,
        subjectDisplayMode:
          privacyMode === 'identified' ? proofResult.subjectDisplayMode || subjectDisplayMode : undefined,
      },
    });
  }, [
    credentialMeta,
    credentialType,
    expiresAt,
    navigate,
    privacyMode,
    proofResult,
    snapshot,
    subjectDisplayMode,
    walletAddress,
  ]);

  const goToIdentity = () => {
    if (selectedPreset === 'custom' && !customThreshold.trim()) {
      setError('Please enter a custom value.');
      return;
    }

    if (!selectedPreset && !customThreshold.trim()) {
      setSelectedPreset(thresholdConfig.presets[0].value);
    }

    setError(null);
    setWizardStep('privacy');
  };

  const goToExpiry = () => {
    if (privacyMode === 'identified' && !subjectDisplay.trim()) {
      setError('Enter a subject value or switch back to anonymous mode.');
      return;
    }

    setError(null);
    setWizardStep('expiry');
  };

  const goToReview = () => {
    setError(null);
    setWizardStep('review');
  };

  if (!credentialMeta || !thresholdConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-teal-950">Unknown proof type</h2>
          <p className="mt-2 text-sm text-stone-500">"{type}" is not a recognized proof type.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm font-medium text-teal-700 transition-colors hover:text-teal-600"
          >
            Back home
          </button>
        </div>
      </div>
    );
  }

  if (!btcConnected || !walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
            <Wallet className="h-5 w-5 text-teal-700" />
          </div>
          <h2 className="text-lg font-semibold text-teal-950">Connect a BTC wallet</h2>
          <p className="mt-2 text-sm text-stone-500">
            zkly only needs your Bitcoin wallet to create the proof. Starknet verification is
            relayed by the backend.
          </p>
        </div>
      </div>
    );
  }

  if (wizardStep === 'threshold') {
    return (
      <ThresholdStep
        currentStep="threshold"
        onBack={() => navigate('/')}
        icon={credentialMeta.icon}
        credentialName={credentialMeta.name}
        credentialDescription={credentialMeta.description}
        thresholdConfig={thresholdConfig}
        selectedPreset={selectedPreset}
        customThreshold={customThreshold}
        walletAddress={walletAddress}
        error={error}
        onSelectPreset={(value) => {
          setSelectedPreset(value);
          if (value !== 'custom') {
            setCustomThreshold('');
          }
        }}
        onChangeCustomThreshold={setCustomThreshold}
        onContinue={goToIdentity}
      />
    );
  }

  if (wizardStep === 'privacy') {
    return (
      <IdentityStep
        currentStep="privacy"
        onBack={() => {
          setWizardStep('threshold');
          setError(null);
        }}
        privacyMode={privacyMode}
        subjectDisplay={subjectDisplay}
        subjectDisplayMode={subjectDisplayMode}
        error={error}
        onSelectPrivacyMode={(mode) => {
          setPrivacyMode(mode);
          if (mode === 'anonymous') {
            setSubjectDisplay('');
            setSubjectDisplayMode('hashed');
          }
        }}
        onChangeSubjectDisplay={setSubjectDisplay}
        onSelectSubjectDisplayMode={setSubjectDisplayMode}
        onContinue={goToExpiry}
      />
    );
  }

  if (wizardStep === 'expiry') {
    return (
      <ExpiryStep
        currentStep="expiry"
        onBack={() => {
          setWizardStep('privacy');
          setError(null);
        }}
        expiryOption={expiryOption}
        expiresAt={expiresAt}
        expiryOptions={EXPIRY_OPTIONS}
        onSelectExpiryOption={setExpiryOption}
        onChangeExpiryDate={setExpiresAt}
        onContinue={goToReview}
      />
    );
  }

  if (wizardStep === 'review') {
    return (
      <ReviewStep
        currentStep="review"
        onBack={() => {
          setWizardStep('expiry');
          setError(null);
        }}
        onEdit={() => {
          setWizardStep('threshold');
          setError(null);
        }}
        onGenerate={handleGenerate}
        credentialName={credentialMeta.name}
        thresholdDisplay={thresholdConfig.formatDisplay(getThresholdValue())}
        walletAddress={walletAddress}
        privacyMode={privacyMode}
        subjectDisplay={subjectDisplay}
        subjectDisplayMode={subjectDisplayMode}
        expiresAt={expiresAt}
      />
    );
  }

  return (
      <GenerateStep
        icon={credentialMeta.icon}
        credentialName={credentialMeta.name}
      proveStep={step}
      snapshotInfo={snapshotInfo}
      circuitHash={circuitHash}
      error={error}
      onEdit={() => {
        setWizardStep('review');
        setStep('input');
        setError(null);
      }}
      onRetry={() => {
        setStep('input');
        setError(null);
        handleGenerate().catch(() => {});
      }}
      onViewProof={handleViewProof}
    />
  );
}
