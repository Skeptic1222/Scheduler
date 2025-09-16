import { useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications"],
    queryParams: { unread_only: "true" },
    select: (data) => data.notifications || [],
    retry: false, // Don't retry on 401
  });

  const { data: adminData } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled: user?.role === "admin",
    select: (data) => data || {},
    retry: false,
  });

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
          userRole={user?.role || 'admin'}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        
        <main className="flex-1 overflow-auto lg:ml-64">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}