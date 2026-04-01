import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import QRCodeModal from '../components/QRCodeModal';
import { registerProof, setupCircuit } from '../api/xerostark';
import { CIRCUITS, type CredentialType } from '../circuits';
import { useBtcWallet } from '../contexts/BtcWalletContext';
import {
  saveCredentialLocal,
  getCredentialLocal,
  updateStarknetInfo,
  updateStorachaCid,
  type StoredCredential,
} from '../utils/credentialStore';
import {
  uploadToStoracha,
} from '../services/storachaUpload';
import { verifyOnStarknet } from '../services/starknetVerifier';
import { cacheCircuitHash, getCachedCircuitHash } from '../api/circuitHashes';
import { CREDENTIAL_META, interpretSignals } from '../utils/signalInterpreter';
import { buildCredentialMetadata, type IpfsMetadata, type ResultState } from '../types/proof';
import {
  resolveSubjectCommitment,
  resolveSubjectDisplay,
  resolveSubjectDisplayMode,
} from '../utils/subjectIdentity';
import {
  ProofHero,
  PublicModePanel,
  ResultModePanel,
  TechnicalDetailsPanel,
} from '../features/proof/ModeViews';

type DeploymentChain = 'starknet' | 'ethereum' | 'base' | 'arbitrum';

function mapStoredCredentialToResultState(credential: StoredCredential): ResultState {
  return {
    proof: credential.proof || '',
    publicSignals: credential.publicSignals,
    circuitHash: credential.circuitHash,
    ownerWalletAddress: credential.ownerWalletAddress,
    storachaStorageMode: credential.storachaStorageMode,
    classHash: credential.classHash,
    credentialType: credential.credentialType,
    credentialName: credential.credentialName,
    verificationNetwork: credential.starknetTxHash ? 'starknet' : undefined,
    starknetTxHash: credential.starknetTxHash,
    starknetContractAddress: credential.starknetContractAddress,
    expiresAt: credential.expiresAt,
    subjectCommitment: credential.subjectCommitment,
    subjectDisplay: credential.subjectDisplay,
    subjectDisplayMode: credential.subjectDisplayMode,
    existingCredentialId: credential.id,
    existingStorachaCid: credential.storachaCid,
  };
}

