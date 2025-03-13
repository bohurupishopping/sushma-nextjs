"use client";

import { Sidebar } from "@/components/sidebar";
import { ProtectedRoute } from "@/app/components/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}