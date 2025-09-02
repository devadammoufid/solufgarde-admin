'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Users,
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data for charts (in a real app, this would come from the API)
const attendanceData = [
  { name: 'Mon', present: 85, absent: 15 },
  { name: 'Tue', present: 82, absent: 18 },
  { name: 'Wed', present: 88, absent: 12 },
  { name: 'Thu', present: 90, absent: 10 },
  { name: 'Fri', present: 87, absent: 13 },
  { name: 'Sat', present: 45, absent: 5 },
  { name: 'Sun', present: 40, absent: 3 },
];

const revenueData = [
  { name: 'Jan', revenue: 45000, expenses: 32000 },
  { name: 'Feb', revenue: 52000, expenses: 35000 },
  { name: 'Mar', revenue: 48000, expenses: 33000 },
  { name: 'Apr', revenue: 58000, expenses: 38000 },
  { name: 'May', revenue: 55000, expenses: 37000 },
  { name: 'Jun', revenue: 62000, expenses: 40000 },
];

const staffDistributionData = [
  { name: 'Full-time', value: 45, color: '#0ea5e9' },
  { name: 'Part-time', value: 28, color: '#10b981' },
  { name: 'Substitute', value: 18, color: '#f59e0b' },
  { name: 'Inactive', value: 9, color: '#ef4444' },
];

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  description,
}) => {
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={cn(
            "flex items-center text-xs",
            changeType === 'positive' && "text-green-600",
            changeType === 'negative' && "text-red-600",
            changeType === 'neutral' && "text-muted-foreground"
          )}>
            <TrendingUp className={cn(
              "mr-1 h-3 w-3",
              changeType === 'negative' && "rotate-180"
            )} />
            {change}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const { user, role, isAdmin, isClient, isRemplacant } = useAuth();

  // Fetch dashboard data based on user role
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', role],
    queryFn: async () => {
      try {
        // First, test the health endpoint
        await apiClient.health();
        
        // Then fetch dashboard data based on role
        if (isAdmin) {
          return await apiClient.getAdminDashboard();
        } else if (isClient) {
          return await apiClient.getClientDashboard();
        } else if (isRemplacant) {
          return await apiClient.getRemplacantDashboard();
        }
        return null;
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        // Return mock data for demo purposes
        return {
          totalUsers: 150,
          activeStaff: 87,
          totalGarderies: 12,
          pendingApplications: 8,
          todaySchedules: 25,
          unpaidInvoices: 3,
          totalRevenue: 58000,
          thisMonthHours: 2340,
        };
      }
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatsForRole = () => {
    const mockData = dashboardData || {};
    
    if (isAdmin) {
      return [
        {
          title: 'Total Users',
          value: mockData.totalUsers || 150,
          change: '+12.5% from last month',
          changeType: 'positive' as const,
          icon: Users,
          description: 'Active users in the system',
        },
        {
          title: 'Active Garderies',
          value: mockData.totalGarderies || 12,
          change: '+2 new this month',
          changeType: 'positive' as const,
          icon: Building2,
        },
        {
          title: 'Pending Applications',
          value: mockData.pendingApplications || 8,
          change: '-15% from yesterday',
          changeType: 'positive' as const,
          icon: AlertTriangle,
        },
        {
          title: 'Monthly Revenue',
          value: `$${(mockData.totalRevenue || 58000).toLocaleString()}`,
          change: '+18.2% from last month',
          changeType: 'positive' as const,
          icon: DollarSign,
        },
      ];
    } else if (isClient) {
      return [
        {
          title: 'Active Staff',
          value: mockData.activeStaff || 87,
          change: '+5.2% from last week',
          changeType: 'positive' as const,
          icon: Users,
        },
        {
          title: 'Today\'s Schedules',
          value: mockData.todaySchedules || 25,
          icon: Calendar,
        },
        {
          title: 'Unpaid Invoices',
          value: mockData.unpaidInvoices || 3,
          change: 'Due within 7 days',
          changeType: 'negative' as const,
          icon: CreditCard,
        },
        {
          title: 'This Month Hours',
          value: `${(mockData.thisMonthHours || 2340).toLocaleString()}h`,
          change: '+8.1% from last month',
          changeType: 'positive' as const,
          icon: Clock,
        },
      ];
    } else {
      return [
        {
          title: 'Applications Sent',
          value: 12,
          change: '+3 this week',
          changeType: 'positive' as const,
          icon: Activity,
        },
        {
          title: 'Accepted Jobs',
          value: 5,
          icon: CheckCircle,
        },
        {
          title: 'Hours This Month',
          value: '184h',
          change: '+12h from last month',
          changeType: 'positive' as const,
          icon: Clock,
        },
        {
          title: 'Earnings',
          value: '$2,840',
          change: '+15.2% from last month',
          changeType: 'positive' as const,
          icon: DollarSign,
        },
      ];
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          {isAdmin && "Welcome to your admin dashboard. Here's what's happening today."}
          {isClient && "Welcome to your daycare management dashboard."}
          {isRemplacant && "Welcome to your substitute dashboard. Check your latest opportunities."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {getStatsForRole().map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Attendance Chart */}
        {(isAdmin || isClient) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
              <CardDescription>
                Staff attendance for the current week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-green-600">Present: {payload[0].value}</p>
                              <p className="text-red-600">Absent: {payload[1].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="present" 
                      stroke="#0ea5e9" 
                      fillOpacity={1} 
                      fill="url(#colorPresent)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff Distribution */}
        {(isAdmin || isClient) && (
          <Card>
            <CardHeader>
              <CardTitle>Staff Distribution</CardTitle>
              <CardDescription>
                Breakdown by employment type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={staffDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {staffDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revenue Chart (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue and expenses comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === 'revenue' ? 'Revenue' : 'Expenses'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used actions for your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {isAdmin && (
              <>
                <Button className="justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
                <Button className="justify-start" variant="outline">
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Garderie
                </Button>
                <Button className="justify-start" variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
                <Button className="justify-start" variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Process Payments
                </Button>
              </>
            )}
            {isClient && (
              <>
                <Button className="justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Post Job Offer
                </Button>
                <Button className="justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Schedule
                </Button>
                <Button className="justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Approve Timesheets
                </Button>
                <Button className="justify-start" variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Invoices
                </Button>
              </>
            )}
            {isRemplacant && (
              <>
                <Button className="justify-start" variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  Browse Jobs
                </Button>
                <Button className="justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Update Availability
                </Button>
                <Button className="justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Submit Timesheet
                </Button>
                <Button className="justify-start" variant="outline">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  View Applications
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}