import React from 'react';
import { CheckCircle, Users, Package, Edit, Eye, LucideIcon } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { id: 0, title: 'Kunde', icon: Users },
  { id: 1, title: 'Leistungen', icon: Package },
  { id: 2, title: 'Positionen', icon: Edit },
  { id: 3, title: 'Vorschau', icon: Eye }
];

interface StepIndicatorProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, setCurrentStep }) => {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <React.Fragment key={step.id}>
            <div
              className={`flex items-center cursor-pointer ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}
              onClick={() => index < currentStep && setCurrentStep(index)}
            >
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2
                ${isActive ? 'border-blue-600 bg-blue-50' : isCompleted ? 'border-green-600 bg-green-50' : 'border-gray-300'}
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span className="ml-2 text-sm font-medium hidden md:block">{step.title}</span>
            </div>

            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                index < currentStep ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
