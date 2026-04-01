export const BTC_BALANCE_CIRCUIT = `pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template BtcBalanceProof() {
    // ─── Private inputs (never leave the browser) ───────────────────────
    signal input balance;                    // satoshis
    signal input totalReceived;              // total sats ever received
    signal input txCount;                    // total tx count
    signal input walletAgeMonths;            // first-seen age snapshot
    signal input unspentOutputCount;         // number of live UTXOs
    signal input snapshotTimestamp;          // proof snapshot time
    signal input identitySecret;
    signal input salt;

    // ─── Public inputs (visible on-chain) ───────────────────────────────
    signal input minBalance;                 // threshold in satoshis
    signal input snapshotCommitment;         // commitment to the hidden wallet snapshot data
    signal input subjectIdentifier;          // optional: hash of subject (0 = anonymous)

    // ─── Output ─────────────────────────────────────────────────────────
    signal output identityCommitment;

    // 1. Bind the hidden wallet metrics to one snapshot commitment.
    component snapshotCheck = Poseidon(7);
    snapshotCheck.inputs[0] <== balance;
    snapshotCheck.inputs[1] <== totalReceived;
    snapshotCheck.inputs[2] <== txCount;
    snapshotCheck.inputs[3] <== walletAgeMonths;
    snapshotCheck.inputs[4] <== unspentOutputCount;
    snapshotCheck.inputs[5] <== snapshotTimestamp;
    snapshotCheck.inputs[6] <== 4401;
    snapshotCheck.out === snapshotCommitment;

    // 2. Range check: balance >= minBalance
    component gte = GreaterEqThan(64);
    gte.in[0] <== balance;
    gte.in[1] <== minBalance;
    gte.out === 1;

    // 3. Identity binding (prevents proof transfer)
    component commitment = Poseidon(4);
    commitment.inputs[0] <== identitySecret;
    commitment.inputs[1] <== balance;
    commitment.inputs[2] <== salt;
    commitment.inputs[3] <== subjectIdentifier;
    identityCommitment <== commitment.out;
}

component main {public [minBalance, snapshotCommitment, subjectIdentifier]} = BtcBalanceProof();
`;

export const BTC_BALANCE_INFO = {
  name: 'BTC Balance',
  description:
    'Prove you hold at least a minimum amount of BTC without revealing your address or exact balance. The proof is bound to one hidden Blockstream snapshot today, with stronger attestation planned for a later phase.',
  icon: '₿',
  privateInputs: [
    'balance',
    'totalReceived',
    'txCount',
    'walletAgeMonths',
    'unspentOutputCount',
    'snapshotTimestamp',
    'identitySecret',
    'salt',
  ],
  publicInputs: ['minBalance', 'snapshotCommitment', 'subjectIdentifier'],
};
