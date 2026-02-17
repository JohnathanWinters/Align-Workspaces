import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={i} className="flex items-center gap-3">
            <motion.div
              layout
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive
                  ? "w-10 h-10 bg-foreground text-background"
                  : isCompleted
                  ? "w-10 h-10 bg-foreground/10 text-foreground"
                  : "w-10 h-10 bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm font-semibold">{stepNum}</span>
              )}
            </motion.div>
            {i < totalSteps - 1 && (
              <div
                className={`w-8 sm:w-12 h-px transition-colors duration-300 ${
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
