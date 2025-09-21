import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import AdminPanel from "@/pages/admin";
import Shifts from "@/pages/shifts";
import FCFSQueue from "@/pages/fcfs-queue";
import CreateShift from "@/pages/create-shift";
import MyShifts from "@/pages/my-shifts";
import Staff from "@/pages/staff";
import Departments from "@/pages/departments";
import OnCall from "@/pages/on-call";
import Audit from "@/pages/audit";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function LoginSplashPage() {
  const { login, loginDev } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // Load Google OAuth script
    const loadGoogleScript = async () => {
      try {
        if (window.google) return;
        
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        script.onload = () => {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              callback: handleGoogleResponse,
              auto_select: false,
              cancel_on_tap_outside: true
            });
          }
        };
      } catch (error) {
        console.error('Failed to load Google OAuth:', error);
      }
    };
    
    loadGoogleScript();
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setIsGoogleLoading(true);
    try {
      await login(response.credential);
    } catch (error) {
      console.error('Google login failed:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-hospital text-primary-foreground text-2xl"></i>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900">Hospital Scheduler</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">FCFS Distribution System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Welcome to Your Shift Management Platform</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <i className="fas fa-calendar-alt text-primary"></i>
                <span>Fair Shift Distribution</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-users text-primary"></i>
                <span>Real-time Collaboration</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock text-primary"></i>
                <span>On-Call Management</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-shield-alt text-primary"></i>
                <span>HIPAA Compliant</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm flex items-center justify-center space-x-3"
                data-testid="button-google-signin"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm font-medium">Sign in with Google</span>
                  </>
                )}
              </Button>
              
              {import.meta.env.DEV && loginDev && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 text-center mb-2">Development Mode</p>
                  <Button 
                    onClick={loginDev} 
                    variant="outline"
                    className="w-full text-sm"
                    data-testid="button-dev-login"
                  >
                    Dev Login (Test Account)
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure authentication powered by Google OAuth 2.0<br/>
              HIPAA compliant • Enterprise security
            </p>
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

  // Show login splash page if no user
  if (!user) {
    return <LoginSplashPage />;
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
        <Route path="/on-call" component={OnCall} />
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
