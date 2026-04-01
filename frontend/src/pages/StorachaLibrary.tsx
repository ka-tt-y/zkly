import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ExternalLink, FolderOpen, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBtcWallet } from '../contexts/BtcWalletContext';
import { CopyBtn } from '../components/ProofComponents';
import {
  deleteCredentialLocal,
  getCredentialsLocal,
  type StoredCredential,
} from '../utils/credentialStore';
import {
  getIpfsUrl,
  getStorachaStatus,
  listStorachaFiles,
  removeFromStoracha,
  type StorachaFileRecord,
} from '../services/storachaUpload';

const storachaCacheKey = (walletAddress: string) => `zkly-storacha-files:${walletAddress}`;

interface StorachaTableRow extends StorachaFileRecord {
  credential?: StoredCredential;
}

function readCachedFiles(walletAddress: string): {
  spaceDid: string | null;
  files: StorachaFileRecord[];
} | null {
  try {
    const raw = sessionStorage.getItem(storachaCacheKey(walletAddress));
    if (!raw) return null;
    return JSON.parse(raw) as { spaceDid: string | null; files: StorachaFileRecord[] };
  } catch {
    return null;
  }
}

function writeCachedFiles(walletAddress: string, value: {
  spaceDid: string | null;
  files: StorachaFileRecord[];
}) {
  sessionStorage.setItem(storachaCacheKey(walletAddress), JSON.stringify(value));
}

