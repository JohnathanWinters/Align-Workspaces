import { useState, useRef } from "react";
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
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PenLine,
} from "lucide-react";
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
} from "@/lib/configurator-data";

const iconMap: Record<string, React.ReactNode> = {
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

  const bookMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      notes?: string;
      preferredDate: string;
    }) => {
      const pricing = calculatePricing(state);
      const envValue = state.environment === "other" ? state.environmentCustom || "other" : state.environment;
      const msgValue = state.brandMessage === "other" ? state.brandMessageCustom || "other" : state.brandMessage;
      const impValue = state.emotionalImpact === "other" ? state.emotionalImpactCustom || "other" : state.emotionalImpact;
      const intentValue = state.shootIntent === "other" ? state.shootIntentCustom || "other" : state.shootIntent;
      return apiRequest("POST", "/api/leads", {
        ...data,
        environment: envValue,
        brandMessage: msgValue,
        emotionalImpact: impValue,
        shootIntent: intentValue,
        estimatedMin: pricing.min,
        estimatedMax: pricing.max,
      });
    },
    onSuccess: () => {
      setIsBooked(true);
      toast({
        title: "Shoot Booked!",
        description: "We'll be in touch shortly to confirm your session.",
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
            Your branding shoot has been booked. We'll reach out shortly to finalize
            the details and make sure everything is perfectly aligned with your vision.
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
          <PortfolioSection />
          <PhotographersSection />
        </>
      )}

      {currentStep > 0 && (
        <div ref={configuratorRef} className="min-h-screen">
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="font-serif text-lg">Brand Vision Studio</p>
                <StepIndicator currentStep={currentStep} totalSteps={6} onStepClick={(step) => setCurrentStep(step)} />
                <Link href="/portfolio">
                  <Button variant="ghost" data-testid="link-portfolio-header">Portfolio</Button>
                </Link>
              </div>
            </div>
          </header>

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
                        title="Where Should Your Clients See You?"
                        subtitle="Your environment tells your story before you say a word."
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
                        title="What Do You Want to Communicate?"
                        subtitle="The way you present yourself shapes how clients trust you."
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
                          <OptionCard
                            label="Other"
                            isSelected={state.brandMessage === "other"}
                            onClick={() => setState({ ...state, brandMessage: "other" })}
                            icon={<PenLine className="w-5 h-5" />}
                            testId="option-msg-other"
                          />
                        </div>
                        {state.brandMessage === "other" && (
                          <OtherInput
                            value={state.brandMessageCustom}
                            onChange={(v) => setState({ ...state, brandMessageCustom: v })}
                            placeholder="Describe your brand message..."
                            testId="input-msg-custom"
                          />
                        )}
                      </StepContent>
                    )}

                    {currentStep === 3 && (
                      <StepContent
                        title="How Should Clients Feel When They Meet You?"
                        subtitle="Emotion drives every buying decision."
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
                          <OptionCard
                            label="Other"
                            isSelected={state.emotionalImpact === "other"}
                            onClick={() => setState({ ...state, emotionalImpact: "other" })}
                            icon={<PenLine className="w-5 h-5" />}
                            testId="option-imp-other"
                          />
                        </div>
                        {state.emotionalImpact === "other" && (
                          <OtherInput
                            value={state.emotionalImpactCustom}
                            onChange={(v) => setState({ ...state, emotionalImpactCustom: v })}
                            placeholder="Describe the feeling..."
                            testId="input-imp-custom"
                          />
                        )}
                      </StepContent>
                    )}

                    {currentStep === 4 && (
                      <StepContent
                        title="What Is This Shoot For?"
                        subtitle="Help us tailor the experience to your goals."
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {shootIntents.map((intent) => (
                            <OptionCard
                              key={intent.value}
                              label={intent.label}
                              isSelected={state.shootIntent === intent.value}
                              onClick={() => setState({ ...state, shootIntent: intent.value, shootIntentCustom: "" })}
                              testId={`option-intent-${intent.value}`}
                            />
                          ))}
                          <OptionCard
                            label="Other"
                            isSelected={state.shootIntent === "other"}
                            onClick={() => setState({ ...state, shootIntent: "other" })}
                            icon={<PenLine className="w-5 h-5" />}
                            testId="option-intent-other"
                          />
                        </div>
                        {state.shootIntent === "other" && (
                          <OtherInput
                            value={state.shootIntentCustom}
                            onChange={(v) => setState({ ...state, shootIntentCustom: v })}
                            placeholder="What is this shoot for?"
                            testId="input-intent-custom"
                          />
                        )}
                      </StepContent>
                    )}

                    {currentStep === 5 && (
                      <StepContent
                        title="Here Are Some Clients Who Have Used Your Selections!"
                        subtitle="See real results from shoots with similar choices."
                      >
                        <PortfolioGallery
                          environment={state.environment === "other" ? state.environmentCustom : (state.environment || "")}
                          brandMessage={state.brandMessage === "other" ? state.brandMessageCustom : (state.brandMessage || "")}
                          emotionalImpact={state.emotionalImpact === "other" ? state.emotionalImpactCustom : (state.emotionalImpact || "")}
                        />
                      </StepContent>
                    )}

                    {currentStep === 6 && (
                      <StepContent
                        title="Let's Make It Happen"
                        subtitle="Choose how you'd like to move forward."
                      >
                        <BookingForm
                          onSubmit={(data) => bookMutation.mutate(data)}
                          isPending={bookMutation.isPending}
                        />
                      </StepContent>
                    )}
                  </motion.div>

                  {currentStep < 6 && (
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

              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-24 space-y-6">
                  <ImageGallery
                    environment={state.environment}
                    emotionalImpact={state.emotionalImpact}
                  />
                  <ConceptSummary state={state} />
                </div>
              </div>
            </div>
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
