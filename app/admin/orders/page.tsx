"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/auth-context";
import { ProtectedRoute } from "@/app/components/protected-route";
import { AdminSidebar } from "@/app/components/admin-sidebar";
import { NewOrderDialog } from "@/app/components/orders/new-order-dialog";
import { OrderDetailsDialog } from "@/app/components/orders/order-details-dialog";
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
  SearchIcon,
  EyeIcon,
  CalendarIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  dealer: {
    id: string;
    name: string;
    dealer_code: string;
  };
  salesman: {
    user_id: string;
    display_name: string;
  };
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
  };
  quantity: number;
  price_per_unit: number;
  total_price: number;
  status: 'processing' | 'production' | 'completed' | 'canceled';
  created_at: string;
  notes: string;
}

export default function OrdersPage() {
  const { authState } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as Order['status'] }
          : order
      ));

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Handle view order
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.dealer.dealer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex h-screen">
        <AdminSidebar />
        
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Orders
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage and track all orders in the system
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <NewOrderDialog />
              </div>
            </div>
            
            <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800">
                <CardTitle className="text-xl font-semibold">All Orders</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                  <div className="relative w-full sm:w-64">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search orders..." 
                      className="pl-8 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <FilterIcon className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                        <TableHead className="font-semibold">Order ID</TableHead>
                        <TableHead className="font-semibold">Dealer</TableHead>
                        <TableHead className="font-semibold">Product</TableHead>
                        <TableHead className="font-semibold">Quantity</TableHead>
                        <TableHead className="font-semibold">Total Price</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2 text-gray-500">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
                              Loading...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow 
                            key={order.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                          >
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{order.dealer.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {order.dealer.dealer_code}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{order.product.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {order.product.unit}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{order.quantity}</TableCell>
                            <TableCell className="font-medium">₹{order.total_price.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  order.status === "completed" ? "outline" : 
                                  order.status === "processing" ? "default" :
                                  order.status === "production" ? "secondary" : "destructive"
                                }
                                className="capitalize"
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <CalendarIcon className="h-4 w-4" />
                                {new Date(order.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewOrder(order)}
                                  className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => handleStatusUpdate(order.id, value)}
                                >
                                  <SelectTrigger className="w-[140px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="production">Production</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="canceled">Canceled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </ProtectedRoute>
  );
} 