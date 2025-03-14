import { WooCommerceOrder } from "@/app/types/woocommerce";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/app/global/ui/dialog";
import { Badge } from "@/app/global/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/app/global/ui/separator";
import { ScrollArea } from "@/app/global/ui/scroll-area";
import { Package2, MapPin, CreditCard, CalendarDays, Truck, Mail, Phone, ArrowLeft, Link, Download } from "lucide-react";
import { CashfreeOrderResponse } from '@/app/types/cashfree';
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useToast } from "@/app/global/ui/use-toast";
import { Button } from "@/app/global/ui/button";
import { cn } from "@/lib/utils";

interface OrderDetailsDialogProps {
  order: WooCommerceOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MetaData {
  id: number;
  key: string;
  value: string;
  display_key: string;
  display_value: string;
}

interface Variant {
  label: string;
  value: string;
  type: 'regular' | 'full-sleeve' | 'children';
}

interface TrackingInfo {
  number?: string;
  provider?: string;
  url?: string;
}

interface LineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: Array<{ id: number; total: string; subtotal: string; }>;
  meta_data: MetaData[];
  sku: string;
  price: number;
  // Additional properties from meta data
  product_url?: string;
  download_url?: string;
  categories?: string[];
}

// Memoized status color function
const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    'pending': { 
      bg: 'border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-500/30', 
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-500/50 dark:border-yellow-500/30'
    },
    'processing': { 
      bg: 'border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/30', 
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/50 dark:border-blue-500/30'
    },
    'on-hold': { 
      bg: 'border-orange-500/50 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-500/30', 
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/50 dark:border-orange-500/30'
    },
    'completed': { 
      bg: 'border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500/30', 
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-500/50 dark:border-green-500/30'
    },
    'cancelled': { 
      bg: 'border-rose-500/50 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-500/30', 
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/50 dark:border-rose-500/30'
    },
    'refunded': { 
      bg: 'border-purple-500/50 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-500/30', 
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-500/50 dark:border-purple-500/30'
    },
    'failed': { 
      bg: 'border-red-500/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500/30', 
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-500/50 dark:border-red-500/30'
    }
  };
  return statusColors[status] || { 
    bg: 'border-gray-500/50 bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-500/30', 
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-500/50 dark:border-gray-500/30'
  };
};

// Optimized function to get meta value
const getMetaValue = (meta_data: MetaData[], key: string): string | null => {
  for (let i = 0; i < meta_data.length; i++) {
    if (meta_data[i].key === key) {
      return meta_data[i].value;
    }
  }
  return null;
};

// Optimized function to get variant badges
const getVariantBadges = (meta_data: MetaData[], name: string): Variant[] => {
  const variants = [
    { key: 'select_size', label: 'Size' },
    { key: 'select_colour', label: 'Color' },
    { key: 'select_colour_fs', label: 'Full Sleeve Color' },
    { key: 'size_fs', label: 'Full Sleeve Size' },
    { key: 'select_size_child', label: "Child's Size" },
    { key: 'select_colour_child', label: "Child's Color" },
    { key: 'pa_color', label: 'Color' },
    { key: 'pa_size', label: 'Size' }
  ];

  const result: Variant[] = [];
  
  // First check meta_data for variants
  for (let i = 0; i < variants.length; i++) {
    const value = getMetaValue(meta_data, variants[i].key);
    if (value) {
      result.push({
        label: variants[i].label,
        value: value,
        type: variants[i].key.includes('_fs') ? 'full-sleeve' : 
              variants[i].key.includes('_child') ? 'children' : 'regular'
      });
    }
  }

  // If no variants found in meta_data, try to extract from product name
  if (result.length === 0 && name) {
    // Extract size and color from product name (e.g., "Bengali Customized T-Shirt - Priyo Bandhobi - 2XL (46)")
    const sizeMatch = name.match(/(?:^|\s)-\s*(\d*X*[SML]|\d+)\s*(?:\(\d+\))?\s*$/i);
    const colorMatch = name.match(/\s-\s([^-]+?)(?:\s-\s|$)/);

    if (sizeMatch && sizeMatch[1]) {
      result.push({
        label: 'Size',
        value: sizeMatch[1],
        type: 'regular'
      });
    }

    if (colorMatch && colorMatch[1]) {
      result.push({
        label: 'Color',
        value: colorMatch[1].trim(),
        type: 'regular'
      });
    }
  }
  return result;
};

