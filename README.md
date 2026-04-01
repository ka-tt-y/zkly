# Zkly

**Show the proof. Hide the wallet.**

Bitcoin holders often have to choose between proving nothing and revealing far too much.

If you want to show that you hold enough BTC, that your wallet is old enough, or that your Bitcoin activity clears some reputation threshold, the usual path is messy and privacy-breaking: wallet screenshots, address sharing, explorer links, and permanent exposure of more information than the verifier actually needs.

Zkly is the alternative. It lets you generate zero-knowledge proofs about specific Bitcoin facts so you can prove only the claim that matters and keep the rest private.

Zkly is cross-chain by design:
- Bitcoin is the source wallet and source data
- the proof itself is blockchain-agnostic
- Starknet is the first live onchain verification network today
- more chains will be supported later

## Live App

- Frontend: https://frontend-production-9b40.up.railway.app
- Backend: https://backend-production-e073.up.railway.app

## What Zkly Does

Zkly turns Bitcoin wallet state into proof files that can be:
- shared by CID or public link
- stored on Storacha
- checked by verifiers without exposing the holder's BTC address
- verified on a blockchain


## Current Flow

1. Connect a Bitcoin wallet
2. Choose a proof type
3. Pick a threshold
4. Optionally bind a subject/prover in `hash` or `plaintext` mode
5. Zkly fetches the needed Bitcoin address snapshot from Blockstream
6. [XeroStark](https://xerostark.xyz/) compiles the circuit and generates the Groth16 proof
7. Save the proof file to Storacha
8. The holder chooses when to verify on Starknet

## Proof Types

| Proof | What it proves |
|------|------|
| BTC Balance | The wallet holds at least a chosen BTC threshold |
| Hodl Duration | The wallet age reaches a chosen month threshold |
| BTC Reputation Score | A reputation score derived from balance, total received, tx count, and wallet age meets a chosen threshold |

## Subject Binding

Zkly supports two subject/prover modes when the holder wants the proof tied to a person or identifier:

- `hash`
  - stores and shows only the hashed subject value
  - the raw value is not included in the proof file
- `plaintext`
  - stores and shows the subject value in plain text

If no subject is provided, the proof remains anonymous.


## Cross-Chain Positioning

Zkly is designed as a Bitcoin-to-other-chains proof system.

Currently,
- proof generation is blockchain-agnostic
- onchain verification is only implemented for Starknet right now
- more chains will be added later with their along with their own verifier 


## Architecture

| Layer | Role |
|-------|------|
| Bitcoin wallet | Proves control of the BTC address through wallet signatures |
| Blockstream API | Public source for the wallet snapshot used to prepare the proof |
| Browser | Builds circuit inputs and keeps private values local |
| XeroStark | Circuit setup, proving, and verifier-related calldata |
| Storacha | Stores proof files as content-addressed CIDs |
| zkly backend | Handles Storacha app-owned indexing and Starknet relaying |
| Starknet | Onchain verifier deployment and proof verification |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, TypeScript |
| Backend | Express 5, TypeScript, SQLite |
| ZK | Circom 2, Groth16, BN254 |
| Proving infra | XeroStark |
| Onchain verification | Starknet + Garaga-generated verifier flow |
| Storage | Storacha / Filecoin / IPFS |
| Bitcoin data | Blockstream API |

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`

## Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost`
- Backend: `http://localhost:3001`

## Environment Variables

### Backend

See [backend/.env.example](/Users/kat/work/zeroid/backend/.env.example)

Required for the main app flow:
- `XEROSTARK_API_URL`
- `STORACHA_KEY`
- `STORACHA_PROOF`
- `STORACHA_WALLET_HASH_SECRET`
- `STARKNET_RPC_URL`
- `STARKNET_RELAYER_ADDRESS`
- `STARKNET_RELAYER_PRIVATE_KEY`

### Frontend

See [frontend/.env.example](/Users/kat/work/zeroid/frontend/.env.example)

Main variables:
- `VITE_ZKLY_API_URL`
- `VITE_XEROSTARK_API_URL`
- `VITE_BLOCKSTREAM_API_URL`

## Storacha Model

Zkly currently uses an **app-owned Storacha space** with wallet-scoped indexing:

- each uploaded proof file gets a CID
- zkly stores a wallet-hash-to-CID index in the backend
- a wallet only sees the files linked to that wallet inside zkly

The Storacha library in the app lets users:
- load their proof files
- open a file by CID
- copy CIDs and share links
- remove files from zkly's managed Storacha set

