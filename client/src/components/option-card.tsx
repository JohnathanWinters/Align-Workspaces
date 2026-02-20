import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface OptionCardProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  description?: string;
  testId: string;
  iconFocused?: boolean;
}

export function OptionCard({ label, isSelected, onClick, icon, description, testId, iconFocused }: OptionCardProps) {
  if (iconFocused && icon) {
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        data-testid={testId}
        className={`relative text-center p-5 pb-4 rounded-md border transition-all duration-300 ${
          isSelected
            ? "border-foreground/30 bg-foreground/5"
            : "border-border bg-background"
        } hover-elevate`}
      >
        <div className="absolute top-3 right-3 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: isSelected ? 'hsl(var(--foreground))' : 'transparent', border: isSelected ? 'none' : '1.5px solid hsl(var(--border))' }}
        >
          {isSelected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check className="w-3 h-3 text-background" />
            </motion.div>
          )}
        </div>

        <div className={`flex justify-center mb-3 transition-colors duration-300 ${isSelected ? "text-foreground" : "text-foreground/40"}`}>
          {icon}
        </div>

        <span className={`block font-semibold text-sm tracking-wide uppercase transition-colors duration-300 ${isSelected ? "text-foreground" : "text-foreground/70"}`}>
          {label}
        </span>

        {description && (
          <p className={`text-[11px] sm:text-xs mt-2 leading-relaxed transition-colors duration-300 ${isSelected ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
            {description}
          </p>
        )}
      </motion.button>
    );
  }

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