// Optimized function to get tracking info
const getTrackingInfo = (order: WooCommerceOrder): TrackingInfo | null => {
  const trackingMeta = order.meta_data?.find(meta => 
    meta.key === '_wc_shipment_tracking_items' || 
    meta.key === 'wc_shipment_tracking_items' ||
    meta.key === '_tracking_number'
  );

  if (!trackingMeta) return null;

  try {
    if (typeof trackingMeta.value === 'string') {
      if (trackingMeta.value.startsWith('[')) {
        const trackingItems = JSON.parse(trackingMeta.value);
        if (trackingItems?.[0]) {
          return {
            number: trackingItems[0].tracking_number,
            provider: trackingItems[0].tracking_provider,
            url: trackingItems[0].tracking_link || trackingItems[0].tracking_url
          };
        }
      } else {
        return { number: trackingMeta.value };
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing tracking info:', error);
    return null;
  }
};

// Memoized Order Item Component
const OrderItem = memo(({ 
  item, 
  currency 
}: { 
  item: LineItem;
  currency: string;
}) => {
  const variants = useMemo(() => getVariantBadges(item.meta_data, item.name), [item.meta_data, item.name]);
  const itemTotal = useMemo(() => parseFloat(item.total).toFixed(2), [item.total]);
  const itemUnitPrice = useMemo(
    () => (parseFloat(item.total) / item.quantity).toFixed(2),
    [item.total, item.quantity]
  );

  // Extract customization details from meta_data
  const customization = useMemo(() => {
    const customFields = item.meta_data.filter(meta => 
      !meta.key.startsWith('_') && 
      !meta.key.includes('select_') &&
      !meta.key.includes('size_') &&
      meta.key !== 'pa_size' &&
      meta.key !== 'pa_color'
    );
    return customFields.map(field => ({
      label: field.display_key.replace(/_/g, ' '),
      value: field.display_value
    }));
  }, [item.meta_data]);

  // Extract product URL and download URL from meta_data
  const { productUrl, downloadUrl } = useMemo(() => {
    const productUrlMeta = item.meta_data.find(meta => meta.key === '_product_url' || meta.key === 'product_url');
    const downloadUrlMeta = item.meta_data.find(meta => meta.key === '_download_url' || meta.key === 'download_url');
    return {
      productUrl: productUrlMeta?.value || item.product_url,
      downloadUrl: downloadUrlMeta?.value || item.download_url
    };
  }, [item.meta_data, item.product_url, item.download_url]);

  // Extract categories from meta_data
  const categories = useMemo(() => {
    const categoryMeta = item.meta_data.find(meta => meta.key === '_product_categories' || meta.key === 'product_categories');
    return categoryMeta?.value ? JSON.parse(categoryMeta.value) : item.categories || [];
  }, [item.meta_data, item.categories]);

  return (
    <div className="p-3 sm:p-4 bg-gradient-to-br from-gray-50/50 via-white/50 to-gray-50/50 dark:from-gray-800/50 dark:via-gray-800/30 dark:to-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Product Title and Basic Info */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                {item.name}
              </h4>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span>SKU: {item.sku}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>Qty: {item.quantity}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
                {currency} {itemTotal}
              </p>
              {item.quantity > 1 && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {currency} {itemUnitPrice} each
                </p>
              )}
            </div>
          </div>

          {/* Variants (Size, Color, etc.) */}
          {variants.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {variants.map((variant, idx) => (
                <span 
                  key={idx}
                  className={`px-2 py-0.5 text-xs sm:text-sm rounded-full transition-colors duration-200 ${
                    variant.type === 'full-sleeve' 
                      ? 'bg-fuchsia-100/70 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-200/70 dark:hover:bg-fuchsia-900/50' 
                      : variant.type === 'children'
                      ? 'bg-pink-100/70 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 hover:bg-pink-200/70 dark:hover:bg-pink-900/50'
                      : 'bg-violet-100/70 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200/70 dark:hover:bg-violet-900/50'
                  }`}
                >
                  {variant.label}: {variant.label.toLowerCase() === 'color' ? variant.value.toUpperCase() : variant.value}
                </span>
              ))}
            </div>
          )}

          {/* Customization Details */}
          {customization.length > 0 && (
            <div className="space-y-2 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-900/20 dark:to-fuchsia-900/20 rounded-lg border border-violet-100/50 dark:border-violet-800/50 p-2">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Customization Details:</p>
              <div className="grid gap-1.5">
                {customization.map((field, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                      {field.label}:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category: string, idx: number) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 text-xs sm:text-sm rounded-full bg-gray-100/70 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Product Links */}
          {(productUrl || downloadUrl) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {productUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs sm:text-sm bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
                  onClick={() => window.open(productUrl, '_blank')}
                >
                  <Link className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                  View Product
                </Button>
              )}
              {downloadUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs sm:text-sm bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
                  onClick={() => window.open(downloadUrl, '_blank')}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                  Download Design
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

OrderItem.displayName = 'OrderItem';

// Optimized WooOrderDetailsDialog Component
export function WooOrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const [cashfreeDetails, setCashfreeDetails] = useState<CashfreeOrderResponse | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const { toast } = useToast();

  const fetchCashfreeDetails = useCallback(async (orderNumber: string) => {
    setIsLoadingPayment(true);
    try {
      const response = await fetch(`/api/cashfree/orders/${orderNumber}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }
      const data = await response.json();
      setCashfreeDetails(data);
    } catch (error) {
      console.error('Error fetching Cashfree details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment details",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayment(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open && order?.number) {
      fetchCashfreeDetails(order.number);
    }
  }, [open, order?.number, fetchCashfreeDetails]);

  const statusColor = useMemo(() => order ? getStatusColor(order.status) : null, [order?.status]);
  const trackingInfo = useMemo(() => order ? getTrackingInfo(order) : null, [order]);
  const orderSubtotal = useMemo(() => {
    if (!order) return '0.00';
    return (parseFloat(order.total) - parseFloat(order.shipping_total) - parseFloat(order.total_tax)).toFixed(2);
  }, [order]);

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
          "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50",
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
                  "bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100",
                  "dark:from-violet-900/20 dark:via-purple-900/20 dark:to-fuchsia-900/20",
                  "shadow-sm"
                )}>
                  <Package2 className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                </div>
                <DialogTitle className={cn(
                  "text-base sm:text-lg font-semibold",
                  "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900",
                  "dark:from-gray-50 dark:via-gray-200 dark:to-gray-50",
                  "bg-clip-text text-transparent"
                )}>
                  Order #{order.number}
                </DialogTitle>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-xs sm:text-sm flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                  {format(new Date(order.date_created), 'PPP p')}
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
            {/* Tracking Information */}
            {trackingInfo && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" strokeWidth={2} />
                  Tracking Information
                </h3>
                <div className="bg-gradient-to-br from-emerald-50/40 via-emerald-50/20 to-teal-50/40 dark:from-emerald-950/20 dark:via-emerald-950/10 dark:to-teal-950/20 p-3 sm:p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-800/50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Package2 className="h-4 w-4" strokeWidth={2} />
                        Tracking ID
                      </div>
                      <p className="font-medium text-base text-gray-900 dark:text-gray-100">{trackingInfo.number}</p>
                    </div>
                    {trackingInfo.url && (
                      <a 
                        href={trackingInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4"
                      >
                        Track Package
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Cashfree Payment Details */}
            {(isLoadingPayment || cashfreeDetails) && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" strokeWidth={2} />
                  Payment Details
                </h3>
                <div className="bg-gradient-to-br from-violet-50/40 via-violet-50/20 to-purple-50/40 dark:from-violet-950/20 dark:via-violet-950/10 dark:to-purple-950/20 p-3 sm:p-4 rounded-xl border border-violet-100/50 dark:border-violet-800/50">
                  {isLoadingPayment ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
                    </div>
                  ) : cashfreeDetails ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-violet-600 dark:text-violet-400">Payment Status</p>
                          <span className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${
                            cashfreeDetails.order_status === 'PAID'
                              ? 'bg-emerald-500 text-white'
                              : cashfreeDetails.order_status === 'PENDING'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}>
                            {cashfreeDetails.order_status === 'PAID' ? 'Paid' : 
                             cashfreeDetails.order_status === 'PENDING' ? 'Pending' : 'Failed'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-violet-600 dark:text-violet-400">Cashfree Order ID</p>
                          <p className="text-sm font-medium mt-1">{cashfreeDetails.cf_order_id}</p>
                        </div>
                        {cashfreeDetails.order_status === 'PAID' && (
                          <div className="col-span-2">
                            <p className="text-sm text-violet-600 dark:text-violet-400">Payment Date</p>
                            <p className="text-sm font-medium mt-1">
                              {format(new Date(cashfreeDetails.created_at), 'PPP p')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            )}

            {/* Order Products */}
            <section className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-fuchsia-500" strokeWidth={2} />
                Order Products
              </h3>
              <div className="grid gap-3 sm:gap-4">
                {order.line_items.map((item, index) => (
                  <OrderItem
                    key={`${item.id}-${index}`}
                    item={item}
                    currency={order.currency}
                  />
                ))}
              </div>
            </section>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200/75 dark:via-gray-800/75 to-transparent" />

            {/* Customer Information */}
            <div className="grid sm:grid-cols-2 gap-4">
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" strokeWidth={2} />
                  Billing Address
                </h3>
                <div className="bg-gradient-to-br from-rose-50/40 via-rose-50/20 to-pink-50/40 dark:from-rose-950/20 dark:via-rose-950/10 dark:to-pink-950/20 p-3 sm:p-4 rounded-xl border border-rose-100/50 dark:border-rose-800/50">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.billing.first_name} {order.billing.last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.billing.address_1}</p>
                    {order.billing.address_2 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.billing.address_2}</p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.billing.city}, {order.billing.state} {order.billing.postcode}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.billing.country}</p>
                    <div className="pt-2 flex flex-col gap-1">
                      <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {order.billing.email}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {order.billing.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" strokeWidth={2} />
                  Shipping Address
                </h3>
                <div className="bg-gradient-to-br from-indigo-50/40 via-indigo-50/20 to-blue-50/40 dark:from-indigo-950/20 dark:via-indigo-950/10 dark:to-blue-950/20 p-3 sm:p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-800/50">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.shipping.first_name} {order.shipping.last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping.address_1}</p>
                    {order.shipping.address_2 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping.address_2}</p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.shipping.country}</p>
                  </div>
                </div>
              </section>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200/75 dark:via-gray-800/75 to-transparent" />

            {/* Order Summary */}
            <section className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" strokeWidth={2} />
                Order Summary
              </h3>
              <div className="bg-gradient-to-br from-amber-50/40 via-amber-50/20 to-orange-50/40 dark:from-amber-950/20 dark:via-amber-950/10 dark:to-orange-950/20 p-3 sm:p-4 rounded-xl border border-amber-100/50 dark:border-amber-800/50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">{order.currency} {orderSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="font-medium">{order.currency} {parseFloat(order.shipping_total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="font-medium">{order.currency} {parseFloat(order.total_tax).toFixed(2)}</span>
                  </div>
                  {parseFloat(order.discount_total) > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{order.currency} {parseFloat(order.discount_total).toFixed(2)}</span>
                    </div>
                  )}
                  <Separator className="my-2 bg-amber-200/50 dark:bg-amber-800/50" />
                  <div className="flex justify-between font-semibold text-base sm:text-lg">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                      {order.currency} {parseFloat(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500" strokeWidth={2} />
                Payment Method
              </h3>
              <div className="bg-gradient-to-br from-teal-50/40 via-teal-50/20 to-emerald-50/40 dark:from-teal-950/20 dark:via-teal-950/10 dark:to-emerald-950/20 p-3 sm:p-4 rounded-xl border border-teal-100/50 dark:border-teal-800/50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.payment_method_title}</span>
                  </div>
                  {order.transaction_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.transaction_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Customer Note */}
            {order.customer_note && (
              <section className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" strokeWidth={2} />
                  Customer Note
                </h3>
                <div className="bg-gradient-to-br from-blue-50/40 via-blue-50/20 to-indigo-50/40 dark:from-blue-950/20 dark:via-blue-950/10 dark:to-indigo-950/20 p-3 sm:p-4 rounded-xl border border-blue-100/50 dark:border-blue-800/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{order.customer_note}</p>
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}