import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Package2 } from "lucide-react";
import { OrderDetailsDialog } from "./order-details-dialog";
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

interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
}

export function OrdersTable({ orders, loading = false }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <h3 className="text-lg font-medium">Loading orders...</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Please wait while we fetch the latest orders
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No orders found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There are no orders matching your criteria
        </p>
      </div>
    );
  }

  return (
    <>
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
              <TableHead className="font-semibold">Created At</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
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
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewOrder(order)}
                    className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </>
  );
} 