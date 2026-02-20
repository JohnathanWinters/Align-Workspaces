import { useState, useRef, useEffect } from "react";
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
import { Link } from "wouter";
import {
  UtensilsCrossed,
  Building2,
  TreePine,
  Truck,
  Building,
  Home,
  ChefHat,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PenLine,
  Shirt,
  Palette,
  Scissors,
  AlertCircle,
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
  UtensilsCrossed: <UtensilsCrossed className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  TreePine: <TreePine className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Building: <Building className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
};

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isBooked, setIsBooked] = useState(false);
  const [state, setState] = useState<ConfiguratorState>({ ...initialState });

  const configuratorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setIsBooked(true);
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
  }, []);

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
    onSuccess: () => {
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
          <p className="text-muted-foreground leading-relaxed mb-8">
            Your portrait session has been booked. We'll reach out shortly to finalize
            the details and make sure your portraits turn out exactly as you envision.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setIsBooked(false);
              setCurrentStep(0);
              setState({ ...initialState });
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
        <div ref={configuratorRef} className="min-h-screen">
          <header className="lg:sticky lg:top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="max-w-6xl mx-auto px-4 py-3 lg:py-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="font-serif text-lg cursor-pointer" onClick={() => setCurrentStep(0)} data-testid="link-home-logo">Brand Vision Studio</p>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <Link href="/portfolio">
                    <Button variant="ghost" size="sm" data-testid="link-portfolio-header">Portfolio</Button>
                  </Link>
                  <Link href="/about">
                    <Button variant="ghost" size="sm" data-testid="link-about-header">About Us</Button>
                  </Link>
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

          <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-7">
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
                        title="Environment"
                        subtitle="Where clients expect to see you."
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
                      </StepContent>
                    )}

                    {currentStep === 2 && (
                      <StepContent
                        title="Presence"
                        subtitle="What should they understand about you instantly?"
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
                        title="Impact"
                        subtitle="How should they feel before you speak?"
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
                        </motion.div>
                      </StepContent>
                    )}

                    {currentStep === 4 && (
                      <StepContent
                        title="Your Portrait Preview"
                        subtitle="Based on your selections, here's what to expect."
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
                                  While there is a general guideline we always want you to dress in a way that feels like you!
                                </p>
                              </div>
                              <div className="p-5 space-y-5">
                                <div data-testid="rec-clothing-types">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Shirt className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                                    <span className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Clothing</span>
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
                      <StepContent
                        title="Bring it to Life"
                        subtitle="Transform your vision into a lasting first impression."
                      >
                        <BookingForm
                          onSubmit={(data) => bookMutation.mutate(data)}
                          onCheckout={(data) => checkoutMutation.mutate(data)}
                          isPending={bookMutation.isPending}
                          isCheckoutPending={checkoutMutation.isPending}
                          pricing={calculatePricing(state)}
                        />
                      </StepContent>
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

              <div className={`lg:col-span-5 ${currentStep === 2 || currentStep === 3 || currentStep === 5 ? "hidden lg:block" : ""}`}>
                <div className="lg:sticky lg:top-24 space-y-6">
                  {currentStep !== 4 && (
                    <ImageGallery
                      environment={state.environment}
                      emotionalImpact={state.emotionalImpact}
                    />
                  )}
                  {currentStep !== 4 && currentStep !== 1 && <ConceptSummary state={state} />}
                </div>
              </div>
            </div>

            {currentStep === 1 && (
              <div className="flex items-center justify-between gap-4 mt-8 flex-wrap">
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
              <div className="flex items-center justify-between gap-4 mt-8 flex-wrap">
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
              <div className="flex items-center justify-between gap-4 mt-8 flex-wrap">
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
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl sm:text-3xl mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm sm:text-base mb-8">{subtitle}</p>
      {children}
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
          if (e.target.value.length <= 30) {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
        maxLength={30}
        data-testid={testId}
        autoFocus
      />
      <p className="text-xs text-muted-foreground mt-1.5 text-right">{value.length}/30</p>
    </motion.div>
  );
}
