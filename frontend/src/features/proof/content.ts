export function getProofExplanation(type: string) {
  const explanations: Record<string, { what: string; means: string; how: string }> = {
    'btc-balance': {
      what: 'This proof confirms the holder owns at least the stated amount of Bitcoin.',
      means:
        'The holder proved they meet the BTC threshold without revealing their wallet address or exact balance.',
      how:
        'The browser fetched the needed wallet metrics from Blockstream, committed them inside the circuit, and proved the balance threshold without revealing the underlying wallet data. Independent attestation is planned for the next phase.',
    },
    'hodl-duration': {
      what: 'This proof confirms the holder has kept Bitcoin for at least the stated duration.',
      means:
        'The holder proved their wallet history reaches the selected age threshold without revealing which Bitcoin address produced the signal.',
      how:
        'The browser derived the wallet-age signal from Blockstream transaction history, then the circuit proved the duration clears the selected threshold while keeping the raw wallet data private.',
    },
    'btc-reputation': {
      what: 'This proof confirms the holder meets the stated BTC reputation score.',
      means:
        'The holder proved a composite score based on Bitcoin activity exceeds the threshold without disclosing the underlying metrics.',
      how:
        'The circuit combines Blockstream-sourced balance, received volume, transaction count, and wallet age into one score and proves the result is high enough. Independent attestation comes in a later phase.',
    },
  };

  return (
    explanations[type] || {
      what: 'This is a zero-knowledge proof about the holder.',
      means: 'The claim was cryptographically verified without revealing private data.',
      how: 'A zk circuit validated the claim using hidden inputs and public signals.',
    }
  );
}

export function getSignalExplanation(
  index: number,
  credentialType: string,
  isAnonymous: boolean,
  subjectDisplayMode?: 'hashed' | 'plaintext',
) {
  const signalLabels: Record<number, { label: string; explain: string }> = {
    0: {
      label: 'Identity commitment',
      explain:
        'A stable commitment derived from the holder secret. It lets proofs be linked to the same holder without revealing who that holder is.',
    },
    1: {
      label: 'Threshold',
      explain:
        credentialType === 'btc-balance'
          ? 'Minimum BTC balance in satoshis.'
          : credentialType === 'hodl-duration'
            ? 'Minimum holding duration in months.'
            : 'Minimum reputation score.',
    },
    2: {
      label: 'Snapshot commitment',
      explain:
        'A Poseidon commitment over the hidden wallet snapshot used by the proof. It binds the circuit to one specific Blockstream-derived snapshot without revealing the underlying wallet data.',
    },
    3: {
      label: 'Subject commitment',
      explain: isAnonymous
        ? 'Set to 0 for anonymous proofs.'
        : subjectDisplayMode === 'hashed'
          ? 'Hash commitment for the subject value.'
          : 'Encoded plaintext subject value chosen by the holder.',
    },
  };

  return signalLabels[index] || {
    label: `Signal ${index}`,
    explain: 'Additional public proof data.',
  };
}
