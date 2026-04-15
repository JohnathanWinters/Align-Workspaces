interface CommitmentTimelineProps {
  pricePerHour: string;
  pricePerDay: string;
  minCommitmentWeeks: number;
  discountPercent: number;
  discountAfterWeeks: number;
}

export function CommitmentTimeline({
  pricePerHour,
  pricePerDay,
  minCommitmentWeeks,
  discountPercent,
  discountAfterWeeks,
}: CommitmentTimelineProps) {
  const hourly = Number(pricePerHour) || 0;
  const daily = Number(pricePerDay) || 0;
  const hasHourly = hourly > 0;
  const hasDaily = daily > 0;
  if (!hasHourly && !hasDaily) return null;

  const hourlyDiscounted = discountPercent > 0 ? Math.round(hourly * (1 - discountPercent / 100)) : hourly;
  const dailyDiscounted = discountPercent > 0 ? Math.round(daily * (1 - discountPercent / 100)) : daily;

  const WEEKS = Math.min(12, Math.max(8, minCommitmentWeeks + 2, discountAfterWeeks + 3));
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const weekNum = i + 1;
    const required = minCommitmentWeeks > 1 && weekNum <= minCommitmentWeeks;
    const discounted = discountPercent > 0 && weekNum > discountAfterWeeks;
    return { weekNum, required, discounted };
  });

  const hasAnyRequired = minCommitmentWeeks > 1;
  const hasAnyDiscount = discountPercent > 0;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-stone-700">Here's how it works, week by week</p>
        {hasAnyDiscount && (
          <span className="text-[10px] text-emerald-600 font-medium">
            -{discountPercent}% {discountAfterWeeks === 0 ? "right away" : `after week ${discountAfterWeeks}`}
          </span>
        )}
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map(({ weekNum, required, discounted }) => (
          <div
            key={weekNum}
            className={`flex-shrink-0 w-14 rounded-md p-1.5 text-center border ${
              required ? "border-stone-900 border-2" : "border-stone-200 border-dashed"
            } ${discounted ? "bg-emerald-50" : "bg-white"}`}
          >
            <p className="text-[9px] text-stone-400 uppercase tracking-wide">W{weekNum}</p>
            {hasHourly && (
              <p className={`text-[10px] font-semibold leading-tight ${discounted ? "text-emerald-700" : "text-stone-700"}`}>
                ${discounted ? hourlyDiscounted : hourly}
                <span className="text-[8px] text-stone-400 font-normal">/hr</span>
              </p>
            )}
            {hasDaily && (
              <p className={`text-[10px] font-semibold leading-tight ${discounted ? "text-emerald-700" : "text-stone-700"}`}>
                ${discounted ? dailyDiscounted : daily}
                <span className="text-[8px] text-stone-400 font-normal">/day</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-stone-500 pt-0.5">
        {hasAnyRequired && (
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm border-2 border-stone-900" />
            <span>Required ({minCommitmentWeeks} wks)</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm border border-dashed border-stone-300" />
          <span>{hasAnyRequired ? "Optional" : "Week"}</span>
        </div>
        {hasAnyDiscount && (
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-300" />
            <span>Discounted</span>
          </div>
        )}
      </div>
    </div>
  );
}
