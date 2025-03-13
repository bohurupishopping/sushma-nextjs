"use client";

import { useAuth } from "@/app/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/app/components/protected-route";
import { Shield, Users, Settings } from "lucide-react";

export default function AdminPage() {
  const { authState } = useAuth();

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome, Admin! Here you can manage your application.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                User Management
              </CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Users</div>
              <p className="text-sm text-gray-500 mt-2">
                Manage user accounts, permissions, and roles
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Security
              </CardTitle>
              <Shield className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Permissions</div>
              <p className="text-sm text-gray-500 mt-2">
                Configure security settings and access controls
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                System
              </CardTitle>
              <Settings className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Configuration</div>
              <p className="text-sm text-gray-500 mt-2">
                Manage system settings and configurations
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Current user role:</strong> {authState.profile?.role || "Loading..."}
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
} 