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
  CardTitle,
  CardDescription 
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
  CalendarIcon,
  RefreshCwIcon,
  ShoppingCart,
  Package2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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

  // Fetch orders function
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders(data);
      toast({
        title: "Success",
        description: "Orders refreshed successfully",
        variant: "success"
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders",
        icon: <AlertCircle className="h-5 w-5" />
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

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
        variant: "success",
        icon: <CheckCircle2 className="h-5 w-5" />
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
        icon: <XCircle className="h-5 w-5" />
      });
    }
  };

  // Handle view order
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Handle delete order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete order");

      // Update local state
      setOrders(orders.filter(order => order.id !== orderId));

      toast({
        title: "Success",
        description: "Order deleted successfully",
        variant: "success",
        icon: <CheckCircle2 className="h-5 w-5" />
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete order",
        icon: <XCircle className="h-5 w-5" />
      });
    }
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

  // Get status badge styling
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'processing':
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30";
      case 'production':
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30";
      case 'completed':
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30";
      case 'canceled':
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/30";
    }
  };

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex h-screen">
        <AdminSidebar />
        
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-orange-600">Order Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage and track all orders in the system
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={fetchOrders}
                  disabled={loading}
                >
                  <RefreshCwIcon className={cn(
                    "h-4 w-4",
                    loading && "animate-spin"
                  )} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <NewOrderDialog />
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">All Orders</CardTitle>
                  <CardDescription>
                    {filteredOrders.length} orders in the system
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-[200px]">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search orders..." 
                      className="pl-8 w-full rounded-full border-gray-200 dark:border-gray-700"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px] rounded-full border-gray-200 dark:border-gray-700">
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
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                    <h3 className="text-lg font-medium">Loading orders...</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please wait while we fetch the latest orders
                    </p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No orders found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      There are no orders matching your criteria
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 rounded-full"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
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
                        {filteredOrders.map((order) => (
                          <TableRow 
                            key={order.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
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
                            <TableCell className="font-medium">
                              <span className="text-orange-600 dark:text-orange-400">
                                ₹{order.total_price.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "capitalize",
                                  getStatusStyles(order.status)
                                )}
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
                                  className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => handleStatusUpdate(order.id, value)}
                                >
                                  <SelectTrigger className="w-[140px] h-8 rounded-full border-gray-200 dark:border-gray-700">
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Next
                  </Button>
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