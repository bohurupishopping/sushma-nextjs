"use client";

import { useAuth } from "@/app/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, TrendingUp, DollarSign, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stats = [
  {
    title: "Total Users",
    value: "1,234",
    icon: Users,
    trend: "+12.5%",
    description: "vs. last month",
  },
  {
    title: "Active Now",
    value: "321",
    icon: Activity,
    trend: "+8.1%",
    description: "vs. last hour",
  },
  {
    title: "Revenue",
    value: "$12,345",
    icon: DollarSign,
    trend: "+23.1%",
    description: "vs. last month",
  },
  {
    title: "Growth",
    value: "89.2%",
    icon: TrendingUp,
    trend: "+4.3%",
    description: "vs. last quarter",
  },
];

export default function Dashboard() {
  const { authState, signOut, hasRole } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back, {authState.profile?.display_name || "User"}! Here's an overview of your statistics.
          </p>
        </div>
        <div className="flex space-x-4">
          {hasRole("admin") && (
            <Link href="/admin">
              <Button variant="outline" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-sm text-green-500">
                  {stat.trend}
                  <span className="ml-2 text-gray-500">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span>{authState.user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Display Name:</span>
              <span>{authState.profile?.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Role:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {authState.profile?.role || "user"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Account Created:</span>
              <span>{authState.profile?.created_at ? new Date(authState.profile.created_at).toLocaleDateString() : ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}