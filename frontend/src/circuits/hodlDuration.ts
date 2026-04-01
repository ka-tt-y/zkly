export const HODL_DURATION_CIRCUIT = `pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template HodlDurationProof() {
    // ─── Private inputs ─────────────────────────────────────────────────
    signal input balance;                    // current balance (satoshis)
    signal input totalReceived;              // total sats ever received
    signal input txCount;                    // total tx count
    signal input walletAgeMonths;            // months since first seen receiving
    signal input unspentOutputCount;         // number of live UTXOs
    signal input snapshotTimestamp;          // snapshot timestamp
    signal input identitySecret;
    signal input salt;

    // ─── Public inputs ──────────────────────────────────────────────────
    signal input minMonths;                  // minimum hodl duration in months
    signal input snapshotCommitment;
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

    // 2. Range check: walletAgeMonths >= minMonths
    component gte = GreaterEqThan(32);
    gte.in[0] <== walletAgeMonths;
    gte.in[1] <== minMonths;
    gte.out === 1;

    // 3. Identity binding
    component commitment = Poseidon(4);
    commitment.inputs[0] <== identitySecret;
    commitment.inputs[1] <== walletAgeMonths;
    commitment.inputs[2] <== salt;
    commitment.inputs[3] <== subjectIdentifier;
    identityCommitment <== commitment.out;
}

component main {public [minMonths, snapshotCommitment, subjectIdentifier]} = HodlDurationProof();
`;

export const HODL_DURATION_INFO = {
  name: 'Hodl Duration',
  description:
    'Prove your Bitcoin history reaches a minimum age in months without revealing your address. The duration signal is tied to one hidden Blockstream snapshot today, with stronger attestation planned for a later phase.',
  icon: '⏳',
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
  publicInputs: ['minMonths', 'snapshotCommitment', 'subjectIdentifier'],
};
