import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/portfolio" component={PortfolioPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/portal" component={PortalPage} />
      <Route path="/featured/:slug" component={FeaturedPage} />
      <Route path="/featured" component={FeaturedPage} />
      <Route path="/spaces" component={AlignSpacesPage} />
      <Route path="/spaces/browse" component={SpacesBrowsePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/team" component={EmployeePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
