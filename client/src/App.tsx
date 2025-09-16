import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function DevLoginComponent() {
  const { loginDev } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Hospital Scheduler</CardTitle>
          <CardDescription>Development Mode - Authentication Required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>This application requires authentication to function.</p>
            <p className="mt-2">For development testing, use the button below to login as a test admin user:</p>
          </div>
          <Button 
            onClick={loginDev} 
            className="w-full"
            data-testid="button-dev-login"
          >
            Login as Development Admin
          </Button>
          <div className="text-xs text-gray-500">
            <p>This will create a test admin user (admin@hospital.dev) for development purposes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  const { user, isLoading, loginDev } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-gray-600">Checking authentication status</p>
        </div>
      </div>
    );
  }

  // Show development login if no user and we have the dev login function
  if (!user && loginDev) {
    return <DevLoginComponent />;
  }

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
