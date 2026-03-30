import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, DollarSign, Users, TrendingUp, Shield, Building2, Heart } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export default function PricingPage() {
  const [hourlyRate, setHourlyRate] = useState(35);
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [isReferred, setIsReferred] = useState(false);

  useEffect(() => {
    document.title = "Pricing | Align Workspaces";
    window.scrollTo(0, 0);
  }, []);

  const hostFeePercent = isReferred ? 0.08 : 0.125;
  const guestFeePercent = 0.07;
  const taxRate = 0.07;

  const basePerBooking = hourlyRate;
  const hostFeePerHour = basePerBooking * hostFeePercent;
  const hostEarningsPerHour = basePerBooking - hostFeePerHour;

  const guestFeePerHour = basePerBooking * guestFeePercent;
  const guestTaxPerHour = basePerBooking * taxRate;
  const guestTotalPerHour = basePerBooking + guestFeePerHour + guestTaxPerHour;

  const weeklyGross = basePerBooking * hoursPerWeek;
  const weeklyHostFee = hostFeePerHour * hoursPerWeek;
  const weeklyNet = hostEarningsPerHour * hoursPerWeek;
  const monthlyNet = weeklyNet * 4;
  const yearlyNet = weeklyNet * 50;

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="sticky top-0 z-50 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">Pricing</span>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 mb-3">Simple, Transparent Pricing</h1>
          <p className="text-stone-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            No hidden fees for anyone. Hosts keep more, guests pay less, and everyone sees exactly what they're getting.
          </p>
        </div>

        {/* Fee Structure Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-stone-200/60 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-serif text-lg text-stone-900">Host Fees</h2>
                <p className="text-xs text-stone-400">What Align charges hosts per booking</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-100">
                <div>
                  <p className="text-sm font-medium text-stone-800">Standard Rate</p>
                  <p className="text-xs text-stone-400">Hosts keep 87.5% of every booking</p>
                </div>
                <span className="text-lg font-bold text-stone-900">12.5%</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-stone-100">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Referred Booking Rate</p>
                  <p className="text-xs text-stone-400">Hosts who refer their own clients keep 92%</p>
                </div>
                <span className="text-lg font-bold text-emerald-600">8%</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-stone-800">Payout Schedule</p>
                  <p className="text-xs text-stone-400">Direct deposit via Stripe</p>
                </div>
                <span className="text-sm font-medium text-stone-600">Automatic</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/60 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-serif text-lg text-stone-900">Guest Fees</h2>
                <p className="text-xs text-stone-400">What guests pay on top of the listed rate</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-stone-100">
                <div>
                  <p className="text-sm font-medium text-stone-800">Service Fee</p>
                  <p className="text-xs text-stone-400">Added to the booking price</p>
                </div>
                <span className="text-lg font-bold text-stone-900">7%</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-stone-100">
                <div>
                  <p className="text-sm font-medium text-stone-800">Repeat Guest Fee</p>
                  <p className="text-xs text-stone-400">Book regularly and pay less</p>
                </div>
                <span className="text-lg font-bold text-stone-900">5%</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-stone-800">Sales Tax (Miami-Dade)</p>
                  <p className="text-xs text-stone-400">Applied to the base price</p>
                </div>
                <span className="text-sm font-medium text-stone-600">7%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Calculator */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#c4956a]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#c4956a]" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-stone-900">Earnings Calculator</h2>
              <p className="text-xs text-stone-400">See what hosts earn and what guests pay</p>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-stone-700">Hourly Rate</label>
                <span className="text-lg font-bold text-stone-900">${hourlyRate}/hr</span>
              </div>
              <input
                type="range"
                min={15}
                max={150}
                step={5}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                className="w-full accent-stone-900"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>$15</span>
                <span>$150</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-stone-700">Hours Booked / Week</label>
                <span className="text-lg font-bold text-stone-900">{hoursPerWeek} hrs</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                className="w-full accent-stone-900"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>1 hr</span>
                <span>60 hrs</span>
              </div>
            </div>
          </div>

          {/* Referral toggle */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              onClick={() => setIsReferred(false)}
              className={`rounded-xl p-4 text-left transition-all border-2 ${!isReferred ? "border-stone-900 bg-white shadow-sm" : "border-stone-200 bg-stone-50 hover:border-stone-300"}`}
            >
              <p className={`text-sm font-semibold mb-0.5 ${!isReferred ? "text-stone-900" : "text-stone-500"}`}>Standard</p>
              <p className="text-xs text-stone-400">12.5% host fee</p>
              <p className={`text-lg font-bold mt-2 ${!isReferred ? "text-stone-900" : "text-stone-400"}`}>Host keeps 87.5%</p>
            </button>
            <button
              onClick={() => setIsReferred(true)}
              className={`rounded-xl p-4 text-left transition-all border-2 ${isReferred ? "border-emerald-600 bg-emerald-50 shadow-sm" : "border-stone-200 bg-stone-50 hover:border-stone-300"}`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-sm font-semibold ${isReferred ? "text-emerald-800" : "text-stone-500"}`}>With Referral Link</p>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Save More</span>
              </div>
              <p className="text-xs text-stone-400">8% host fee</p>
              <p className={`text-lg font-bold mt-2 ${isReferred ? "text-emerald-700" : "text-stone-400"}`}>Host keeps 92%</p>
            </button>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-stone-50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Per Hour</p>
              <p className="text-xl sm:text-2xl font-bold text-stone-900">${hostEarningsPerHour.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400">host earns</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Weekly</p>
              <p className="text-xl sm:text-2xl font-bold text-stone-900">${weeklyNet.toFixed(0)}</p>
              <p className="text-[10px] text-stone-400">net earnings</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Monthly</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">${monthlyNet.toFixed(0)}</p>
              <p className="text-[10px] text-stone-400">net earnings</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Yearly</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">${yearlyNet.toLocaleString()}</p>
              <p className="text-[10px] text-stone-400">net earnings</p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-stone-200/60 rounded-xl overflow-hidden">
            <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200/60">
              <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider">What Hosts Earn Per Hour</p>
            </div>
            <div className="divide-y divide-stone-100">
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-stone-600">Host listed rate</span>
                <span className="text-sm font-medium text-stone-900">${basePerBooking.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-stone-600">Align host fee ({(hostFeePercent * 100).toFixed(1)}%)</span>
                <span className="text-sm font-medium text-red-500">-${hostFeePerHour.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-emerald-50/50">
                <span className="text-sm font-semibold text-emerald-800">Host receives</span>
                <span className="text-sm font-bold text-emerald-700">${hostEarningsPerHour.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-stone-50 px-4 py-2.5 border-t border-stone-200/60 border-b border-stone-200/60">
              <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider">What Guests Pay Per Hour</p>
            </div>
            <div className="divide-y divide-stone-100">
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-stone-600">Host listed rate</span>
                <span className="text-sm font-medium text-stone-900">${basePerBooking.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-stone-600">Service fee (7%)</span>
                <span className="text-sm font-medium text-stone-500">+${guestFeePerHour.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-stone-600">Sales tax (7%)</span>
                <span className="text-sm font-medium text-stone-500">+${guestTaxPerHour.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-blue-50/50">
                <span className="text-sm font-semibold text-blue-800">Guest total</span>
                <span className="text-sm font-bold text-blue-700">${guestTotalPerHour.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Align */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-xl border border-stone-200/60 p-5">
            <Shield className="w-5 h-5 text-[#c4956a] mb-3" />
            <h3 className="text-sm font-semibold text-stone-900 mb-1">No Hidden Fees</h3>
            <p className="text-xs text-stone-400 leading-relaxed">What you see is what you get. No monthly subscription, no listing fees, no setup costs for hosts or guests.</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/60 p-5">
            <DollarSign className="w-5 h-5 text-[#c4956a] mb-3" />
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Automatic Payouts</h3>
            <p className="text-xs text-stone-400 leading-relaxed">Host earnings deposited directly via Stripe. Guests get clear receipts. No invoicing, no chasing payments.</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/60 p-5">
            <Heart className="w-5 h-5 text-[#c4956a] mb-3" />
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Repeat Guests Pay Less</h3>
            <p className="text-xs text-stone-400 leading-relaxed">Guest service fees drop from 7% to 5% on repeat bookings. The more you use Align, the more you save.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-stone-500 text-sm mb-4">Ready to get started?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Browse Workspaces
            </Link>
            <Link
              href="/portal?tab=spaces"
              className="inline-flex items-center gap-2 border border-stone-200 text-stone-700 px-6 py-3 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              List Your Workspace
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
