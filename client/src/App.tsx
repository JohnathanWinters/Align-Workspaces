import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
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
import { useAnalytics } from "@/hooks/use-analytics";

function BuildMyPhoto() {
  return <HomePage autoStart />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AlignSpacesPage} />
      <Route path="/workspaces" component={SpacesBrowsePage} />
      <Route path="/spaces/:slug" component={SpaceDetailPage} />
      <Route path="/portrait-builder" component={BuildMyPhoto} />
      <Route path="/portfolio" component={PortfolioPage} />
      <Route path="/our-vision" component={AboutPage} />
      <Route path="/portal" component={PortalPage} />
      <Route path="/featured/:slug" component={FeaturedPage} />
      <Route path="/featured" component={FeaturedPage} />
      <Route path="/admin" component={AdminPage} />
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
  useAnalytics();
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AnalyticsWrapper>
            <Toaster />
            <Router />
          </AnalyticsWrapper>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
