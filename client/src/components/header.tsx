import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { ChevronDown, User, Settings, CreditCard, Shield, LogOut } from "lucide-react";

interface HeaderProps {
  user: any;
  notificationCount: number;
  databaseStatus?: any;
  onMobileMenuToggle: () => void;
}

export function Header({ user, notificationCount, databaseStatus, onMobileMenuToggle }: HeaderProps) {
  const { logout } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSignOut = () => {
    logout();
  };

  return (
    <header className="bg-card border-b border-border shadow-sm" data-testid="header">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              data-testid="button-mobile-menu"
            >
              <i className="fas fa-bars text-xl"></i>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-hospital text-primary-foreground"></i>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Hospital Scheduler</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">FCFS Distribution System</p>
              </div>
            </div>
          </div>

          {/* Database Status & User Actions */}
          <div className="flex items-center space-x-4">
            {/* Database Connection Status */}
            <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-md" data-testid="database-status">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  databaseStatus?.status === 'connected' ? 'bg-success' : 'bg-destructive'
                }`}></div>
                <span className="text-sm font-medium hidden sm:inline">
                  {databaseStatus?.type || 'PostgreSQL'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground hidden md:inline" data-testid="text-database-latency">
                {databaseStatus?.latency ? `${databaseStatus.latency}ms` : '--'}
              </span>
            </div>

            {/* Real-time Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 text-muted-foreground hover:text-foreground"
                data-testid="button-notifications"
              >
                <i className="fas fa-bell text-xl"></i>
                {notificationCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full notification-dot"
                    data-testid="notification-indicator"
                  ></span>
                )}
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-3 h-auto p-2 hover:bg-muted" 
                  data-testid="button-user-menu"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium" data-testid="text-user-name">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Staff'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium" data-testid="text-user-initials">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" data-testid="user-dropdown-menu">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user?.name || 'User'}
                </div>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {user?.email || ''}
                </div>
                <DropdownMenuSeparator />
                
                {user?.role === 'admin' && (
                  <>
                    <DropdownMenuItem data-testid="menu-admin">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem data-testid="menu-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem data-testid="menu-account">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Account & Billing</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem data-testid="menu-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive" 
                  data-testid="menu-signout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
