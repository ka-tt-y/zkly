import type { WizardStep } from '../constants/thresholdConfig';

const WIZARD_STEPS = [
  { key: 'threshold' as const, label: 'Threshold', num: '1' },
  { key: 'privacy' as const, label: 'Privacy', num: '2' },
  { key: 'expiry' as const, label: 'Expiry', num: '3' },
  { key: 'review' as const, label: 'Review', num: '4' },
  { key: 'generate' as const, label: 'Generate', num: '5' },
];

export function WizardIndicator({ currentStep }: { currentStep: WizardStep }) {
  const currentIdx = WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      {WIZARD_STEPS.map((ws, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <div key={ws.key} className="flex items-center">
            {i > 0 && (
              <div className={`h-px w-5 sm:w-8 mx-1 sm:mx-1.5 ${i <= currentIdx ? 'bg-teal-300' : 'bg-gray-200'}`} />
            )}
            <div className="flex items-center gap-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                isDone ? 'bg-teal-100 text-teal-700' :
                isActive ? 'bg-teal-800 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {isDone ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : ws.num}
              </div>
              <span className={`text-[10px] font-medium hidden sm:inline ${
                isActive ? 'text-teal-800' :
                isDone ? 'text-teal-600' :
                'text-gray-400'
              }`}>
                {ws.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


export function SummaryRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-yellow-700' : 'text-teal-800'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="mb-6 flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-800 transition-colors group"
    >
      <svg className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
