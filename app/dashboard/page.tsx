"use client";

import { useAuth } from "@/app/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard() {
  const { authState, signOut, hasRole } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header Section with Greeting */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {authState.profile?.display_name || "User"}!</h1>
            <p className="mt-2 text-indigo-100">
              Here's your dashboard overview for today
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            {hasRole("admin") && (
              <Link href="/admin">
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1">
        {/* User Information Card */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="font-semibold">{authState.user?.email}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Display Name:</span>
                  <span className="font-semibold">{authState.profile?.display_name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Role:</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-medium">
                    {authState.profile?.role || "user"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Account Created:</span>
                  <span className="font-semibold">{authState.profile?.created_at ? new Date(authState.profile.created_at).toLocaleDateString() : ""}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}