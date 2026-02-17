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
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-background" />
          </motion.div>
        )}
      </div>
      {description && isSelected && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="text-muted-foreground text-xs sm:text-sm mt-3 leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </motion.button>
  );
}
