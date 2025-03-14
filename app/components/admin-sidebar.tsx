"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  UserCheck, 
  Shield, 
  Settings,
  ChevronDown,
  LogOut,
  Store,
  Briefcase,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/auth-context";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
}

const SidebarNavItem = ({ href, icon, title, isActive }: SidebarNavItemProps) => (
  <Link 
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
      isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
    )}
  >
    {icon}
    <span>{title}</span>
  </Link>
);

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { authState, signOut } = useAuth();
  const [isManagementOpen, setIsManagementOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col border-r bg-background">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight">Admin Panel</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application
        </p>
      </div>
      
      <div className="flex-1 overflow-auto py-2 px-4">
        <nav className="flex flex-col gap-1">
          <SidebarNavItem 
            href="/admin" 
            icon={<LayoutDashboard className="h-4 w-4" />} 
            title="Dashboard" 
            isActive={pathname === "/admin"}
          />
          
          <SidebarNavItem 
            href="/admin/orders" 
            icon={<Package className="h-4 w-4" />} 
            title="Orders" 
            isActive={pathname === "/admin/orders"}
          />
          
          <Collapsible 
            open={isManagementOpen} 
            onOpenChange={setIsManagementOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between px-3 py-2 text-sm font-medium"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isManagementOpen ? "rotate-180" : ""
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-9 space-y-1 pt-1">
              <SidebarNavItem 
                href="/admin/profile" 
                icon={<UserCog className="h-4 w-4" />} 
                title="User Profiles" 
                isActive={pathname === "/admin/profile"}
              />
              <SidebarNavItem 
                href="/admin/dealer" 
                icon={<Store className="h-4 w-4" />} 
                title="Dealers" 
                isActive={pathname === "/admin/dealer"}
              />
              <SidebarNavItem 
                href="/admin/salesman" 
                icon={<UserCheck className="h-4 w-4" />} 
                title="Salesman" 
                isActive={pathname === "/admin/salesman"}
              />
              <SidebarNavItem 
                href="/admin/worker" 
                icon={<Briefcase className="h-4 w-4" />} 
                title="Workers" 
                isActive={pathname === "/admin/worker"}
              />
            </CollapsibleContent>
          </Collapsible>
          
          <SidebarNavItem 
            href="/admin/security" 
            icon={<Shield className="h-4 w-4" />} 
            title="Security" 
            isActive={pathname === "/admin/security"}
          />
          
          <SidebarNavItem 
            href="/admin/settings" 
            icon={<Settings className="h-4 w-4" />} 
            title="Settings" 
            isActive={pathname === "/admin/settings"}
          />
        </nav>
      </div>
      
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {authState.user?.email?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">{authState.user?.email || 'Admin'}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {authState.profile?.role || 'Loading...'}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
  
  function handleSignOut() {
    signOut();
  }
}; 