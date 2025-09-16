import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import Dashboard from "@/pages/dashboard";
import AdminPanel from "@/pages/admin";
import Shifts from "@/pages/shifts";
import FCFSQueue from "@/pages/fcfs-queue";
import CreateShift from "@/pages/create-shift";
import MyShifts from "@/pages/my-shifts";
import Staff from "@/pages/staff";
import Departments from "@/pages/departments";
import Audit from "@/pages/audit";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/shifts" component={Shifts} />
        <Route path="/fcfs-queue" component={FCFSQueue} />
        <Route path="/shifts/create" component={CreateShift} />
        <Route path="/my-shifts" component={MyShifts} />
        <Route path="/staff" component={Staff} />
        <Route path="/departments" component={Departments} />
        <Route path="/audit" component={Audit} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
