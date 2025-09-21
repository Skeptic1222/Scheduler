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

  const handleGoogleResponse = async (token: string) => {
    setIsGoogleLoading(true);
    try {
      await login(token);
    } catch (error) {
      console.error('Google login failed:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    // Load Google OAuth script with login callback
    const loadGoogleScript = async () => {
      try {
        const { initializeGoogleAuth } = await import('@/lib/auth');
        await initializeGoogleAuth(handleGoogleResponse);
        
        // Render the Google Sign-In button
        setTimeout(() => {
          if (window.google) {
            const buttonContainer = document.getElementById('google-signin-button');
            if (buttonContainer) {
              window.google.accounts.id.renderButton(
                buttonContainer,
                {
                  theme: 'outline',
                  size: 'large',
                  width: '320',
                  text: 'signin_with',
                  shape: 'rectangular'
                }
              );
            }
          }
        }, 500);
      } catch (error) {
        console.error('Failed to load Google OAuth:', error);
      }
    };
    
    loadGoogleScript();
  }, []);


  const handleGoogleSignIn = () => {
    if (window.google) {
      console.log('Google object available, rendering button...');
      // Clear any existing Google buttons
      const existingButton = document.getElementById('google-signin-button');
      if (existingButton) {
        existingButton.innerHTML = '';
        window.google.accounts.id.renderButton(
          existingButton,
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular'
          }
        );
      }
    } else {
      console.error('Google object not available');
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
              {/* Google Sign-In Button Container */}
              <div className="w-full">
                <div 
                  id="google-signin-button" 
                  className="w-full flex justify-center"
                  data-testid="button-google-signin"
                ></div>
                
                {!import.meta.env.DEV && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Google Sign-In Configuration:</strong> If the button above doesn't work, your Google OAuth settings may need more time to propagate (5-10 minutes).
                    </p>
                  </div>
                )}
              </div>
              
              {import.meta.env.DEV && loginDev && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 text-center mb-2">Development Mode - Google OAuth Setup in Progress</p>
                  <Button 
                    onClick={loginDev} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="button-dev-login"
                  >
                    Continue with Development Login
                  </Button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Use this while Google OAuth configuration propagates
                  </p>
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
