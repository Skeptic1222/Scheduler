import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { StatusCard } from "@/components/ui/status-card";
import { FCFSQueue } from "@/components/fcfs-queue";
import { ShiftForm } from "@/components/shift-form";
import { ShiftsTable } from "@/components/shifts-table";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Real-time socket connection
  const { isConnected, lastMessage } = useSocket();

  // Fetch dashboard data
  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ["/api/shifts"],
    select: (data) => data.shifts || []
  });

  const { data: fcfsData, isLoading: fcfsLoading } = useQuery({
    queryKey: ["/api/fcfs-queue"],
    select: (data) => data.queue || []
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications"],
    queryParams: { unread_only: "true" },
    select: (data) => data.notifications || []
  });

  const { data: adminData } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled: user?.role === "admin",
    select: (data) => data || {}
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage);
      
      switch (message.type) {
        case 'shift_created':
          queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
          toast({
            title: "New Shift Available",
            description: `${message.shift.title} has been created`,
          });
          break;
        case 'fcfs_response':
          queryClient.invalidateQueries({ queryKey: ["/api/fcfs-queue"] });
          break;
      }
    }
  }, [lastMessage, queryClient, toast]);

  const availableShifts = shiftsData?.filter((shift: any) => shift.status === 'available') || [];
  const activeQueue = fcfsData?.filter((entry: any) => entry.status === 'pending') || [];
  const unreadNotifications = notificationsData?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user}
        notificationCount={unreadNotifications}
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
          {/* Dashboard Header */}
          <div className="p-6 border-b border-border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Shift Management Dashboard</h1>
                <p className="text-muted-foreground">Real-time FCFS distribution and staff scheduling</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button 
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center space-x-2"
                  data-testid="button-create-shift"
                >
                  <i className="fas fa-plus"></i>
                  <span>Create Shift</span>
                </button>
                <button 
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium hover:bg-secondary/90 flex items-center space-x-2"
                  onClick={() => queryClient.invalidateQueries()}
                  data-testid="button-refresh"
                >
                  <i className="fas fa-sync-alt"></i>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatusCard
                title="Database Status"
                value={adminData?.database?.status === 'connected' ? 'Online' : 'Offline'}
                subtitle={`PostgreSQL ${adminData?.database?.status === 'connected' ? 'connected' : 'disconnected'}`}
                icon="fas fa-database"
                status={adminData?.database?.status === 'connected' ? 'success' : 'error'}
                data-testid="card-database-status"
              />
              
              <StatusCard
                title="Real-time Updates"
                value={isConnected ? 'Active' : 'Disconnected'}
                subtitle={`${adminData?.realtime?.connections || 0} connections`}
                icon="fas fa-wifi"
                status={isConnected ? 'success' : 'error'}
                data-testid="card-realtime-status"
              />
              
              <StatusCard
                title="FCFS Queue"
                value={activeQueue.length.toString()}
                subtitle="Pending assignments"
                icon="fas fa-hourglass-half"
                status={activeQueue.length > 0 ? 'warning' : 'success'}
                data-testid="card-fcfs-queue"
              />
              
              <StatusCard
                title="Authentication"
                value="Verified"
                subtitle="Google OAuth active"
                icon="fab fa-google"
                status="success"
                data-testid="card-auth-status"
              />
            </div>

            {/* FCFS Queue Management */}
            <FCFSQueue 
              queue={activeQueue}
              isLoading={fcfsLoading}
              onResponse={(queueId: string, response: 'accept' | 'decline') => {
                // Handle FCFS response
                console.log('FCFS Response:', queueId, response);
              }}
            />

            {/* Shift Creation Form */}
            {(['admin', 'supervisor'].includes(user?.role || '')) && (
              <ShiftForm 
                onSubmit={(shiftData) => {
                  // Handle shift creation
                  console.log('Create shift:', shiftData);
                }}
              />
            )}

            {/* Available Shifts */}
            <ShiftsTable 
              shifts={availableShifts}
              isLoading={shiftsLoading}
              userRole={user?.role || 'staff'}
            />

            {/* Admin Panel Preview */}
            {user?.role === 'admin' && adminData && (
              <div className="bg-card border border-border rounded-lg shadow-sm">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">System Administration</h2>
                  <p className="text-muted-foreground text-sm">Database connections, settings, and system health</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Database Configuration */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-foreground">Database Configuration</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md" data-testid="admin-db-connection">
                          <div>
                            <p className="text-sm font-medium text-foreground">PostgreSQL Connection</p>
                            <p className="text-xs text-muted-foreground">Primary database server</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${adminData.database?.status === 'connected' ? 'bg-success' : 'bg-destructive'}`}></div>
                            <span className={`text-sm ${adminData.database?.status === 'connected' ? 'text-success' : 'text-destructive'}`}>
                              {adminData.database?.status === 'connected' ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Health Metrics */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-foreground">System Health</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Database Response Time</span>
                          <span className="text-sm font-medium text-success" data-testid="text-db-latency">
                            {adminData.database?.latency ? `${adminData.database.latency}ms` : '--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active Socket Connections</span>
                          <span className="text-sm font-medium text-foreground" data-testid="text-socket-connections">
                            {adminData.realtime?.connections || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">FCFS Queue Processing</span>
                          <span className="text-sm font-medium text-success">Optimal</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Authentication Status</span>
                          <span className="text-sm font-medium text-success">Google OAuth Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
