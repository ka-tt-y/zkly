export const REPUTATION_SCORE_CREDENTIAL_CIRCUIT = `pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

// ─── Normalize: min(x * 100 / cap, 100) ────────────────────────────────
// Computes a score 0–100 for one dimension, capped at 100.
template Normalize(cap) {
    signal input value;
    signal output score;

    signal scaled;
    scaled <== value * 100;

    // Division by constant cap (integer division)
    signal quotient;
    quotient <-- scaled \\ cap;

    // Verify quotient * cap <= scaled < (quotient+1) * cap
    signal lower;
    lower <== quotient * cap;
    component lte = LessEqThan(64);
    lte.in[0] <== lower;
    lte.in[1] <== scaled;
    lte.out === 1;

    signal upper;
    upper <== lower + cap;
    component lt = LessThan(64);
    lt.in[0] <== scaled;
    lt.in[1] <== upper;
    lt.out === 1;

    // Cap at 100.
    // Use 64 bits here because some real wallets can have very large
    // tx counts / received volume, and we still want to cap cleanly
    // instead of failing witness generation before the cap applies.
    component capCheck = LessThan(64);
    capCheck.in[0] <== quotient;
    capCheck.in[1] <== 101;

    // If quotient < 101, use quotient; else 100
    // Since quotient is always non-negative and capped by cap logic
    score <== capCheck.out * quotient + (1 - capCheck.out) * 100;
}

template BtcReputationScoreProof() {
    // ─── Private inputs ─────────────────────────────────────────────────
    signal input balance;                    // current balance
    signal input totalReceived;              // total BTC received (satoshis)
    signal input txCount;                    // total tx count
    signal input walletAgeMonths;            // months since first seen receiving
    signal input unspentOutputCount;         // current UTXO count
    signal input snapshotTimestamp;          // snapshot timestamp
    signal input identitySecret;
    signal input salt;

    // ─── Public inputs ──────────────────────────────────────────────────
    signal input minScore;                   // threshold (0–100)
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

    // 2. Normalize each dimension (0–100)
    //    Caps: balance = 1 BTC, received = 10 BTC, txs = 500, age = 120 months
    component balanceNorm = Normalize(100000000);
    balanceNorm.value <== balance;

    component receivedNorm = Normalize(1000000000);
    receivedNorm.value <== totalReceived;

    component txNorm = Normalize(500);
    txNorm.value <== txCount;

    component ageNorm = Normalize(120);
    ageNorm.value <== walletAgeMonths;

    // 3. Weighted composite: balance 25, received 25, tx count 20, age 30.
    signal weightedSum;
    weightedSum <== balanceNorm.score * 25
                   + receivedNorm.score * 25
                   + txNorm.score * 20
                   + ageNorm.score * 30;

    signal score;
    score <-- weightedSum \\ 100;

    // Verify division
    signal scoreLower;
    scoreLower <== score * 100;
    component scoreLte = LessEqThan(16);
    scoreLte.in[0] <== scoreLower;
    scoreLte.in[1] <== weightedSum;
    scoreLte.out === 1;

    signal scoreUpper;
    scoreUpper <== scoreLower + 100;
    component scoreLt = LessThan(16);
    scoreLt.in[0] <== weightedSum;
    scoreLt.in[1] <== scoreUpper;
    scoreLt.out === 1;

    // 4. Range check: score >= minScore
    component gte = GreaterEqThan(8);
    gte.in[0] <== score;
    gte.in[1] <== minScore;
    gte.out === 1;

    // 5. Identity binding
    component commitment = Poseidon(4);
    commitment.inputs[0] <== identitySecret;
    commitment.inputs[1] <== score;
    commitment.inputs[2] <== salt;
    commitment.inputs[3] <== subjectIdentifier;
    identityCommitment <== commitment.out;
}

component main {public [minScore, snapshotCommitment, subjectIdentifier]} = BtcReputationScoreProof();
`;

export const REPUTATION_SCORE_CREDENTIAL_INFO = {
  name: 'BTC Reputation Score',
  description:
    'Prove your Bitcoin reputation score exceeds a threshold. Score is computed in-circuit from current balance, total received volume, transaction count, and wallet age, then bound to one hidden Blockstream snapshot.',
  icon: '⭐',
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
  publicInputs: ['minScore', 'snapshotCommitment', 'subjectIdentifier'],
};