export default function StorachaLibrary() {
  const navigate = useNavigate();
  const { isConnected } = useAuth();
  const { btcAddress, signMessage } = useBtcWallet();
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [rows, setRows] = useState<StorachaTableRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<StorachaTableRow | null>(null);
  const [deletingCid, setDeletingCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const walletCredentials = useMemo(
    () =>
      getCredentialsLocal().filter(
        (credential) =>
          !btcAddress ||
          !credential.ownerWalletAddress ||
          credential.ownerWalletAddress === btcAddress,
      ),
    [btcAddress],
  );

  const mergeRows = useCallback(
    (files: StorachaFileRecord[]) =>
      files.map((file) => ({
        ...file,
        credential: walletCredentials.find((credential) => credential.storachaCid === file.cid),
      })),
    [walletCredentials],
  );

  const loadFiles = useCallback(async () => {
    if (!btcAddress) return;

    setLoadingFiles(true);
    setError(null);

    try {
      await getStorachaStatus();

      const listing = await listStorachaFiles(btcAddress, { signMessage });
      setRows(mergeRows(listing.files));
      writeCachedFiles(btcAddress, {
        spaceDid: listing.spaceDid,
        files: listing.files,
      });
      setHasLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load Storacha files.');
      setRows([]);
    } finally {
      setLoadingFiles(false);
    }
  }, [btcAddress, mergeRows, signMessage]);

  useEffect(() => {
    if (!btcAddress) {
      setHasLoaded(false);
      setRows([]);
      return;
    }

    const cached = readCachedFiles(btcAddress);
    if (!cached) {
      setHasLoaded(false);
      setRows([]);
      return;
    }

    setHasLoaded(true);
    setRows(mergeRows(cached.files));
  }, [btcAddress, mergeRows]);

  const handleRemove = async (row: StorachaTableRow) => {
    if (!btcAddress) return;

    setDeletingCid(row.cid);
    setError(null);

    try {
      await removeFromStoracha(row.cid, btcAddress, { signMessage });
      if (row.credential) {
        deleteCredentialLocal(row.credential.id);
      }
      await loadFiles();
      setSelectedRow(null);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Could not remove this file from Storacha.',
      );
    } finally {
      setDeletingCid(null);
    }
  };

  if (!isConnected || !btcAddress) {
    return (
      <div className="min-h-screen px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50">
            <Database className="h-6 w-6 text-teal-700" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-teal-950">Storacha library</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            Connect a Bitcoin wallet first to view and manage your proof files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-8 shadow-sm">
          <h1 className="mt-3 text-3xl font-semibold text-teal-950">
            Storacha library
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
            zkly saves each proof as a file so you can open it, share it, copy its CID,
            or delete it as you want.
          </p>

        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-950">Your files</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                Load the Storacha files linked to this BTC wallet.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadFiles().catch(() => {})}
                className="rounded-2xl bg-teal-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
              >
                {loadingFiles ? 'Loading...' : hasLoaded ? 'Refresh files' : 'Load my files'}
              </button>
              <button
                onClick={() => navigate('/prove')}
                className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-600 transition-colors hover:border-teal-300 hover:text-teal-900"
              >
                Create proof
              </button>
            </div>
          </div>

          {!hasLoaded ? (
            <div className="px-6 py-10 text-center text-sm text-stone-500">
              Click <span className="font-medium text-teal-900">Load my files</span> when you want
              zkly to ask your wallet for permission to load your Storacha file list.
            </div>
          ) : loadingFiles ? (
            <div className="px-6 py-10 text-center text-sm text-stone-500">Loading files...</div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-stone-500">
              No files found for this wallet yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-100">
                <thead className="bg-stone-50">
                  <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-stone-400">
                    <th className="px-6 py-3 font-medium">Proof</th>
                    <th className="px-6 py-3 font-medium">CID</th>
                    <th className="px-6 py-3 font-medium">Added</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {rows.map((row) => (
                    <tr
                      key={row.cid}
                      onClick={() => setSelectedRow(row)}
                      className="cursor-pointer transition-colors hover:bg-teal-50/70"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-teal-950">
                        {row.credential?.credentialName || 'Storacha file'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-500">
                        {row.cid.slice(0, 18)}...{row.cid.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500">
                        {row.insertedAt
                          ? new Date(row.insertedAt).toLocaleString('en-US')
                          : row.credential?.createdAt
                            ? new Date(row.credential.createdAt).toLocaleString('en-US')
                            : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500">
                        {row.credential?.starknetTxHash ? 'Verified on Starknet' : 'Saved on Storacha'}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedRow && (
        <StorachaFileModal
          row={selectedRow}
          deleting={deletingCid === selectedRow.cid}
          onClose={() => setSelectedRow(null)}
          onOpenProof={() => {
            if (selectedRow.credential) navigate(`/proofs/${selectedRow.credential.id}`);
          }}
          onRemove={() => handleRemove(selectedRow)}
        />
      )}
    </div>
  );
}

function StorachaFileModal({
  row,
  deleting,
  onClose,
  onOpenProof,
  onRemove,
}: {
  row: StorachaTableRow;
  deleting: boolean;
  onClose: () => void;
  onOpenProof: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
              Storacha file details
            </p>
            <h2 className="mt-2 text-xl font-semibold text-teal-950">
              {row.credential?.credentialName || 'Storacha file'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              Manage the file here. Open the proof page when you want to read the proof itself.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-stone-200 p-2 text-stone-500 transition-colors hover:text-teal-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">CID</p>
            <p className="mt-1 break-all font-mono text-xs text-stone-700">{row.cid}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-100 bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Saved</p>
              <p className="mt-1 text-xs text-stone-700">
                {row.insertedAt
                  ? new Date(row.insertedAt).toLocaleString('en-US')
                  : row.credential?.createdAt
                    ? new Date(row.credential.createdAt).toLocaleString('en-US')
                    : 'Unknown'}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-100 bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Status</p>
              <p className="mt-1 text-xs text-stone-700">
                {row.credential?.starknetTxHash ? 'Verified on Starknet' : 'Saved on Storacha'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => window.open(getIpfsUrl(row.cid), '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-1 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open file
          </button>
          <CopyBtn
            text={row.cid}
            label="Copy CID"
            copiedLabel="CID copied"
            className="rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-stone-600 hover:border-teal-200 hover:text-teal-800"
          />
          <CopyBtn
            text={`${window.location.origin}/p/shared/${row.cid}`}
            label="Copy share link"
            copiedLabel="Link copied"
            className="rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-stone-600 hover:border-teal-200 hover:text-teal-800"
          />
          {row.credential && (
            <button
              onClick={onOpenProof}
              className="inline-flex items-center gap-1 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-stone-600 transition-colors hover:border-teal-200 hover:text-teal-800"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Open proof page
            </button>
          )}
          <button
            onClick={onRemove}
            disabled={deleting}
            className="inline-flex items-center gap-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? 'Removing…' : 'Remove file'}
          </button>
        </div>
      </div>
    </div>
  );
}
