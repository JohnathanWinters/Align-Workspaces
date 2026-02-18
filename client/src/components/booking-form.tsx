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
import { Loader2, CalendarDays, MessageCircleQuestion, ArrowLeft, Users } from "lucide-react";
import { SiSlack, SiInstagram } from "react-icons/si";
import { useState } from "react";

const bookingSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

type BookingMode = null | "lock-date" | "questions";

interface BookingFormProps {
  onSubmit: (data: BookingFormValues & { preferredDate: string }) => void;
  isPending: boolean;
}

export function BookingForm({ onSubmit, isPending }: BookingFormProps) {
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

  function handleSubmit(values: BookingFormValues) {
    if (mode === "lock-date" && !selectedDate) return;
    onSubmit({
      ...values,
      preferredDate: mode === "lock-date" && selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : "TBD",
    });
  }

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
                  <h3 className="font-medium text-base mb-1">Lock in a Date</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ready to go? Pick a date on the calendar and enter your details to secure your session.
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
                  <h3 className="font-medium text-base mb-1">Still Have Questions?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Want more guidance before committing? Share your info and the photographer will reach out to you.
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
                  <h3 className="font-medium text-base mb-1" data-testid="text-community-heading">Join Our Community</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Connect with other professionals and stay up to date on sessions, tips, and behind-the-scenes content.
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
                setSelectedDate(undefined);
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 hover-elevate rounded-md px-2 py-1 -ml-2"
              data-testid="button-back-to-options"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to options
            </button>

            {mode === "lock-date" && (
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
            )}

            {mode === "questions" && (
              <div className="mb-6 p-4 rounded-md bg-foreground/5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Share your contact details below and the photographer will get back to you to answer any questions and help plan your session.
                </p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      <FormLabel>{mode === "questions" ? "Your Questions" : "Notes"} (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={mode === "questions"
                            ? "What would you like to know?"
                            : "Anything else we should know about your vision?"
                          }
                          className="resize-none"
                          {...field}
                          data-testid="input-notes"
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
                  disabled={isPending || (mode === "lock-date" && !selectedDate)}
                  data-testid="button-book-shoot"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : mode === "lock-date" ? (
                    "Book Your Shoot"
                  ) : (
                    "Get in Touch"
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
