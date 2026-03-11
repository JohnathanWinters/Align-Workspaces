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

export const SPACES_FEE_CONFIG = {
  renterFeePercent: 0.07,
  hostFeePercent: 0.07,
};

export function calculateSpaceBookingFees(basePriceCents: number) {
  const renterFee = Math.round(basePriceCents * SPACES_FEE_CONFIG.renterFeePercent);
  const hostFee = Math.round(basePriceCents * SPACES_FEE_CONFIG.hostFeePercent);
  const totalCharge = basePriceCents + renterFee;
  const hostEarnings = basePriceCents - hostFee;
  const platformEarnings = renterFee + hostFee;

  return {
    basePriceCents,
    renterFee,
    hostFee,
    totalCharge,
    hostEarnings,
    platformEarnings,
  };
}
