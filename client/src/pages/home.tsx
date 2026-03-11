import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeroSection } from "@/components/hero-section";
import { StepIndicator } from "@/components/step-indicator";
import { OptionCard } from "@/components/option-card";
import { ImageGallery } from "@/components/image-gallery";
import { ConceptSummary } from "@/components/concept-summary";
import { BookingForm } from "@/components/booking-form";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { PortfolioSection } from "@/components/portfolio-section";
import { PhotographersSection } from "@/components/photographers-section";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  UtensilsCrossed,
  Building2,
  TreePine,
  Truck,
  Building,
  Home,
  ChefHat,
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PenLine,
  Shirt,
  Palette,
  Scissors,
  AlertCircle,
  Menu,
  X,
  UserPlus,
  Loader2 as Loader2Icon,
  User,
  Star,
  Camera,
} from "lucide-react";
import { getClothingRecommendations } from "@/lib/clothing-recommendations";
import type {
  ConfiguratorState,
} from "@/lib/configurator-data";
import {
  environments,
  brandMessages,
  emotionalImpacts,
  shootIntents,
  calculatePricing,
  initialState,
  getDisplayLabel,
  getMoodLitImage,
  environmentImages,
} from "@/lib/configurator-data";

const iconMap: Record<string, React.ReactNode> = {
  ChefHat: <ChefHat className="w-5 h-5" />,
  Dumbbell: <Dumbbell className="w-5 h-5" />,
  UtensilsCrossed: <UtensilsCrossed className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  TreePine: <TreePine className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Building: <Building className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
};

