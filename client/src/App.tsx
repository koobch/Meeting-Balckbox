import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ProjectOverview from "@/pages/project-overview";
import MeetingDetail from "@/pages/meeting-detail";
import MeetingsPage from "@/pages/meetings";
import DecisionsPage from "@/pages/decisions";
import EvidencePage from "@/pages/evidence";
import AskPage from "@/pages/ask";
import { ProjectLayout } from "@/pages/project-layout";

function ProjectRoutes() {
  return (
    <ProjectLayout>
      <Switch>
        <Route path="/projects/:projectId/overview" component={ProjectOverview} />
        <Route path="/projects/:projectId/meetings/:meetingId" component={MeetingDetail} />
        <Route path="/projects/:projectId/meetings" component={MeetingsPage} />
        <Route path="/projects/:projectId/decisions" component={DecisionsPage} />
        <Route path="/projects/:projectId/evidence" component={EvidencePage} />
        <Route component={NotFound} />
      </Switch>
    </ProjectLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/projects/1/overview" />
      </Route>
      <Route path="/projects/:projectId/*">
        <ProjectRoutes />
      </Route>
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
