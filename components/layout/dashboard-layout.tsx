'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageTransition } from '@/components/ui/page-transition';
import { useUserInfo } from '@/hooks/use-user-info';
import { cn } from '@/lib/utils';
import {
    Bell,
    Car,
    DollarSign,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Package,
    Percent,
    Settings,
    Sun,
    User,
    Users,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [authorities, setAuthorities] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  // Use cached user info hook
  const { data: userInfo } = useUserInfo();

  const navigation = [
    { 
      name: t('nav.dashboard'), 
      href: '/dashboard', 
      icon: LayoutDashboard,
      permission: null // Dashboard is always accessible
    },
    { 
      name: t('nav.vehicles'), 
      href: '/vehicles', 
      icon: Car,
      permission: 'CAR_READ'
    },
    { 
      name: t('nav.bookings'), 
      href: '/bookings', 
      icon: FileText,
      permission: 'BOOKING_READ'
    },
    { 
      name: t('nav.offerings'), 
      href: '/offerings', 
      icon: Package,
      permission: 'OFFERING_READ'
    },
    { 
      name: t('nav.discounts'), 
      href: '/discounts', 
      icon: Percent,
      permission: 'DISCOUNT_READ'
    },
    { 
      name: t('nav.packages'), 
      href: '/packages', 
      icon: Package,
      permission: 'PACKAGE_READ'
    },
    { 
      name: t('nav.team'), 
      href: '/team', 
      icon: Users,
      permission: 'USER_READ'
    },
    { 
      name: t('nav.payments'), 
      href: '/payments', 
      icon: DollarSign,
      permission: 'PAYMENT_READ'
    },
    { 
      name: t('nav.settings'), 
      href: '/settings', 
      icon: Settings,
      permission: null // Settings is always accessible
    },
  ];

  useEffect(() => {
    setMounted(true);

    // Fetch session for user display
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn && data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  // Update authorities when userInfo changes
  useEffect(() => {
    if (userInfo?.authorities) {
      console.log('[Dashboard Layout] User authorities from cache:', userInfo.authorities);
      setAuthorities(userInfo.authorities);
    }
  }, [userInfo]);

  const hasPermission = (permission: string | null): boolean => {    if (permission === null) return true; // Always show items without permission requirement
    if (authorities.length === 0) return false; // No authorities loaded yet
    
    // Check if user has admin or manager roles (they have access to everything)
    const hasAdminAccess = authorities.some(auth => 
      auth === 'ROLE_MERCHANT_ADMIN' || 
      auth === 'MERCHANT_ADMIN' ||
      auth === 'ROLE_MERCHANT_MANAGER' ||
      auth === 'MERCHANT_MANAGER'
    );
    
    if (hasAdminAccess) return true;
    
    // Check if user has the exact permission or the ROLE_ prefixed version
    const hasPermissionCheck = authorities.some(auth => 
      auth === permission || 
      auth === `ROLE_${permission}`
    );
    
    console.log(`[Dashboard Layout] Checking permission "${permission}":`, hasPermissionCheck);
    
    return hasPermissionCheck;
  };

  const filteredNavigation = navigation.filter(item => hasPermission(item.permission));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="text-xl font-bold text-primary">Fleetros</span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="space-y-1 px-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow border-r bg-card">
          <div className="flex h-16 items-center px-4">
            <span className="text-xl font-bold text-primary">Fleetros</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-card px-4 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || ''}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? t('nav.logout') + '...' : t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
