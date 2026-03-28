import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Menu,
  X,
  Building2,
  Camera,
  Star,
  Info,
  Images,
  User,
  HelpCircle,
  Send,
  Loader2,
  CheckCircle2,
  Mail,
  MessageCircle,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserIndicator } from "@/components/user-indicator";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const faqs = [
  {
    q: "How do I book a workspace?",
    a: "Browse available spaces on our Workspaces page, select one you like, choose your date and time, and complete the booking. You'll receive a confirmation and can message your host directly.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellations made 24+ hours before your booking start time are eligible for a full refund. Cancellations within 24 hours are non-refundable.",
  },
  {
    q: "How do I message my host?",
    a: "Once you have an active booking or inquiry, you can message your host through the Messages section in your Client Portal, or use the floating messenger available on any page.",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed securely through Stripe. Your host may send a payment request through the booking conversation, and you can pay directly from the chat.",
  },
  {
    q: "How do I list my workspace?",
    a: "Head to the Client Portal and navigate to the Workspaces tab. From there you can list a new workspace with photos, pricing, availability schedule, and more.",
  },
  {
    q: "How do I check in to my booking?",
    a: "On the day of your booking, open your conversation with the host. A check-in button will appear 15 minutes before your scheduled start time.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-900">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-gray-500 pb-4 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupportPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    document.title = "Support | Align Workspaces";
  }, []);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/support-request", {
        name,
        email,
        message,
      });
    },
    onSuccess: () => {
      setSent(true);
      setMessage("");
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/support-request", {
        name: user?.name || user?.firstName || "Anonymous",
        email: user?.email || email || "no-email@feedback",
        message: `[SITE FEEDBACK]\n\n${feedback}`,
      });
    },
    onSuccess: () => {
      setFeedbackSent(true);
      setFeedback("");
    },
  });

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">
            Support
          </span>

          <div className="flex items-center gap-3 z-10">
            <UserIndicator />
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
                    <button onClick={() => { setLocation("/portal"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portal-support">
                      <User className="w-4 h-4" />
                      Client Portal
                    </button>
                    <button onClick={() => { setLocation("/"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-spaces-support">
                      <Building2 className="w-4 h-4" />
                      Align Workspaces
                    </button>
                    <button onClick={() => { setLocation("/workspaces"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-workspaces-support">
                      <Building2 className="w-4 h-4" />
                      Workspaces
                    </button>
                    <button onClick={() => { setLocation("/portrait-builder"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portraits-support">
                      <Camera className="w-4 h-4" />
                      Portrait Builder
                    </button>
                    <button onClick={() => { setLocation("/portfolio"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-portfolio-support">
                      <Images className="w-4 h-4" />
                      Our Work
                    </button>
                    <button onClick={() => { setLocation("/featured"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-featured-support">
                      <Star className="w-4 h-4" />
                      Featured Pros
                    </button>
                    <button onClick={() => { setLocation("/our-vision"); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3" data-testid="link-about-support">
                      <Info className="w-4 h-4" />
                      Our Vision
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-5">
              <HelpCircle className="w-7 h-7 text-stone-500" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-3">How can we help?</h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Whether you're a guest, a host, or just exploring, we're here to help.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-gray-900">Send us a message</h2>
                  <p className="text-xs text-gray-500">We'll get back to you as soon as possible</p>
                </div>
              </div>

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-serif text-xl text-gray-900 mb-1">Message sent!</h3>
                  <p className="text-sm text-gray-500 mb-6">We'll get back to you shortly.</p>
                  <Button
                    variant="outline"
                    onClick={() => setSent(false)}
                    className="text-sm"
                  >
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="bg-gray-50 border-gray-200 text-sm"
                      data-testid="input-support-name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-gray-50 border-gray-200 text-sm"
                      data-testid="input-support-email"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Message</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      rows={5}
                      disabled={sendMutation.isPending}
                      className="resize-none bg-gray-50 border-gray-200 text-sm"
                      data-testid="input-support-message"
                    />
                  </div>
                  {sendMutation.isError && (
                    <p className="text-red-500 text-xs">Failed to send. Please try again.</p>
                  )}
                  <Button
                    onClick={() => sendMutation.mutate()}
                    disabled={!message.trim() || !email.trim() || sendMutation.isPending}
                    className="w-full bg-gray-900 text-white hover:bg-black"
                    data-testid="button-send-support"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {sendMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              )}
            </div>

            {/* Direct email */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 mb-1">Or reach us directly at</p>
              <a
                href="mailto:hello@alignworkspaces.com"
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                hello@alignworkspaces.com
              </a>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="font-serif text-lg text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="bg-white rounded-2xl border border-gray-200 px-6">
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 sm:mt-16 max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-serif text-lg text-gray-900">Help us improve</h2>
                <p className="text-xs text-gray-500">Share your ideas on how we can make Align better</p>
              </div>
            </div>

            {feedbackSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-serif text-lg text-gray-900 mb-1">Thanks for your feedback!</h3>
                <p className="text-sm text-gray-500 mb-5">We read every suggestion and use them to improve Align.</p>
                <Button variant="outline" size="sm" onClick={() => setFeedbackSent(false)} className="text-xs">
                  Submit more feedback
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What would make Align better for you? Any features, changes, or ideas are welcome."
                  rows={4}
                  disabled={feedbackMutation.isPending}
                  className="resize-none bg-gray-50 border-gray-200 text-sm"
                  data-testid="input-feedback"
                />
                {feedbackMutation.isError && (
                  <p className="text-red-500 text-xs">Failed to send. Please try again.</p>
                )}
                <Button
                  onClick={() => feedbackMutation.mutate()}
                  disabled={!feedback.trim() || feedbackMutation.isPending}
                  size="sm"
                  className="bg-gray-900 text-white hover:bg-black"
                  data-testid="button-send-feedback"
                >
                  {feedbackMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {feedbackMutation.isPending ? "Sending..." : "Submit Feedback"}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <SiteFooter hideNewsletter />
    </div>
  );
}
