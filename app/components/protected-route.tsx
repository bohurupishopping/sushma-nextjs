"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import { UserRole } from "@/types/user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute = ({ 
  children, 
  requiredRoles = ["user", "admin", "salesman", "worker", "dealer"]
}: ProtectedRouteProps) => {
  const { authState, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If still loading, don't do anything yet
    if (authState.isLoading) return;

    // If not authenticated, redirect to sign-in
    if (!authState.user) {
      router.push("/auth/sign-in");
      return;
    }

    // If authenticated but doesn't have required role, redirect to dashboard
    if (!hasRole(requiredRoles)) {
      router.push("/dashboard");
    }
  }, [authState, router, requiredRoles, hasRole]);

  // Show nothing while loading or if not authenticated
  if (authState.isLoading || !authState.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If authenticated and has required role, show children
  if (hasRole(requiredRoles)) {
    return <>{children}</>;
  }

  // Otherwise show nothing (should redirect)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}; 