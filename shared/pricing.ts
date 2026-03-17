export function calculatePricing(shootIntent: string | null): { min: number; max: number } {
  let min = 200;
  let max = 300;

  if (shootIntent === "commercial") {
    min += 200;
    max += 500;
  } else if (shootIntent === "team") {
    min += 150;
    max += 1700;
  }

  return { min, max };
}

// --- Three-Tier Fee Structure ---

export type FeeTier = "standard" | "host_referred" | "repeat_guest";

export const FEE_TIERS: Record<FeeTier, { hostFeePercent: number; guestFeePercent: number }> = {
  standard: {
    hostFeePercent: 0.125,   // 12.5%
    guestFeePercent: 0.05,   // 5%
  },
  host_referred: {
    hostFeePercent: 0.08,    // 8%
    guestFeePercent: 0.05,   // 5%
  },
  repeat_guest: {
    hostFeePercent: 0.125,   // 12.5%
    guestFeePercent: 0.03,   // 3%
  },
};

// Total platform take: standard=17.5%, host_referred=13%, repeat_guest=15.5%

export const TAX_RATES: Record<string, { rate: number; label: string }> = {
  "FL-MIAMI-DADE": { rate: 0.07, label: "Sales tax (FL 6% + Miami-Dade 1%)" },
};

export const DEFAULT_TAX_JURISDICTION = "FL-MIAMI-DADE";

/**
 * Determine which fee tier applies.
 * If both repeat_guest AND host_referred qualify, pick the one with lower total platform take.
 * host_referred total = 13%, repeat_guest total = 15.5% → host_referred wins.
 */
export function resolveFeeTier(opts: {
  isRepeatGuest: boolean;
  isHostReferred: boolean;
}): FeeTier {
  const { isRepeatGuest, isHostReferred } = opts;

  if (isRepeatGuest && isHostReferred) {
    // host_referred has lower total take (13% vs 15.5%)
    return "host_referred";
  }
  if (isHostReferred) return "host_referred";
  if (isRepeatGuest) return "repeat_guest";
  return "standard";
}

export interface SpaceBookingFeeResult {
  basePriceCents: number;
  feeTier: FeeTier;
  guestFeePercent: number;
  guestFeeAmount: number;
  hostFeePercent: number;
  hostFeeAmount: number;
  taxRate: number;
  taxAmount: number;
  totalGuestCharged: number;   // basePriceCents + guestFeeAmount + taxAmount
  hostPayoutAmount: number;    // basePriceCents - hostFeeAmount
  platformRevenue: number;     // hostFeeAmount + guestFeeAmount

  // Legacy field names for backward compatibility with existing code
  renterFee: number;
  hostFee: number;
  totalCharge: number;
  hostEarnings: number;
}

/**
 * Calculate all fees for a space booking.
 * @param basePriceCents - Listing price × hours, in cents
 * @param tier - Which fee tier to apply
 * @param taxJurisdiction - Tax jurisdiction key (defaults to FL-MIAMI-DADE)
 */
export function calculateSpaceBookingFees(
  basePriceCents: number,
  tier: FeeTier = "standard",
  taxJurisdiction: string = DEFAULT_TAX_JURISDICTION,
): SpaceBookingFeeResult {
  const tierConfig = FEE_TIERS[tier];
  const taxConfig = TAX_RATES[taxJurisdiction];
  const taxRate = taxConfig?.rate ?? 0;

  const guestFeeAmount = Math.round(basePriceCents * tierConfig.guestFeePercent);
  const hostFeeAmount = Math.round(basePriceCents * tierConfig.hostFeePercent);
  const taxAmount = Math.round(basePriceCents * taxRate); // Tax on subtotal only, not on fees
  const totalGuestCharged = basePriceCents + guestFeeAmount + taxAmount;
  const hostPayoutAmount = basePriceCents - hostFeeAmount;
  const platformRevenue = hostFeeAmount + guestFeeAmount;

  return {
    basePriceCents,
    feeTier: tier,
    guestFeePercent: tierConfig.guestFeePercent,
    guestFeeAmount,
    hostFeePercent: tierConfig.hostFeePercent,
    hostFeeAmount,
    taxRate,
    taxAmount,
    totalGuestCharged,
    hostPayoutAmount,
    platformRevenue,

    // Legacy compatibility
    renterFee: guestFeeAmount,
    hostFee: hostFeeAmount,
    totalCharge: totalGuestCharged,
    hostEarnings: hostPayoutAmount,
  };
}

// Keep old config export for any code that references it directly
export const SPACES_FEE_CONFIG = {
  renterFeePercent: FEE_TIERS.standard.guestFeePercent,
  hostFeePercent: FEE_TIERS.standard.hostFeePercent,
};
