import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';

export function CopyBtn({
  text,
  className = '',
  label = 'Copy',
  copiedLabel = 'Copied',
}: {
  text: string;
  className?: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-teal-700 transition-colors ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label}
        </>
      )}
    </button>
  );
}

export function PipelineStep({
  active,
  done,
  error,
  disabled,
  title,
  subtitle,
  action,
}: {
  active: boolean;
  done: boolean;
  error?: boolean;
  disabled?: boolean;
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
      disabled ? 'border border-gray-100 bg-gray-50/50 opacity-40' :
      error ? 'border border-red-200 bg-red-50' :
      done ? 'border border-green-200 bg-green-50' :
      active ? 'border border-yellow-200 bg-yellow-50' :
      'border border-gray-200 bg-gray-50'
    }`}>
      {done ? (
        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : active ? (
        <div className="h-6 w-6 flex items-center justify-center shrink-0">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-200 border-t-yellow-600" />
        </div>
      ) : error ? (
        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ) : (
        <div className="h-6 w-6 rounded-full border border-gray-300 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-green-700' : error ? 'text-red-600' : 'text-teal-800'}`}>
          {title}
        </p>
        {subtitle}
      </div>

      {action}
    </div>
  );
}

export function InfoRow({ label, value, mono, href }: { label: string; value: string; mono?: boolean; href?: string }) {
  const display = value.length > 42 ? value.slice(0, 16) + '…' + value.slice(-6) : value;
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <span className="text-[10px] text-gray-400 shrink-0 pt-0.5">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-500 text-right break-all ${mono ? 'font-mono' : ''}`}
        >
          {display}
          <ArrowUpRight className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <span className={`text-xs text-gray-600 text-right break-all ${mono ? 'font-mono' : ''}`}>{display}</span>
      )}
    </div>
  );
}
