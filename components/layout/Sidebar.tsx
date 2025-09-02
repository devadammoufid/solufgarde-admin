'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  FileText,
  CreditCard,
  Bell,
  BarChart3,
  Settings,
  UserPlus,
  Briefcase,
  Clock,
  MapPin,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  roles?: Array<'admin' | 'client' | 'remplacant'>;
  description?: string;
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Overview and insights',
  },
  {
    title: 'Staff Management',
    href: '/staff',
    icon: Users,
    roles: ['admin', 'client'],
    description: 'Manage staff and substitutes',
  },
  {
    title: 'Garderies',
    href: '/garderies',
    icon: Building2,
    roles: ['admin'],
    description: 'Manage daycare centers',
  },
  {
    title: 'Job Offers',
    href: '/job-offers',
    icon: Briefcase,
    roles: ['admin', 'client'],
    description: 'Create and manage job postings',
  },
  {
    title: 'Applications',
    href: '/applications',
    icon: UserPlus,
    description: 'View and manage applications',
  },
  {
    title: 'Schedules',
    href: '/schedules',
    icon: Calendar,
    description: 'Weekly planning and attendance',
  },
  {
    title: 'Timesheets',
    href: '/timesheets',
    icon: Clock,
    description: 'Track working hours',
  },
  {
    title: 'Availability',
    href: '/availability',
    icon: MapPin,
    roles: ['remplacant'],
    description: 'Manage your availability',
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: CreditCard,
    description: 'Payment and billing',
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    description: 'Communication center',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin', 'client'],
    description: 'Analytics and insights',
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: '3',
    description: 'Alerts and reminders',
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account and preferences',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  className,
}) => {
  const pathname = usePathname();
  const { user, role, isAdmin, isClient, isRemplacant } = useAuth();

  const filterItemsByRole = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(role as any);
    });
  };

  const isActiveRoute = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const filteredMainItems = filterItemsByRole(navigationItems);
  const filteredBottomItems = filterItemsByRole(bottomNavItems);

  return (
    <div
      className={cn(
        "relative flex flex-col bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Solugarde</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg mx-auto">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
        )}

        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "h-8 w-8",
              isCollapsed && "absolute -right-3 top-4 bg-background border border-border shadow-sm"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className={cn(
          "flex items-center space-x-3",
          isCollapsed && "justify-center space-x-0"
        )}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatarUrl} alt={user?.firstName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {role}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2 space-y-1">
          {filteredMainItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    isCollapsed && "justify-center space-x-0"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary text-primary-foreground"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-2 border-t border-border">
        {filteredBottomItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  isCollapsed && "justify-center space-x-0"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.title}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;