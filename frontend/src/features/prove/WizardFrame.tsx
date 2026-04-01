import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { WizardStep } from '../../constants/thresholdConfig';
import { BackButton, WizardIndicator } from '../../components/WizardComponents';

interface WizardFrameProps {
  currentStep: WizardStep;
  onBack: () => void;
  backLabel: string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function WizardFrame({
  currentStep,
  onBack,
  backLabel,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  title,
  description,
  children,
}: WizardFrameProps) {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-lg">
        <BackButton onClick={onBack} label={backLabel} />
        <WizardIndicator currentStep={currentStep} />

        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
          <div className="border-b border-stone-100 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBgClass}`}
              >
                <Icon className={`h-5 w-5 ${iconColorClass}`} />
              </div>
              <div>
                <h1 className="text-base font-semibold text-teal-950">{title}</h1>
                <p className="mt-0.5 text-xs text-stone-500">{description}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
