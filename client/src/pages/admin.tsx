import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { StatusCard } from "@/components/ui/status-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export default function AdminPanel() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const { data: adminData, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled: user?.role === "admin"
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications"],
    queryParams: { unread_only: "true" },
    select: (data) => data.notifications || []
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-shield-alt text-4xl text-destructive mb-4"></i>
              <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
              <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user}
        notificationCount={notificationsData?.length || 0}
        databaseStatus={adminData?.database}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      
      <div className="flex">
        <Sidebar 
          userRole={user?.role || 'staff'}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">System Administration</h1>
                <p className="text-muted-foreground">Database connections, settings, and system health</p>
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh Status
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* System Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatusCard
                title="Database"
                value={adminData?.database?.status === 'connected' ? 'Online' : 'Offline'}
                subtitle={`${adminData?.database?.type || 'PostgreSQL'} Server`}
                icon="fas fa-database"
                status={adminData?.database?.status === 'connected' ? 'success' : 'error'}
                data-testid="admin-card-database"
              />
              
              <StatusCard
                title="WebSocket"
                value={adminData?.realtime?.status === 'active' ? 'Active' : 'Inactive'}
                subtitle={`${adminData?.realtime?.connections || 0} connections`}
                icon="fas fa-wifi"
                status={adminData?.realtime?.status === 'active' ? 'success' : 'error'}
                data-testid="admin-card-websocket"
              />
              
              <StatusCard
                title="FCFS Engine"
                value={adminData?.fcfs?.status === 'operational' ? 'Operational' : 'Error'}
                subtitle="Queue processing"
                icon="fas fa-cogs"
                status={adminData?.fcfs?.status === 'operational' ? 'success' : 'error'}
                data-testid="admin-card-fcfs"
              />
              
              <StatusCard
                title="Authentication"
                value={adminData?.auth?.status === 'active' ? 'Active' : 'Inactive'}
                subtitle={adminData?.auth?.provider || 'Google OAuth'}
                icon="fab fa-google"
                status={adminData?.auth?.status === 'active' ? 'success' : 'error'}
                data-testid="admin-card-auth"
              />
            </div>

            {/* Database Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Database Configuration</CardTitle>
                <CardDescription>PostgreSQL connection and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Connection Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md" data-testid="admin-db-primary">
                        <div>
                          <p className="text-sm font-medium text-foreground">Primary Database</p>
                          <p className="text-xs text-muted-foreground">PostgreSQL Server</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            adminData?.database?.status === 'connected' ? 'bg-success' : 'bg-destructive'
                          }`}></div>
                          <span className={`text-sm ${
                            adminData?.database?.status === 'connected' ? 'text-success' : 'text-destructive'
                          }`}>
                            {adminData?.database?.status === 'connected' ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Response Time</span>
                        <span className="text-sm font-medium" data-testid="admin-db-response-time">
                          {adminData?.database?.latency ? `${adminData.database.latency}ms` : '--'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Connection Pool</span>
                        <span className="text-sm font-medium text-success">Healthy</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Migration Status</span>
                        <span className="text-sm font-medium text-success">Up to date</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Database Migration</p>
                      <p className="text-xs text-muted-foreground">
                        Successfully migrated from SQL Server to PostgreSQL
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        className="text-sm"
                        data-testid="button-view-logs"
                      >
                        View Logs
                      </Button>
                      <Button 
                        variant="outline"
                        className="text-sm"
                        data-testid="button-run-diagnostics"
                      >
                        Run Diagnostics
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Logs */}
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Recent system activity and audit trail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-muted/30 p-3 rounded-md h-12"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">
                        System logs would be displayed here in a production environment
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        data-testid="button-refresh-logs"
                      >
                        Refresh Logs
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
