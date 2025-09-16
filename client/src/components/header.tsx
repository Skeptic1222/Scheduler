import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: any;
  notificationCount: number;
  databaseStatus?: any;
  onMobileMenuToggle: () => void;
}

export function Header({ user, notificationCount, databaseStatus, onMobileMenuToggle }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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
            <div className="flex items-center space-x-3" data-testid="user-menu">
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
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
