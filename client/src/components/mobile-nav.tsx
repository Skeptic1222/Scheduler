import { Link, useLocation } from "wouter";
import { Home, Calendar, Users, Settings, UserCheck, ClipboardList, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  userRole: string;
}

export function MobileNav({ userRole }: MobileNavProps) {
  const [location] = useLocation();
  
  const navItems = [
    {
      href: "/",
      label: "Overview",
      icon: Home,
      roles: ["admin", "supervisor", "staff"]
    },
    {
      href: "/shifts",
      label: "Shifts",
      icon: Calendar,
      roles: ["admin", "supervisor", "staff"]
    },
    {
      href: "/my-shifts",
      label: "My Shifts",
      icon: ClipboardList,
      roles: ["admin", "supervisor", "staff"]
    },
    {
      href: "/staff",
      label: "Staff",
      icon: Users,
      roles: ["admin", "supervisor"]
    },
    {
      href: "/on-call",
      label: "On-Call",
      icon: UserCheck,
      roles: ["admin", "supervisor", "staff"]
    }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="truncate">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}