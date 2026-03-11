import { motion } from "framer-motion";
import { Check } from "lucide-react";

const STEP_LABELS = ["Environment", "Presence", "Impact", "Our Work", "Placement", "Book"];

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ currentStep, totalSteps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-0 lg:mb-10">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        const label = STEP_LABELS[i] || `Step ${stepNum}`;

        return (
          <div key={i} className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <motion.button
                layout
                onClick={() => onStepClick?.(stepNum)}
                data-testid={`button-step-${stepNum}`}
                className={`relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "w-8 h-8 sm:w-10 sm:h-10 bg-foreground text-background"
                    : isCompleted
                    ? "w-8 h-8 sm:w-10 sm:h-10 bg-foreground/10 text-foreground"
                    : "w-8 h-8 sm:w-10 sm:h-10 bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <span className="text-xs sm:text-sm font-semibold">{stepNum}</span>
                )}
              </motion.button>
              <span
                data-testid={`text-step-label-${stepNum}`}
                className={`text-[10px] sm:text-xs font-medium leading-tight transition-colors duration-300 ${
                  isActive
                    ? "text-foreground sm:block"
                    : isCompleted
                    ? "text-foreground/60 hidden sm:block"
                    : "text-muted-foreground hidden sm:block"
                }`}
              >
                {label}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-4 sm:w-8 lg:w-12 h-px transition-colors duration-300 self-start mt-4 sm:mt-5 ${
                  stepNum < currentStep ? "bg-foreground/30" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