export default function HomePage({ autoStart }: { autoStart?: boolean } = {}) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(autoStart ? 1 : 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookingData, setBookingData] = useState<Record<string, any> | null>(null);
  const [portalLinkPending, setPortalLinkPending] = useState(false);
  const [portalLinked, setPortalLinked] = useState(false);
  const [state, setState] = useState<ConfiguratorState>({ ...initialState });

  const configuratorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated: isLoggedIn } = useAuth();

  useEffect(() => {
    document.title = "Align | Portrait Photographer in Miami for Therapists & Small Business Professionals";
    if (window.location.hash === "#configurator" && currentStep === 0) {
      setCurrentStep(1);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setIsBooked(true);
      const savedBooking = localStorage.getItem("align_booking_data");
      if (savedBooking) {
        try { setBookingData(JSON.parse(savedBooking)); } catch {}
      }
      toast({
        title: "Payment Received!",
        description: "Your session is confirmed. We'll be in touch shortly.",
      });
      window.history.replaceState({}, "", "/");
    } else if (payment === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "No worries — your booking wasn't charged. You can try again anytime.",
      });
      window.history.replaceState({}, "", "/");
    }
    if (params.get("start") === "1") {
      setCurrentStep(1);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const savedBooking = localStorage.getItem("align_booking_data");
    if (!savedBooking) return;

    let data: Record<string, string>;
    try { data = JSON.parse(savedBooking); } catch { return; }

    setIsBooked(true);
    setPortalLinkPending(true);

    apiRequest("POST", "/api/booking-shoot", data)
      .then(() => {
        localStorage.removeItem("align_booking_data");
        setPortalLinked(true);
        setPortalLinkPending(false);
        toast({
          title: "Session Added to Portal",
          description: "Your booking is now visible in your Client Portal.",
        });
      })
      .catch(() => {
        setPortalLinkPending(false);
        toast({
          title: "Couldn't link booking",
          description: "Please try again from your Client Portal.",
          variant: "destructive",
        });
      });
  }, [isLoggedIn]);

  function getLeadData(data: { name: string; email: string; phone: string; notes?: string; preferredDate: string }) {
    const pricing = calculatePricing(state);
    const envValue = state.environment === "other" ? state.environmentCustom || "other" : state.environment;
    const msgValue = state.brandMessage === "other" ? state.brandMessageCustom || "other" : state.brandMessage;
    const impValue = state.emotionalImpact === "other" ? state.emotionalImpactCustom || "other" : state.emotionalImpact;
    const intentValue = state.shootIntent === "other" ? state.shootIntentCustom || "other" : state.shootIntent;
    return {
      ...data,
      environment: envValue,
      brandMessage: msgValue,
      emotionalImpact: impValue,
      shootIntent: intentValue,
      estimatedMin: pricing.min,
      estimatedMax: pricing.max,
    };
  }

  const bookMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      notes?: string;
      preferredDate: string;
    }) => {
      return apiRequest("POST", "/api/leads", getLeadData(data));
    },
    onSuccess: (_data, variables) => {
      const leadData = getLeadData(variables);
      localStorage.setItem("align_booking_data", JSON.stringify(leadData));
      setBookingData(leadData);
      setIsBooked(true);
      toast({
        title: "Message Sent!",
        description: "We'll be in touch shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      notes?: string;
      preferredDate: string;
    }) => {
      const leadData = getLeadData(data);
      localStorage.setItem("align_booking_data", JSON.stringify(leadData));
      const response = await apiRequest("POST", "/api/checkout", {
        leadData,
      });
      return await response.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "We couldn't start the payment process. Please try again.",
        variant: "destructive",
      });
    },
  });

  function handleStart() {
    setCurrentStep(1);
    setTimeout(() => {
      configuratorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return !!state.environment && (state.environment !== "other" || state.environmentCustom.trim().length > 0);
      case 2:
        return !!state.brandMessage && (state.brandMessage !== "other" || state.brandMessageCustom.trim().length > 0);
      case 3:
        return !!state.emotionalImpact && (state.emotionalImpact !== "other" || state.emotionalImpactCustom.trim().length > 0);
      case 4:
        return !!state.shootIntent && (state.shootIntent !== "other" || state.shootIntentCustom.trim().length > 0);
      case 5:
        return true;
      default: return false;
    }
  }

  function nextStep() {
    if (canProceed() && currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: configuratorRef.current?.offsetTop ?? 0, behavior: "smooth" });
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: configuratorRef.current?.offsetTop ?? 0, behavior: "smooth" });
    }
  }

  function handleCreateAccount() {
    window.location.href = "/api/login?returnTo=/portal";
  }

  if (isBooked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="font-serif text-3xl mb-4" data-testid="text-booking-success">
            You're All Set
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Your portrait session has been booked. We'll reach out shortly to finalize
            the details and make sure your portraits turn out exactly as you envision.
          </p>

          {portalLinked ? (
            <div className="mb-6 p-4 rounded-lg bg-foreground/5">
              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Linked to Your Portal</p>
              <p className="text-xs text-muted-foreground mb-3">Your booking is in your Client Portal where you'll receive your photos.</p>
              <Link href="/portal">
                <Button variant="default" size="sm" data-testid="button-go-to-portal">
                  Go to Client Portal
                </Button>
              </Link>
            </div>
          ) : portalLinkPending ? (
            <div className="mb-6 p-4 rounded-lg bg-foreground/5">
              <Loader2Icon className="w-5 h-5 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Adding booking to your portal...</p>
            </div>
          ) : !isLoggedIn ? (
            <div className="mb-6 p-4 rounded-lg bg-foreground/5 text-left">
              <div className="flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Create Your Client Portal Account</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Sign up to access your private gallery where we'll deliver your finished portraits for viewing, favoriting, and downloading.
                  </p>
                  <Button
                    onClick={handleCreateAccount}
                    size="sm"
                    data-testid="button-create-account"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <Button
            variant="outline"
            onClick={() => {
              setIsBooked(false);
              setCurrentStep(0);
              setState({ ...initialState });
              setBookingData(null);
              setPortalLinked(false);
              localStorage.removeItem("align_booking_data");
            }}
            data-testid="button-start-over"
          >
            Start Over
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 0 && (
        <>
          <HeroSection onStart={handleStart} />
        </>
      )}

      {currentStep > 0 && (
        <div ref={configuratorRef} id="configurator" className="min-h-screen">
          <header className="sticky top-0 z-[9000] bg-background/95 backdrop-blur-sm border-b border-stone-200/60">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => autoStart ? window.history.back() : setCurrentStep(0)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
                  data-testid="link-home-logo"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">Align Portraits</span>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    data-testid="button-menu-toggle"
                    className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-stone-100/60"
                  >
                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    <span className="hidden sm:inline">Menu</span>
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-3 bg-white border border-stone-200 rounded-xl shadow-lg py-2 min-w-[200px] z-[9999]"
                      >
                        <Link href="/spaces">
                          <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-header">
                            <Building2 className="w-4 h-4" />
                            Align Spaces
                          </button>
                        </Link>
                        <Link href="/portal">
                          <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-header">
                            <User className="w-4 h-4" />
                            Client Portal
                          </button>
                        </Link>
                        <Link href="/featured">
                          <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-header">
                            <Star className="w-4 h-4" />
                            Featured Pros
                          </button>
                        </Link>
                        <Link href="/portfolio">
                          <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-header">
                            <Camera className="w-4 h-4" />
                            Our Work
                          </button>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="mt-3 lg:hidden">
                <StepIndicator currentStep={currentStep} totalSteps={6} onStepClick={(step) => setCurrentStep(step)} />
              </div>
            </div>
          </header>
          <div className="hidden lg:block max-w-6xl mx-auto px-4 pt-6">
            <StepIndicator currentStep={currentStep} totalSteps={6} onStepClick={(step) => setCurrentStep(step)} />
          </div>

          {currentStep > 1 && (
            <div className="max-w-6xl mx-auto px-4 mt-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { step: 1, key: "environment", label: getDisplayLabel("environment", state) },
                  { step: 2, key: "brandMessage", label: getDisplayLabel("brandMessage", state) },
                  { step: 3, key: "emotionalImpact", label: getDisplayLabel("emotionalImpact", state) },
                  { step: 5, key: "shootIntent", label: getDisplayLabel("shootIntent", state) },
                ].filter(s => s.step < currentStep && s.label).map(s => (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/5 hover:bg-foreground/10 text-xs text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                    data-testid={`chip-step-${s.step}`}
                  >
                    <span className="text-[#c4956a] font-medium">
                      {s.step === 1 ? "Location" : s.step === 2 ? "First Impression" : s.step === 3 ? "Client Experience" : "Placement"}:
                    </span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              <div className={"lg:col-span-12 max-w-3xl mx-auto"}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                  >
                    {currentStep === 1 && (
                      <StepContent
                        title="Setting"
                        subtitle="Where the story happens."
                        centerTitle
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {environments.map((env) => (
                            <OptionCard
                              key={env.value}
                              label={env.label}
                              isSelected={state.environment === env.value}
                              onClick={() => setState({ ...state, environment: env.value, environmentCustom: "" })}
                              icon={iconMap[env.icon]}
                              testId={`option-env-${env.value}`}
                            />
                          ))}
                          <OptionCard
                            label="Other"
                            isSelected={state.environment === "other"}
                            onClick={() => setState({ ...state, environment: "other" })}
                            icon={<PenLine className="w-5 h-5" />}
                            testId="option-env-other"
                          />
                        </div>
                        {state.environment === "other" && (
                          <OtherInput
                            value={state.environmentCustom}
                            onChange={(v) => setState({ ...state, environmentCustom: v })}
                            placeholder="Describe your ideal location..."
                            testId="input-env-custom"
                          />
                        )}
                        {state.environment && state.environment !== "other" && (
                          <div className="mt-6">
                            <ImageGallery
                              environment={state.environment}
                              emotionalImpact={state.emotionalImpact}
                            />
                          </div>
                        )}
                      </StepContent>
                    )}

                    {currentStep === 2 && (
                      <StepContent
                        title="First Impression"
                        subtitle="What people understand about you instantly."
                        centerTitle
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {brandMessages.map((msg) => (
                            <OptionCard
                              key={msg.value}
                              label={msg.label}
                              description={msg.description}
                              isSelected={state.brandMessage === msg.value}
                              onClick={() => setState({ ...state, brandMessage: msg.value, brandMessageCustom: "" })}
                              testId={`option-msg-${msg.value}`}
                            />
                          ))}
                        </div>
                      </StepContent>
                    )}

                    {currentStep === 3 && (
                      <StepContent
                        title="Client Experience"
                        subtitle="How clients feel after interacting with you."
                        centerTitle
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {emotionalImpacts.map((imp) => (
                            <OptionCard
                              key={imp.value}
                              label={imp.label}
                              description={imp.description}
                              isSelected={state.emotionalImpact === imp.value}
                              onClick={() => setState({ ...state, emotionalImpact: imp.value, emotionalImpactCustom: "" })}
                              testId={`option-imp-${imp.value}`}
                            />
                          ))}
                        </div>
                        {(() => {
                          const moodImage = getMoodLitImage(state.environment, state.emotionalImpact);
                          const fallbackImage = state.environment ? environmentImages[state.environment] : null;
                          const displayImage = moodImage || fallbackImage;
                          if (!displayImage || state.emotionalImpact === "other") return null;
                          return (
                            <motion.div
                              key={displayImage}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4 }}
                              className="mt-6 rounded-xl overflow-hidden shadow-lg"
                              data-testid="mood-lit-preview"
                            >
                              <img
                                src={displayImage}
                                alt={`Your ${state.environment} location with ${state.emotionalImpact} lighting`}
                                className="w-full h-48 sm:h-64 object-cover"
                              />
                            </motion.div>
                          );
                        })()}
                      </StepContent>
                    )}

                    {currentStep === 5 && (
                      <StepContent
                        title="Placement"
                        subtitle="Where will this image attract attention?"
                        centerTitle
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {shootIntents.map((intent) => (
                            <OptionCard
                              key={intent.value}
                              label={intent.label}
                              description={intent.description}
                              isSelected={state.shootIntent === intent.value}
                              onClick={() => setState({ ...state, shootIntent: intent.value, shootIntentCustom: "" })}
                              testId={`option-intent-${intent.value}`}
                            />
                          ))}
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.15 }}
                          className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-white/80 backdrop-blur-sm p-5"
                          data-testid="step4-pricing"
                        >
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            Estimated Investment
                          </p>
                          <p className="text-xl font-semibold text-card-foreground">
                            ${calculatePricing(state).min.toLocaleString()} &ndash; ${calculatePricing(state).max.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Pricing varies based on venue rental costs and selected marketing usage rights.
                          </p>
                          <p className="text-xs text-[#c4956a] mt-3 font-medium">
                            A 50% deposit secures your date — remainder due at the shoot.
                          </p>
                        </motion.div>
                      </StepContent>
                    )}

                    {currentStep === 4 && (
                      <StepContent
                        title="Our Work"
                        subtitle="Here's what we've curated based on your vision."
                        centerTitle
                      >
                        <PortfolioGallery
                          environment={state.environment === "other" ? state.environmentCustom : (state.environment || "")}
                          brandMessage={state.brandMessage === "other" ? state.brandMessageCustom : (state.brandMessage || "")}
                          emotionalImpact={state.emotionalImpact === "other" ? state.emotionalImpactCustom : (state.emotionalImpact || "")}
                        />
                        {(() => {
                          const recs = getClothingRecommendations(
                            state.environment === "other" ? null : state.environment,
                            state.brandMessage === "other" ? null : state.brandMessage,
                            state.emotionalImpact === "other" ? null : state.emotionalImpact
                          );
                          if (!recs) return null;
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.2 }}
                              className="mt-8 rounded-xl border border-[hsl(var(--border))] bg-white/80 backdrop-blur-sm overflow-hidden"
                              data-testid="clothing-recommendations"
                            >
                              <div className="px-5 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                                <h3 className="font-semibold text-lg font-serif flex items-center gap-2">
                                  <Shirt className="w-5 h-5 text-[hsl(var(--primary))]" />
                                  What to Wear
                                </h3>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                                  This is a general guideline; however, we always want you to dress in a way that feels like you.
                                </p>
                              </div>
                              <div className="p-5 space-y-5">
                                <div data-testid="rec-clothing-types">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Shirt className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                                    <span className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Clothing Tips</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {recs.fit.map((f) => (
                                      <span key={f} className="px-3 py-1.5 rounded-full bg-[hsl(var(--muted))] text-sm font-medium">
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div data-testid="rec-fabrics">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Scissors className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                                    <span className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Fabrics to Avoid</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {recs.avoidFabrics.map((item) => (
                                      <span key={item} className="px-3 py-1.5 rounded-full bg-[hsl(var(--muted))] text-sm font-medium">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="text-sm text-[hsl(var(--foreground))] italic leading-relaxed" data-testid="rec-style-note">
                                  {recs.styleNote}
                                </div>

                                {recs.fabricNote && (
                                  <div className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed" data-testid="rec-fabric-note">
                                    {recs.fabricNote}
                                  </div>
                                )}

                                <div className="flex items-start gap-2 text-sm text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-lg p-3" data-testid="rec-avoid-note">
                                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span>{recs.avoidNote}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })()}

                      </StepContent>
                    )}

                    {currentStep === 6 && (
                      <div className="space-y-8">
                        <ImageGallery
                          environment={state.environment}
                          emotionalImpact={state.emotionalImpact}
                        />
                        <ConceptSummary state={state} />

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="rounded-xl border border-[hsl(var(--border))] bg-white/80 backdrop-blur-sm p-5"
                          data-testid="what-you-get"
                        >
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 text-center font-medium">What You Get</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { label: "1-Hour Session", detail: "A focused, one-hour portrait session tailored to your brand and vision." },
                              { label: "15+ Edited Photos", detail: "At least 15 professionally retouched images, delivered in high resolution within 7–10 business days." },
                              { label: "2 Yearly Edit Tokens", detail: "Two complimentary retouching sessions per year to refresh or refine your images as your brand evolves." },
                              { label: "Personal Mood Board", detail: "A curated mood board built from your configurator choices to guide your session's look and feel." },
                              { label: "Wardrobe Guidance", detail: "Personalized outfit recommendations based on your environment, presence, and desired impact." },
                              { label: "Online Gallery", detail: "A private, shareable online gallery where you can view, download, and share your final images." },
                            ].map((item) => (
                              <div key={item.label} className="group/tip relative text-center p-3 rounded-lg bg-[hsl(var(--muted))]/50 hover:bg-[#c4956a]/10 transition-colors cursor-default" data-testid={`perk-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                                <p className="text-sm font-medium text-foreground">{item.label}</p>
                                <div className="invisible group-hover/tip:visible opacity-0 group-hover/tip:opacity-100 transition-all duration-200 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-foreground text-background text-xs leading-relaxed rounded-lg shadow-xl z-[9999] pointer-events-none">
                                  {item.detail}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        <StepContent
                          title="Bring it to Life"
                          subtitle="Transform your vision into a lasting first impression."
                          centerTitle
                          heroTitle
                        >
                          <BookingForm
                            onSubmit={(data) => bookMutation.mutate(data)}
                            onCheckout={(data) => checkoutMutation.mutate(data)}
                            isPending={bookMutation.isPending}
                            isCheckoutPending={checkoutMutation.isPending}
                            pricing={calculatePricing(state)}
                            selections={{
                              environment: (state.environment === "other" ? state.environmentCustom || "other" : state.environment) || undefined,
                              brandMessage: (state.brandMessage === "other" ? state.brandMessageCustom || "other" : state.brandMessage) || undefined,
                              emotionalImpact: (state.emotionalImpact === "other" ? state.emotionalImpactCustom || "other" : state.emotionalImpact) || undefined,
                              shootIntent: (state.shootIntent === "other" ? state.shootIntentCustom || "other" : state.shootIntent) || undefined,
                            }}
                          />
                        </StepContent>
                      </div>
                    )}
                  </motion.div>

                  {currentStep < 6 && currentStep !== 4 && currentStep !== 5 && currentStep !== 1 && (
                    <div className="flex items-center justify-between gap-4 mt-8 flex-wrap">
                      <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep <= 1}
                        data-testid="button-prev-step"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={nextStep}
                        disabled={!canProceed()}
                        data-testid="button-next-step"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {currentStep === 1 && (
              <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 mt-8 flex-wrap">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep <= 1}
                  data-testid="button-prev-step-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  data-testid="button-next-step-1"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {currentStep === 4 && (
              <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 mt-8 flex-wrap">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  data-testid="button-prev-step-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  data-testid="button-next-step-4"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {currentStep === 5 && (
              <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 mt-8 flex-wrap">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  data-testid="button-prev-step-5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  data-testid="button-next-step-5"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function StepContent({
  title,
  subtitle,
  children,
  centerTitle,
  heroTitle,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  centerTitle?: boolean;
  heroTitle?: boolean;
}) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className={`font-serif mb-2 text-[#c4956a] ${heroTitle ? "text-3xl sm:text-4xl font-bold" : "text-2xl sm:text-3xl"} ${centerTitle ? "text-center" : ""}`}>{title}</h2>
        <p className={`text-sm sm:text-base mb-8 ${heroTitle ? "text-base sm:text-lg text-foreground/70" : "text-muted-foreground"} ${centerTitle ? "text-center" : ""}`}>{subtitle}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function OtherInput({
  value,
  onChange,
  placeholder,
  testId,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  testId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-4"
    >
      <Input
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= 50) {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
        maxLength={50}
        data-testid={testId}
        autoFocus
      />
      <p className="text-xs text-muted-foreground mt-1.5 text-right">{value.length}/50</p>
    </motion.div>
  );
}
