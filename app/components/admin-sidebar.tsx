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
  UserCog,
  Boxes,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/auth-context";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  badge?: string;
  color?: "default" | "blue" | "green" | "orange" | "purple" | "red";
}

const SidebarNavItem = ({ 
  href, 
  icon, 
  title, 
  isActive, 
  badge, 
  color = "default" 
}: SidebarNavItemProps) => {
  const getColorClasses = () => {
    if (!isActive) return "text-muted-foreground group-hover:text-foreground";
    
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "green":
        return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "orange":
        return "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      case "purple":
        return "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
      case "red":
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-accent text-accent-foreground";
    }
  };

  const getIconColorClasses = () => {
    if (!isActive) return "text-muted-foreground group-hover:text-foreground";
    
    switch (color) {
      case "blue":
        return "text-blue-600 dark:text-blue-400";
      case "green":
        return "text-green-600 dark:text-green-400";
      case "orange":
        return "text-orange-600 dark:text-orange-400";
      case "purple":
        return "text-purple-600 dark:text-purple-400";
      case "red":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-foreground";
    }
  };

  return (
    <Link 
      href={href}
      className={cn(
        "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all",
        isActive ? getColorClasses() : "hover:bg-accent/50",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("transition-colors", getIconColorClasses())}>
          {icon}
        </div>
        <span className="font-medium">{title}</span>
      </div>
      {badge && (
        <Badge variant="outline" className={cn(
          "ml-auto text-xs",
          isActive && color !== "default" ? getIconColorClasses() : ""
        )}>
          {badge}
        </Badge>
      )}
    </Link>
  );
};

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { authState, signOut } = useAuth();
  const [isManagementOpen, setIsManagementOpen] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'A';
    const parts = email.split('@');
    if (parts[0].length > 0) {
      return parts[0].charAt(0).toUpperCase();
    }
    return 'A';
  };

  return (
    <div className="flex h-screen flex-col border-r bg-background">
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
          <span className="text-lg font-bold text-primary-foreground">AP</span>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">
            Manage your application
          </p>
        </div>
      </div>
      
      <Separator className="mb-4" />
      
      <div className="flex-1 overflow-auto py-2 px-4">
        <nav className="flex flex-col gap-1.5">
          <SidebarNavItem 
            href="/admin" 
            icon={<LayoutDashboard className="h-4 w-4" />} 
            title="Dashboard" 
            isActive={pathname === "/admin"}
            color="blue"
          />
          
          <SidebarNavItem 
            href="/admin/orders" 
            icon={<Package className="h-4 w-4" />} 
            title="Orders" 
            isActive={pathname === "/admin/orders"}
            badge="New"
            color="green"
          />
          
          
          
          <Collapsible 
            open={isInventoryOpen} 
            onOpenChange={setIsInventoryOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between px-3 py-2.5 text-sm font-medium group hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Boxes className="h-4 w-4 text-orange-600 dark:text-orange-400 group-hover:text-orange-600" />
                  <span>Inventory</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform text-muted-foreground",
                  isInventoryOpen ? "rotate-180" : ""
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-10 space-y-1 pt-1">
              <SidebarNavItem 
                href="/admin/products" 
                icon={<Package className="h-4 w-4" />} 
                title="Products" 
                isActive={pathname === "/admin/products" || pathname.startsWith("/admin/products/")}
                color="orange"
              />
              <SidebarNavItem 
                href="/admin/price-charts" 
                icon={<FileSpreadsheet className="h-4 w-4" />} 
                title="Price Charts" 
                isActive={pathname === "/admin/price-charts" || pathname.startsWith("/admin/price-charts/")}
                color="orange"
              />
            </CollapsibleContent>
          </Collapsible>
          
         
          
          <Collapsible 
            open={isManagementOpen} 
            onOpenChange={setIsManagementOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between px-3 py-2.5 text-sm font-medium group hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-600" />
                  <span>User Management</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform text-muted-foreground",
                  isManagementOpen ? "rotate-180" : ""
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-10 space-y-1 pt-1">
              <SidebarNavItem 
                href="/admin/profile" 
                icon={<UserCog className="h-4 w-4" />} 
                title="User Profiles" 
                isActive={pathname === "/admin/profile"}
                color="purple"
              />
              <SidebarNavItem 
                href="/admin/dealer" 
                icon={<Store className="h-4 w-4" />} 
                title="Dealers" 
                isActive={pathname === "/admin/dealer"}
                color="purple"
                badge="New"
              />
              <SidebarNavItem 
                href="/admin/salesman" 
                icon={<UserCheck className="h-4 w-4" />} 
                title="Salesman" 
                isActive={pathname === "/admin/salesman"}
                color="purple"
              />
              <SidebarNavItem 
                href="/admin/worker" 
                icon={<Briefcase className="h-4 w-4" />} 
                title="Workers" 
                isActive={pathname === "/admin/worker"}
                color="purple"
              />
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </div>
      
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-accent/50">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(authState.user?.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium line-clamp-1">{authState.user?.email || 'Admin'}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-1 py-0 h-5 capitalize">
                {authState.profile?.role || 'Loading...'}
              </Badge>
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            </div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20" 
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