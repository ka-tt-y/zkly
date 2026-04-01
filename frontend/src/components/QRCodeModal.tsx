import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useRef, useState } from 'react';

interface QRCodeModalProps {
  proofId: string;
  credentialType: string;
  onClose: () => void;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://zkly.xyz';

export default function QRCodeModal({ proofId, credentialType, onClose }: QRCodeModalProps) {
  const verifyUrl = `${BASE_URL}/p/shared/${proofId}`;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(() => {
    const svg = canvasRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const link = document.createElement('a');
      link.download = `zkly-${credentialType}-${proofId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }, [proofId, credentialType]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [verifyUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative max-w-xs w-full mx-4 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-sm font-semibold text-teal-900 mb-1">Share Proof</h3>
        <p className="text-[11px] text-gray-500 mb-5">
          Scan to verify this proof.
        </p>

        <div ref={canvasRef} className="flex justify-center mb-5">
          <div className="rounded-lg bg-white p-3 border border-gray-100">
            <QRCodeSVG value={verifyUrl} size={180} level="H" includeMargin={false} />
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[10px] text-gray-500 font-mono break-all text-left">
          {verifyUrl}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-500 hover:text-teal-800 hover:border-gray-400 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 rounded-lg bg-teal-800 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
          >
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
