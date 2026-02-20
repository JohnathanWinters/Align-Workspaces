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
import { Loader2, CalendarDays, MessageCircleQuestion, ArrowLeft, Users, CreditCard } from "lucide-react";
import { SiSlack, SiInstagram } from "react-icons/si";
import { useState } from "react";

const bookingSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  notes: z.string().optional(),
});

const questionsSchema = z.object({
  contact: z.string().min(3, "Please enter your email or phone number"),
  question: z.string().min(3, "Please enter your question"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;
type QuestionsFormValues = z.infer<typeof questionsSchema>;

type BookingMode = null | "lock-date" | "questions";

interface BookingFormProps {
  onSubmit: (data: BookingFormValues & { preferredDate: string }) => void;
  onCheckout: (data: BookingFormValues & { preferredDate: string }) => void;
  isPending: boolean;
  isCheckoutPending: boolean;
  pricing: { min: number; max: number };
}

export function BookingForm({ onSubmit, onCheckout, isPending, isCheckoutPending, pricing }: BookingFormProps) {
  const [mode, setMode] = useState<BookingMode>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const questionsForm = useForm<QuestionsFormValues>({
    resolver: zodResolver(questionsSchema),
    defaultValues: {
      contact: "",
      question: "",
    },
  });

  function handleBookingSubmit(values: BookingFormValues) {
    if (!selectedDate) return;
    onCheckout({
      ...values,
      preferredDate: selectedDate.toISOString().split("T")[0],
    });
  }

  function handleQuestionsSubmit(values: QuestionsFormValues) {
    const isEmail = values.contact.includes("@");
    onSubmit({
      name: "Question Inquiry",
      email: isEmail ? values.contact : "noemail@placeholder.com",
      phone: isEmail ? "" : values.contact,
      notes: values.question,
      preferredDate: "TBD",
    });
  }

  const downpaymentMin = Math.round(pricing.min / 2);
  const downpaymentMax = Math.round(pricing.max / 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {mode === null && (
          <motion.div
            key="mode-select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
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

            <Card
              className="p-5 cursor-pointer hover-elevate transition-all"
              onClick={() => setMode("questions")}
              data-testid="option-questions"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
                  <MessageCircleQuestion className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-base mb-1">Refine Your Concept</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Talk through your vision and ensure it aligns perfectly.
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
                  <h3 className="font-medium text-base mb-1" data-testid="text-community-heading">Elevate Together</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Be part of a network focused on visibility and growth.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <a
                      href="https://slack.com"
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
        )}

        {mode !== null && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <button
              type="button"
              onClick={() => {
                setMode(null);
                form.reset();
                questionsForm.reset();
                setSelectedDate(undefined);
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 hover-elevate rounded-md px-2 py-1 -ml-2"
              data-testid="button-back-to-options"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to options
            </button>

            {mode === "lock-date" && (
              <>
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
              </>
            )}

            {mode === "questions" && (
              <Form {...questionsForm}>
                <form onSubmit={questionsForm.handleSubmit(handleQuestionsSubmit)} className="space-y-4">
                  <FormField
                    control={questionsForm.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your@email.com or (555) 123-4567"
                            {...field}
                            data-testid="input-question-contact"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={questionsForm.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Question</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What would you like to know?"
                            className="resize-none"
                            {...field}
                            data-testid="input-question-text"
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
                    disabled={isPending}
                    data-testid="button-send-question"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Question"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
