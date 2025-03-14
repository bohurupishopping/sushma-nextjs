"use client";

import { useAuth } from "@/app/context/auth-context";
import { ProtectedRoute } from "@/app/components/protected-route";
import { AdminSidebar } from "@/app/components/admin-sidebar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DownloadIcon, 
  FilterIcon, 
  PlusIcon, 
  SearchIcon 
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Mock data for orders
const orders = [
  {
    id: "ORD-001",
    customer: "John Smith",
    date: "2023-06-12",
    status: "completed",
    total: "$245.99",
  },
  {
    id: "ORD-002",
    customer: "Sarah Johnson",
    date: "2023-06-14",
    status: "processing",
    total: "$129.50",
  },
  {
    id: "ORD-003",
    customer: "Michael Brown",
    date: "2023-06-15",
    status: "pending",
    total: "$432.25",
  },
  {
    id: "ORD-004",
    customer: "Emily Davis",
    date: "2023-06-16",
    status: "completed",
    total: "$76.00",
  },
  {
    id: "ORD-005",
    customer: "Robert Wilson",
    date: "2023-06-17",
    status: "cancelled",
    total: "$198.75",
  },
];

export default function OrdersPage() {
  const { authState } = useAuth();

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex h-screen">
        {/* Admin Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Orders</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage and track all orders in the system
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <Button className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  New Order
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search orders..." 
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FilterIcon className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.date}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                order.status === "completed" ? "outline" : 
                                order.status === "processing" ? "default" :
                                order.status === "pending" ? "secondary" : "destructive"
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{order.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 