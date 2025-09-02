'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Header from './Header';

export interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
        setMobileSidebarOpen(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!isMobile || !mobileSidebarOpen) return;
      const sidebar = document.getElementById('mobile-sidebar');
      const target = e.target as Node;
      if (sidebar && !sidebar.contains(target)) setMobileSidebarOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isMobile, mobileSidebarOpen]);

  const toggleSidebar = () => {
    if (isMobile) setMobileSidebarOpen((v) => !v);
    else setSidebarCollapsed((v) => !v);
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner h-12 w-12" />
          <p className="text-muted-foreground text-lg">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to access the application.</p>
        </div>
      </div>
    );
  }

  // Tailwind widths that we’ll mirror on main margin
  const desktopSidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';
  const desktopMainMargin = sidebarCollapsed ? 'ml-16' : 'ml-64';

  return (
    <div className={cn('min-h-dvh bg-background', className)}>
      {/* Backdrop for mobile */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar (fixed on desktop, slide-in on mobile) */}
      <aside
        id="mobile-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 h-dvh border-r bg-card transition-transform duration-300 ease-in-out',
          desktopSidebarWidth,
          isMobile ? (mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
        )}
      >
        <Sidebar
          isCollapsed={isMobile ? false : sidebarCollapsed}
          onToggleCollapse={isMobile ? undefined : () => setSidebarCollapsed((v) => !v)}
          className="h-full"
        />
      </aside>

      {/* Main content (leave room for fixed sidebar on desktop) */}
      <div
        className={cn(
          'min-h-dvh flex flex-col transition-[margin] duration-300 ease-in-out',
          !isMobile && desktopMainMargin
        )}
      >
        <Header onMenuToggle={toggleSidebar} showMenuButton={isMobile} />

        <main id="main-content" role="main" className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="container mx-auto p-4 space-y-6">{children}</div>
          </div>
        </main>
      </div>

      {/* Optional second backdrop for smoother animations (kept but harmless) */}
      {isMobile && (
        <div
          className={cn(
            'fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden',
            mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        />
      )}
    </div>
  );
};

export default MainLayout;
