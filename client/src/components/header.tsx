import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { ChevronDown, User, Settings, CreditCard, Shield, LogOut } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  user: any;
  notificationCount: number;
  databaseStatus?: any;
  onMobileMenuToggle: () => void;
}

export function Header({ user, notificationCount, databaseStatus, onMobileMenuToggle }: HeaderProps) {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSignOut = () => {
    logout();
    setIsMenuOpen(false);
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
                <span className="text-white font-bold text-lg">H</span>
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
            <div className="relative">
              <Button 
                variant="ghost" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
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
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50" data-testid="user-dropdown-menu">
                  <div className="px-3 py-2 text-sm font-medium border-b border-border">
                    {user?.name || 'User'}
                  </div>
                  <div className="px-3 py-1 text-xs text-muted-foreground border-b border-border">
                    {user?.email || ''}
                  </div>
                  
                  {user?.role === 'admin' && (
                    <>
                      <button 
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center"
                        data-testid="menu-admin"
                        onClick={() => {
                          setIsMenuOpen(false);
                          window.location.href = '/admin';
                        }}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </button>
                      <div className="border-t border-border" />
                    </>
                  )}
                  
                  <button 
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center"
                    data-testid="menu-settings"
                    onClick={() => {
                      setIsMenuOpen(false);
                      alert('Settings page coming soon!');
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  
                  <button 
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center"
                    data-testid="menu-account"
                    onClick={() => {
                      setIsMenuOpen(false);
                      alert('Account & Billing page coming soon!');
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Account & Billing</span>
                  </button>
                  
                  <button 
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center"
                    data-testid="menu-profile"
                    onClick={() => {
                      setIsMenuOpen(false);
                      alert('Profile page coming soon!');
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  
                  <div className="border-t border-border" />
                  
                  <button 
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center text-destructive"
                    data-testid="menu-signout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
