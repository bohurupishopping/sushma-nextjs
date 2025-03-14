import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package2, 
  MapPin, 
  CreditCard, 
  CalendarDays, 
  ArrowLeft, 
  Download, 
  ShoppingCart, 
  Building2, 
  ClipboardList,
  Printer
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Memoized status color function
const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    'processing': { 
      bg: 'border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/30', 
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/50 dark:border-blue-500/30'
    },
    'production': { 
      bg: 'border-orange-500/50 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-500/30', 
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/50 dark:border-orange-500/30'
    },
    'completed': { 
      bg: 'border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500/30', 
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-500/50 dark:border-green-500/30'
    },
    'canceled': { 
      bg: 'border-rose-500/50 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-500/30', 
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/50 dark:border-rose-500/30'
    }
  };
  return statusColors[status] || { 
    bg: 'border-gray-500/50 bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-500/30', 
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-500/50 dark:border-gray-500/30'
  };
};

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const statusColor = useMemo(() => order ? getStatusColor(order.status) : null, [order?.status]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "w-screen sm:max-w-[540px] md:max-w-[640px]",
        "h-[100vh] sm:h-[90vh]",
        "p-0 mx-auto",
        "overflow-hidden",
        "border-0 sm:border sm:border-gray-200 dark:sm:border-gray-800",
        "shadow-2xl",
        "sm:rounded-2xl",
        "bg-white dark:bg-gray-900",
        "transition-all duration-200"
      )}>
        <DialogHeader className={cn(
          "px-4 sm:px-6 py-3 sm:py-4",
          "sticky top-0",
          "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50",
          "border-b border-gray-100 dark:border-gray-800",
          "backdrop-blur-xl z-10"
        )}>
          <div className="relative flex items-center justify-center mb-3">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute left-0",
                "h-9 w-9 rounded-full",
                "bg-white/90 dark:bg-gray-900/90",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                "shadow-sm"
              )}
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
              <span className="sr-only">Go back</span>
            </Button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  "bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100",
                  "dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20",
                  "shadow-sm"
                )}>
                  <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" strokeWidth={2} />
                </div>
                <DialogTitle className={cn(
                  "text-base sm:text-lg font-semibold",
                  "bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600",
                  "dark:from-orange-400 dark:via-orange-300 dark:to-orange-400",
                  "bg-clip-text text-transparent"
                )}>
                  Order #{order.id}
                </DialogTitle>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-xs sm:text-sm flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                  {format(new Date(order.created_at), 'PPP p')}
                </div>
                <Badge 
                  variant="outline"
                  className={cn(
                    "px-2 py-0.5 text-xs sm:text-sm shadow-sm capitalize",
                    statusColor?.bg
                  )}
                >
                  {order.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(100vh-6rem)] sm:h-[calc(90vh-7rem)] px-4 sm:px-6 py-4">
          <div className="space-y-4 sm:space-y-5 pb-4 sm:pb-6">
            {/* Order Products */}
            <section className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" strokeWidth={2} />
                Order Products
              </h3>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-slate-50/50 via-white/50 to-slate-50/50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                        {order.product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span>Category: {order.product.category}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>Unit: {order.product.unit}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                        ₹{order.total_price.toFixed(2)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        ₹{order.price_per_unit.toFixed(2)} per unit
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Quantity: {order.quantity}</span>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200/75 dark:via-gray-800/75 to-transparent" />

            {/* Dealer Information */}
            <section className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" strokeWidth={2} />
                Dealer Information
              </h3>
              <div className="bg-gradient-to-br from-orange-50/40 via-orange-50/20 to-amber-50/40 dark:from-orange-950/20 dark:via-orange-950/10 dark:to-amber-950/20 p-3 sm:p-4 rounded-xl border border-orange-100/50 dark:border-orange-800/50">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {order.dealer.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dealer Code: {order.dealer.dealer_code}
                  </p>
                  {order.salesman && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Salesman: {order.salesman.display_name}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200/75 dark:via-gray-800/75 to-transparent" />

            {/* Order Summary */}
            <section className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" strokeWidth={2} />
                Order Summary
              </h3>
              <div className="bg-gradient-to-br from-amber-50/40 via-amber-50/20 to-orange-50/40 dark:from-amber-950/20 dark:via-amber-950/10 dark:to-orange-950/20 p-3 sm:p-4 rounded-xl border border-amber-100/50 dark:border-amber-800/50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                    <span className="font-medium">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Price per Unit</span>
                    <span className="font-medium">₹{order.price_per_unit.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2 bg-amber-200/50 dark:bg-amber-800/50" />
                  <div className="flex justify-between font-semibold text-base sm:text-lg">
                    <span>Total Price</span>
                    <span className="bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                      ₹{order.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Notes */}
            {order.notes && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" strokeWidth={2} />
                  Notes
                </h3>
                <div className="bg-gradient-to-br from-slate-50/40 via-slate-50/20 to-slate-50/40 dark:from-slate-950/20 dark:via-slate-950/10 dark:to-slate-950/20 p-3 sm:p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex w-full justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full gap-2"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button 
              size="sm" 
              className="rounded-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 