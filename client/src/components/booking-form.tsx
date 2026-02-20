import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CalendarDays, Users, CreditCard, Handshake, CheckCircle, X, LogIn } from "lucide-react";
import { SiSlack, SiInstagram } from "react-icons/si";
import { useState } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  notes: z.string().optional(),
});

const collaborateSchema = z.object({
  firstName: z.string().min(2, "Please enter your first name"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(3, "Please share your vision or questions"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;
type CollaborateFormValues = z.infer<typeof collaborateSchema>;

type BookingMode = null | "lock-date" | "collaborate";

interface BookingFormProps {
  onSubmit: (data: BookingFormValues & { preferredDate: string }) => void;
  onCheckout: (data: BookingFormValues & { preferredDate: string }) => void;
  isPending: boolean;
  isCheckoutPending: boolean;
  pricing: { min: number; max: number };
  selections?: {
    environment?: string;
    brandMessage?: string;
    emotionalImpact?: string;
    shootIntent?: string;
  };
}

export function BookingForm({ onSubmit, onCheckout, isPending, isCheckoutPending, pricing, selections }: BookingFormProps) {
  const [mode, setMode] = useState<BookingMode>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [collaborateSubmitted, setCollaborateSubmitted] = useState(false);
  const [collaboratePending, setCollaboratePending] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const collaborateForm = useForm<CollaborateFormValues>({
    resolver: zodResolver(collaborateSchema),
    defaultValues: {
      firstName: "",
      email: "",
      message: "",
    },
  });

  function handleBookingSubmit(values: BookingFormValues) {
    if (!selectedDate) return;
    onCheckout({
      ...values,
      preferredDate: selectedDate.toISOString().split("T")[0],
    });
  }

  async function handleCollaborateSubmit(values: CollaborateFormValues) {
    setCollaboratePending(true);
    try {
      await apiRequest("POST", "/api/collaborate", {
        ...values,
        environment: selections?.environment,
        brandMessage: selections?.brandMessage,
        emotionalImpact: selections?.emotionalImpact,
        shootIntent: selections?.shootIntent,
      });
      setCollaborateSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Something went wrong",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCollaboratePending(false);
    }
  }

  function closePopup() {
    setMode(null);
    form.reset();
    collaborateForm.reset();
    setSelectedDate(undefined);
    setCollaborateSubmitted(false);
  }

  const downpaymentMin = Math.round(pricing.min / 2);
  const downpaymentMax = Math.round(pricing.max / 2);

  const popupTitle = mode === "collaborate" ? "Collaborate on Your Vision" : "Secure Your Session";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <Card
          className="p-5 cursor-pointer hover-elevate transition-all"
          onClick={() => setMode("collaborate")}
          data-testid="option-collaborate"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
              <Handshake className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-base mb-1">Collaborate on Your Vision</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create your account to save your concept and refine it together.
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-5 cursor-pointer hover-elevate transition-all"
          onClick={() => setMode("lock-date")}
          data-testid="option-lock-date"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-base mb-1">Secure Your Session</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose your date and reserve your aligned portrait experience.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5" data-testid="section-community">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-base mb-1" data-testid="text-community-heading">Be Part of What's Next</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Early access to new ideas, tools, and professional visibility resources.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href="https://join.slack.com/t/align-wz86937/shared_invite/zt-3qhal9os7-ii91ryKvGMzSGA~tuHnU1A"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-slack"
                >
                  <Button variant="outline" size="sm">
                    <SiSlack className="w-4 h-4 mr-2" />
                    Slack
                  </Button>
                </a>
                <a
                  href="https://www.instagram.com/armando.ramirez.romero/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-instagram"
                >
                  <Button variant="outline" size="sm">
                    <SiInstagram className="w-4 h-4 mr-2" />
                    Instagram
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {mode !== null && (
          <motion.div
            key="form-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            data-testid="booking-popup-overlay"
          >
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopup}
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 320, delay: 0.05 }}
              className="relative w-full max-w-lg mx-4 bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
              data-testid="booking-popup-content"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-3 bg-background rounded-t-2xl border-b border-border/50">
                <h2 className="font-serif text-lg font-semibold tracking-tight">{popupTitle}</h2>
                <button
                  type="button"
                  onClick={closePopup}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5 transition-colors shrink-0"
                  data-testid="button-close-popup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5">
                {mode === "lock-date" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="mb-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">Shoots available Fridays & Saturdays</p>
                      <div className="flex justify-center">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => {
                            const day = date.getDay();
                            return date < new Date() || (day !== 5 && day !== 6);
                          }}
                          className="rounded-md border border-border"
                          data-testid="calendar-date-picker"
                        />
                      </div>
                      {!selectedDate && form.formState.isSubmitted && (
                        <p className="text-sm text-destructive mt-2">Please select a date</p>
                      )}
                    </div>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleBookingSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your full name"
                                    {...field}
                                    data-testid="input-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your phone number"
                                    {...field}
                                    data-testid="input-phone"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="your@email.com"
                                  {...field}
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Anything else we should know about your vision?"
                                  className="resize-none"
                                  {...field}
                                  data-testid="input-notes"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="p-4 rounded-md bg-foreground/5 flex items-start gap-3">
                          <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium mb-1">50% Downpayment Required</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              You'll be taken to a secure payment page to pay ${downpaymentMin}–${downpaymentMax} (50% of your session total). The remaining balance is due at the shoot.
                            </p>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full"
                          disabled={isCheckoutPending || !selectedDate}
                          data-testid="button-book-shoot"
                        >
                          {isCheckoutPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Redirecting to payment...
                            </>
                          ) : (
                            "Book Your Shoot"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                )}

                {mode === "collaborate" && !collaborateSubmitted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Form {...collaborateForm}>
                      <form onSubmit={collaborateForm.handleSubmit(handleCollaborateSubmit)} className="space-y-4">
                        <FormField
                          control={collaborateForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your first name"
                                  {...field}
                                  data-testid="input-collaborate-firstname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={collaborateForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="your@email.com"
                                  {...field}
                                  data-testid="input-collaborate-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={collaborateForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Vision</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about the portrait you're envisioning — goals, style, questions, anything."
                                  className="resize-none min-h-[100px]"
                                  {...field}
                                  data-testid="input-collaborate-message"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full"
                          disabled={collaboratePending}
                          data-testid="button-submit-collaborate"
                        >
                          {collaboratePending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Start Collaborating"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                )}

                {mode === "collaborate" && collaborateSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-8"
                  >
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" data-testid="text-collaborate-success-heading">You're In</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto mb-5" data-testid="text-collaborate-success-message">
                      Your concept has been saved and we've been notified. We'll review your vision and reach out soon to refine it together.
                    </p>
                    <Link href="/portal">
                      <Button size="lg" className="w-full" data-testid="button-go-to-portal">
                        <LogIn className="w-4 h-4 mr-2" />
                        Client Portal
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
