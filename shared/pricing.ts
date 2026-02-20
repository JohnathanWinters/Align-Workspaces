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
