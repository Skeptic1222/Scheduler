import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      section: "Dashboard",
      items: [
        { href: "/", icon: "fas fa-tachometer-alt", label: "Overview", roles: ["admin", "supervisor", "staff"] }
      ]
    },
    {
      section: "Shift Management",
      items: [
        { href: "/shifts/create", icon: "fas fa-calendar-plus", label: "Create Shift", roles: ["admin", "supervisor"] },
        { href: "/shifts", icon: "fas fa-list", label: "Available Shifts", roles: ["admin", "supervisor", "staff"] },
        { href: "/fcfs-queue", icon: "fas fa-clock", label: "FCFS Queue", roles: ["admin", "supervisor", "staff"] },
        { href: "/my-shifts", icon: "fas fa-user-check", label: "My Shifts", roles: ["admin", "supervisor", "staff"] }
      ]
    },
    {
      section: "Staff Management",
      items: [
        { href: "/staff", icon: "fas fa-users", label: "Staff Directory", roles: ["admin", "supervisor"] },
        { href: "/departments", icon: "fas fa-building", label: "Departments", roles: ["admin", "supervisor"] }
      ]
    },
    {
      section: "System",
      items: [
        { href: "/admin", icon: "fas fa-cogs", label: "Admin Panel", roles: ["admin"] },
        { href: "/audit", icon: "fas fa-shield-alt", label: "HIPAA Audit", roles: ["admin", "supervisor"] },
        { href: "/reports", icon: "fas fa-chart-bar", label: "Reports", roles: ["admin", "supervisor"] }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const canAccess = (roles: string[]) => roles.includes(userRole);

  const content = (
    <nav className="p-4 space-y-2">
      {navigationItems.map((section) => (
        <div key={section.section} className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {section.section}
          </h2>
          <div className="space-y-1">
            {section.items
              .filter(item => canAccess(item.roles))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={onClose}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.label}</span>
                  {item.label === "FCFS Queue" && (
                    <span className="ml-auto bg-warning text-warning-foreground text-xs px-2 py-1 rounded-full">
                      3
                    </span>
                  )}
                </Link>
              ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card border-r border-border shadow-sm hidden lg:block" data-testid="sidebar-desktop">
        {content}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" data-testid="mobile-overlay">
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-card shadow-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <button 
                onClick={onClose} 
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-close-mobile-menu"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
