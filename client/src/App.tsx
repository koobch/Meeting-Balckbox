import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ProjectOverview from "@/pages/project-overview";
import MeetingDetail from "@/pages/meeting-detail";
import AskPage from "@/pages/ask";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/projects/1/overview" />
      </Route>
      <Route path="/projects/:projectId/overview" component={ProjectOverview} />
      <Route path="/projects/:projectId/meetings/:meetingId" component={MeetingDetail} />
      <Route path="/ask" component={AskPage} />
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