export default function Proof() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: urlId } = useParams<{ id?: string }>();
  const { btcAddress, signMessage } = useBtcWallet();

  const draftState = location.state as ResultState | null;
  const isOwnedRoute = location.pathname.startsWith('/proofs/');
  const isDraftMode = !!draftState && !urlId;
  const storedCredential = useMemo(
    () => (!isDraftMode && isOwnedRoute && urlId ? getCredentialLocal(urlId) : null),
    [isDraftMode, isOwnedRoute, urlId],
  );
  const ownedState = useMemo(
    () => (storedCredential ? mapStoredCredentialToResultState(storedCredential) : null),
    [storedCredential],
  );
  const activeState = draftState ?? ownedState;
  const isManageMode = !!activeState;

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [localCredentialId, setLocalCredentialId] = useState<string | null>(null);
  const [storachaCid, setStorachaCid] = useState<string | null>(null);

  const [verifyStep, setVerifyStep] = useState<
    'idle' | 'calldata' | 'deploying' | 'verifying' | 'done' | 'error'
  >('idle');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);
  const [verifyTxHash, setVerifyTxHash] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [publicMeta, setPublicMeta] = useState<IpfsMetadata | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [selectedChain, setSelectedChain] = useState<DeploymentChain>('starknet');

  useEffect(() => {
    if (!storedCredential) return;

    setLocalCredentialId(storedCredential.id);
    setStorachaCid(storedCredential.storachaCid || null);
    setSaved(Boolean(storedCredential.storachaCid || storedCredential.starknetTxHash));
    setVerifyError(null);
    setDeployTxHash(null);

    if (storedCredential.starknetTxHash) {
      setVerifyTxHash(storedCredential.starknetTxHash);
      setContractAddress(storedCredential.starknetContractAddress || null);
      setVerifyStep('done');
    } else {
      setVerifyTxHash(null);
      setContractAddress(null);
      setVerifyStep('idle');
    }
  }, [storedCredential]);

  const persistDraftToStoracha = useCallback(async () => {
    if (!draftState) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const ownerWalletAddress = draftState.ownerWalletAddress || btcAddress;
      if (!ownerWalletAddress) {
        throw new Error('Reconnect your BTC wallet before saving this proof to Storacha.');
      }

      const cid = await uploadToStoracha(buildCredentialMetadata(draftState), ownerWalletAddress, {
        signMessage,
      });
      const identityCommitment = draftState.publicSignals[0] || '0';
      const subjectCommitment =
        resolveSubjectCommitment(draftState) ?? draftState.publicSignals[3] ?? '0';

      const localId = saveCredentialLocal({
        ownerWalletAddress,
        storachaStorageMode: 'app-owned',
        credentialType: draftState.credentialType,
        credentialName: draftState.credentialName,
        circuitHash: draftState.circuitHash,
        classHash: draftState.classHash,
        publicSignals: draftState.publicSignals,
        proof: draftState.proof,
        identityCommitment,
        subjectCommitment: subjectCommitment !== '0' ? subjectCommitment : undefined,
        subjectDisplay: resolveSubjectDisplay(draftState),
        subjectDisplayMode: resolveSubjectDisplayMode(draftState),
        expiresAt: draftState.expiresAt,
        storachaCid: cid,
      });

      setLocalCredentialId(localId);
      setStorachaCid(cid);
      setSaved(true);
      navigate(`/proofs/${localId}`, { replace: true });
    } catch (persistError) {
      setSaved(false);
      setSaveError(
        persistError instanceof Error
          ? `${persistError.message} This proof was discarded because it did not reach Storacha.`
          : 'Storacha upload failed. This proof was discarded because it did not reach Storacha.',
      );
    } finally {
      setIsSaving(false);
    }
  }, [btcAddress, draftState, navigate, signMessage]);

  const handleVerifyOnStarknet = useCallback(async () => {
    if (!activeState) return;

    setVerifyError(null);
    setVerifyStep('verifying');

    try {
      let recoveredContractAddress: string | undefined;
      let resolvedClassHash =
        activeState.classHash ||
        (await getCachedCircuitHash(activeState.credentialType))?.class_hash;

      if (!resolvedClassHash) {
        const circuitSource = await CIRCUITS[activeState.credentialType as CredentialType].circuit();
        const setupResult = await setupCircuit(circuitSource);

        if (setupResult.circuit_hash !== activeState.circuitHash) {
          throw new Error(
            'This proof was created with an older circuit version. Please generate the proof again before verifying on Starknet.',
          );
        }

        resolvedClassHash = setupResult.class_hash || undefined;
        recoveredContractAddress = setupResult.deployed_address || undefined;

        if (!resolvedClassHash && !recoveredContractAddress) {
          throw new Error('Could not recover a verifier for this proof.');
        }

        cacheCircuitHash(activeState.credentialType, setupResult.circuit_hash, resolvedClassHash).catch(
          () => {},
        );
      }

      const result = await verifyOnStarknet(
        activeState.credentialType,
        activeState.circuitHash,
        resolvedClassHash,
        recoveredContractAddress,
        activeState.proof,
        activeState.publicSignals,
      );

      setVerifyTxHash(result.txHash);
      setContractAddress(result.contractAddress);
      if (result.deployTxHash) setDeployTxHash(result.deployTxHash);
      setVerifyStep('done');

      if (localCredentialId) {
        updateStarknetInfo(localCredentialId, result.txHash, result.contractAddress);
      }

      registerProof({
        circuit_hash: activeState.circuitHash,
        proof: activeState.proof,
        public_signals: JSON.stringify(activeState.publicSignals),
        tx_hash: result.txHash,
      }).catch(() => {});

      if (storachaCid) {
        try {
          const ownerWalletAddress = activeState.ownerWalletAddress || btcAddress;
          if (!ownerWalletAddress) {
            throw new Error('Reconnect your BTC wallet before updating the Storacha file.');
          }
          const newCid = await uploadToStoracha(
            buildCredentialMetadata(activeState, result.txHash, result.contractAddress),
            ownerWalletAddress,
            {
              signMessage,
              previousCid: storachaCid,
            },
          );
          setStorachaCid(newCid);
          if (localCredentialId) {
            updateStorachaCid(localCredentialId, newCid);
          }
        } catch {
          console.warn('[Proof] Failed to update Storacha metadata after Starknet verification.');
        }
      }
    } catch (verificationError) {
      setVerifyError(
        verificationError instanceof Error ? verificationError.message : 'Verification failed',
      );
      setVerifyStep('error');
    }
  }, [activeState, btcAddress, localCredentialId, signMessage, storachaCid]);

  useEffect(() => {
    if (isManageMode || !urlId) return;

    const cid = urlId.trim();
    if (!cid || cid.length < 10) {
      setPublicError('Invalid credential ID.');
      return;
    }

    setPublicLoading(true);
    fetch(`https://storacha.link/ipfs/${cid}`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch from IPFS');
        return response.json();
      })
      .then((data) => setPublicMeta(data as IpfsMetadata))
      .catch((loadError) =>
        setPublicError(loadError instanceof Error ? loadError.message : 'Failed to load proof'),
      )
      .finally(() => setPublicLoading(false));
  }, [isManageMode, urlId]);

  if (isOwnedRoute && !storedCredential && !isDraftMode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-base font-semibold text-teal-950">Proof not found</h2>
          <p className="mt-2 text-sm text-stone-500">
            This proof is no longer available in your saved proof library.
          </p>
          <button
            onClick={() => navigate('/proofs')}
            className="mt-4 text-sm font-medium text-teal-700 transition-colors hover:text-teal-600"
          >
            Back to proofs
          </button>
        </div>
      </div>
    );
  }

  if (!isManageMode && publicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />
          <p className="text-sm text-stone-500">Loading from Storacha...</p>
        </div>
      </div>
    );
  }

  if (!isManageMode && (publicError || (!publicMeta && urlId))) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-base font-semibold text-teal-950">Credential not found</h2>
          <p className="mt-2 text-sm text-stone-500">
            {publicError || 'Could not load this credential from Storacha.'}
          </p>
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

  if (!isManageMode && !urlId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-base font-semibold text-teal-950">No proof data</h2>
          <p className="mt-2 text-sm text-stone-500">
            This page is reached after generating a proof or opening a Storacha CID.
          </p>
        </div>
      </div>
    );
  }

  const credentialType = isManageMode ? activeState!.credentialType : publicMeta?.type || '';
  const credentialMeta = CREDENTIAL_META[credentialType];
  const credentialName = isManageMode
    ? activeState!.credentialName
    : credentialMeta?.name || credentialType;
  const publicSignals = isManageMode ? activeState!.publicSignals : publicMeta?.publicSignals || [];
  const claims = interpretSignals(credentialType, publicSignals);
  const mainClaim = claims[0];
  const displayCircuitHash = isManageMode
    ? activeState!.circuitHash
    : publicMeta?.circuitHash || '';
  const identityCommitment = publicSignals[0] || '';
  const subjectCommitment =
    (isManageMode
      ? resolveSubjectCommitment(activeState!)
      : resolveSubjectCommitment(publicMeta || {})) ??
    publicSignals[3] ??
    '0';
  const subjectDisplay = isManageMode
    ? resolveSubjectDisplay(activeState!)
    : resolveSubjectDisplay(publicMeta || {});
  const subjectDisplayMode = isManageMode
    ? resolveSubjectDisplayMode(activeState!)
    : resolveSubjectDisplayMode(publicMeta || {});
  const displayExpiresAt = isManageMode ? activeState?.expiresAt : publicMeta?.expiresAt;
  const isExpired = displayExpiresAt ? new Date(displayExpiresAt) < new Date() : false;
  const isAnonymous = subjectCommitment === '0' || !subjectCommitment;
  const isVerified =
    verifyStep === 'done' || (!isManageMode && !!publicMeta?.starknetTxHash);
  const shareId = storachaCid || (!isManageMode ? urlId || null : null);
  const createdAt = storedCredential?.createdAt || publicMeta?.createdAt;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => (isManageMode ? navigate('/proofs') : navigate(-1))}
            className="text-xs text-stone-500 transition-colors hover:text-teal-900"
          >
            {isManageMode ? 'Back to proofs' : 'Go back'}
          </button>

          <div className="flex gap-2">

            {isManageMode && shareId && (
              <button
                onClick={() => setShowQR(true)}
                className="rounded-2xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
              >
                Share proof
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
          <ProofHero
            icon={credentialMeta?.icon}
            iconColor={credentialMeta?.color}
            name={credentialName}
            mainClaim={mainClaim}
            isVerified={isVerified}
            isExpired={isExpired}
            saved={saved}
            isResultMode={isManageMode}
            createdAt={createdAt}
            credentialType={credentialType}
          />

          {isManageMode ? (
            <ResultModePanel
              isAnonymous={isAnonymous}
              subjectDisplay={subjectDisplay}
              subjectDisplayMode={subjectDisplayMode}
              displayExpiresAt={displayExpiresAt}
              isExpired={isExpired}
              claims={claims}
              isSaving={isSaving}
              saveError={saveError}
              saved={saved}
              storachaCid={storachaCid}
              verifyStep={verifyStep}
              verifyError={verifyError}
              verifyTxHash={verifyTxHash}
              deployTxHash={deployTxHash}
              contractAddress={contractAddress}
              selectedChain={selectedChain}
              onSelectChain={setSelectedChain}
              onVerify={() => {
                if (selectedChain !== 'starknet') return;
                handleVerifyOnStarknet().catch(() => {});
              }}
              onResetVerify={() => {
                setVerifyStep('idle');
                setVerifyError(null);
              }}
              onSave={() => {
                persistDraftToStoracha().catch(() => {});
              }}
              onOpenShare={() => setShowQR(true)}
            />
          ) : (
            publicMeta &&
            urlId && (
              <PublicModePanel
                credentialType={credentialType}
                publicSignals={publicSignals}
                isAnonymous={isAnonymous}
                isVerified={isVerified}
                isExpired={isExpired}
                subjectDisplay={subjectDisplay}
                subjectDisplayMode={subjectDisplayMode}
                displayExpiresAt={displayExpiresAt}
                publicMeta={publicMeta}
                urlId={urlId}
              />
            )
          )}

          <TechnicalDetailsPanel
            isResultMode={isManageMode}
            identityCommitment={identityCommitment}
            subjectCommitment={subjectCommitment}
            subjectDisplay={subjectDisplay}
            subjectDisplayMode={subjectDisplayMode}
            displayCircuitHash={displayCircuitHash}
            publicSignals={publicSignals}
            proof={isManageMode ? activeState?.proof : undefined}
          />


        </div>
      </div>

      {showQR && shareId && (
        <QRCodeModal
          proofId={shareId}
          credentialType={credentialType}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
