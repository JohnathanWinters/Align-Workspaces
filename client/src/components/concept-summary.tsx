import { motion, AnimatePresence } from "framer-motion";
import type { ConfiguratorState } from "@/lib/configurator-data";
import {
  generateBrandDescription,
  getDisplayLabel,
  calculatePricing,
} from "@/lib/configurator-data";

interface ConceptSummaryProps {
  state: ConfiguratorState;
}

export function ConceptSummary({ state }: ConceptSummaryProps) {
  const envLabel = getDisplayLabel("environment", state);
  const msgLabel = getDisplayLabel("brandMessage", state);
  const impLabel = getDisplayLabel("emotionalImpact", state);
  const description = generateBrandDescription(state);
  const pricing = calculatePricing(state);

  const hasAnySelection = state.environment || state.brandMessage || state.emotionalImpact;

  return (
    <div
      className="border border-border rounded-md p-6 bg-card"
      data-testid="concept-summary-panel"
    >
      <h3 className="font-serif text-lg mb-5 text-card-foreground">Your Shoot Concept</h3>

      <div className="space-y-4">
        <SummaryRow label="Location" value={envLabel} />
        <SummaryRow label="Message" value={msgLabel} />
        <SummaryRow label="Feeling" value={impLabel} />
      </div>

      <AnimatePresence>
        {description && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 pt-5 border-t border-border"
          >
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              "{description}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasAnySelection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-5 pt-5 border-t border-border"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Estimated Investment
            </p>
            <p className="text-xl font-semibold text-card-foreground" data-testid="text-pricing">
              ${pricing.min.toLocaleString()} &ndash; ${pricing.max.toLocaleString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasAnySelection && (
        <p className="text-sm text-muted-foreground mt-4">
          Start selecting options to build your concept.
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <AnimatePresence mode="wait">
        {value ? (
          <motion.span
            key={value}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-sm font-medium text-card-foreground"
            data-testid={`text-summary-${label.toLowerCase()}`}
          >
            {value}
          </motion.span>
        ) : (
          <span className="text-sm text-muted-foreground/50" data-testid={`text-summary-${label.toLowerCase()}`}>
            &mdash;
          </span>
        )}
      </AnimatePresence>
    </div>
  );
}
