"use client";

import { useAuth } from "@/app/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/app/components/protected-route";
import { AdminSidebar } from "@/app/components/admin-sidebar";
import { 
  BarChart3, 
  Package, 
  Users, 
  ArrowUpRight, 
  Activity,
  TrendingUp
} from "lucide-react";

export default function AdminPage() {
  const { authState } = useAuth();

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex h-screen">
        {/* Admin Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Welcome back! Here's an overview of your application.
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Orders
                  </CardTitle>
                  <Package className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,284</div>
                  <div className="flex items-center text-sm text-green-500 mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>12% from last month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Active Distributors
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">48</div>
                  <div className="flex items-center text-sm text-green-500 mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>4 new this week</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Revenue
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$24,563</div>
                  <div className="flex items-center text-sm text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>18% increase</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Active Salesman
                  </CardTitle>
                  <Activity className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32</div>
                  <div className="flex items-center text-sm text-green-500 mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>3 new this week</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New order #{1000 + i} placed</p>
                        <p className="text-xs text-muted-foreground">
                          {i} hour{i !== 1 ? 's' : ''} ago
                        </p>
                      </div>
                      <div className="ml-auto text-sm font-medium">
                        ${Math.floor(Math.random() * 1000) + 100}.00
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* User Role Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Current user role:</strong> {authState.profile?.role || "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 