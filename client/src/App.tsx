import { Component, type ReactNode } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import PricingPage from "@/pages/host-pricing";
import HomePage from "@/pages/home";
import PortfolioPage from "@/pages/portfolio";
import AboutPage from "@/pages/photographers";
import PortalPage from "@/pages/portal";
import AdminPage from "@/pages/admin";
import EmployeePage from "@/pages/employee";
import FeaturedPage from "@/pages/featured";
import AlignSpacesPage from "@/pages/align-spaces";
import SpacesBrowsePage from "@/pages/spaces-browse";
import SpaceDetailPage from "@/pages/space-detail";
import SupportPage from "@/pages/support";
import EventDetailPage from "@/pages/event-detail";
import PortraitLandingPage from "@/pages/portrait-landing";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import TrustPage from "@/pages/trust";
import BookMeetingPage from "@/pages/book-meeting";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import GlobalMessenger from "@/components/global-messenger";

function PortraitsPage() {
  return <HomePage />;
}

function BuildMyPhoto() {
  return <HomePage autoStart />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AlignSpacesPage} />
      <Route path="/workspaces" component={SpacesBrowsePage} />
      <Route path="/spaces/:slug" component={SpaceDetailPage} />
      <Route path="/portraits" component={PortraitsPage} />
      <Route path="/portrait-builder" component={BuildMyPhoto} />
      <Route path="/portfolio" component={PortfolioPage} />
      <Route path="/our-vision" component={AboutPage} />
      <Route path="/events/:id" component={EventDetailPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/trust" component={TrustPage} />
      <Route path="/portal" component={PortalPage} />
      <Route path="/featured/:slug" component={FeaturedPage} />
      <Route path="/featured" component={FeaturedPage} />
      <Route path="/book/:slug" component={BookMeetingPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/host-pricing">{() => { window.location.replace("/pricing"); return null; }}</Route>
      <Route path="/team" component={EmployeePage} />
      <Route path="/auth-success">{() => {
        if (window.opener) { window.close(); }
        return <div className="flex items-center justify-center min-h-screen text-gray-500">Authentication successful. You can close this window.</div>;
      }}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  useAnalytics(user?.id);
  return <>{children}</>;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-serif text-2xl text-stone-800">Something went wrong</h1>
          <p className="text-sm text-stone-500 max-w-sm">An unexpected error occurred. Please refresh the page to try again.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }}
            className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AnalyticsWrapper>
              <Toaster />
              <Router />
              <GlobalMessenger />
            </AnalyticsWrapper>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
