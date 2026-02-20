import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface OptionCardProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  description?: string;
  testId: string;
}

export function OptionCard({ label, isSelected, onClick, icon, description, testId }: OptionCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      data-testid={testId}
      className={`relative text-left p-5 rounded-md border transition-all duration-300 ${
        isSelected
          ? "border-foreground/30 bg-foreground/5"
          : "border-border bg-background"
      } hover-elevate`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className={`font-medium text-sm sm:text-base ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
            {label}
          </span>
        </div>
        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: isSelected ? 'hsl(var(--foreground))' : 'transparent' }}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Check className="w-3 h-3 text-background" />
            </motion.div>
          )}
        </div>
      </div>
      {description && (
        <p className={`text-xs sm:text-sm mt-3 leading-relaxed ${isSelected ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
          {description}
        </p>
      )}
    </motion.button>
  );
}
