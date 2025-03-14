"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Loader2, ShoppingCart, Building2, Package2, ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  dealer_id: z.string().min(1, "Dealer is required"),
  product_id: z.string().min(1, "Product is required"),
  quantity: z.string().min(1, "Quantity is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Dealer {
  id: string;
  name: string;
  dealer_code: string;
  salesman_id: string | null;
  price_chart_code: string | null;
  profile: {
    display_name: string;
    role: string;
    status: string;
  } | null;
  price_chart: {
    id: string;
    name: string;
    price_chart_code: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
}

export function NewOrderDialog() {
  const [open, setOpen] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDealers, setFetchingDealers] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealer_id: "",
      product_id: "",
      quantity: "",
      notes: "",
    },
  });

  // Fetch dealers
  useEffect(() => {
    const fetchDealers = async () => {
      setFetchingDealers(true);
      try {
        const response = await fetch("/api/dealers");
        const data = await response.json();
        if (Array.isArray(data)) {
          setDealers(data);
        } else {
          console.error("Dealers data is not an array:", data);
          setDealers([]);
        }
      } catch (error) {
        console.error("Error fetching dealers:", error);
        toast({
          title: "Error",
          description: "Failed to fetch dealers",
          variant: "destructive",
        });
        setDealers([]);
      } finally {
        setFetchingDealers(false);
      }
    };

    if (open) {
      fetchDealers();
    }
  }, [open, toast]);

  // Fetch dealer details when selected
  useEffect(() => {
    const fetchDealerDetails = async () => {
      const dealerId = form.getValues("dealer_id");
      if (!dealerId) {
        setSelectedDealer(null);
        setProducts([]);
        return;
      }

      setFetchingProducts(true);
      try {
        const response = await fetch(`/api/dealers/${dealerId}/details`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch dealer details');
        }
        
        setSelectedDealer(data);
        
        // If dealer has a price chart, fetch its products
        if (data.price_chart?.id) {
          await fetchPriceChartProducts(data.price_chart.id);
        } else {
          toast({
            title: "Warning",
            description: "This dealer has no price chart assigned",
            variant: "destructive",
          });
          setProducts([]);
        }
      } catch (error) {
        console.error("Error in fetchDealerDetails:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch dealer details",
          variant: "destructive",
        });
        setSelectedDealer(null);
        setProducts([]);
      } finally {
        setFetchingProducts(false);
      }
    };

    fetchDealerDetails();
  }, [form.watch("dealer_id"), toast]);

  // Fetch price chart products
  const fetchPriceChartProducts = async (priceChartId: string) => {
    try {
      const response = await fetch(`/api/price-charts/${priceChartId}/items`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch price chart products');
      }

      setProducts(data);
    } catch (error) {
      console.error("Error fetching price chart products:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch products",
        variant: "destructive",
      });
      setProducts([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // We already have selectedDealer from the state since it's set when dealer is selected
      if (!selectedDealer || !selectedDealer.price_chart?.id) {
        throw new Error('Dealer details not loaded properly');
      }

      // Find the selected product from our products state
      const selectedProduct = products.find(p => p.id === data.product_id);
      if (!selectedProduct) {
        throw new Error('Selected product not found');
      }

      const orderData = {
        dealer_id: selectedDealer.id,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        unit: selectedProduct.unit,
        quantity: Number(data.quantity),
        price_chart_id: selectedDealer.price_chart.id,
        price_per_unit: selectedProduct.price_per_unit,
        total_price: Number(data.quantity) * selectedProduct.price_per_unit,
        status: 'processing',
        notes: data.notes || null
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create order');
      }

      toast({
        title: "Success",
        description: "Order created successfully",
      });

      setOpen(false);
      form.reset();
      setSelectedDealer(null);
      setProducts([]);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    const quantity = Number(form.watch("quantity") || 0);
    const productId = form.watch("product_id");
    const selectedProduct = products.find(p => p.id === productId);
    
    if (selectedProduct && quantity > 0) {
      return quantity * selectedProduct.price_per_unit;
    }
    return 0;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full"
        >
          <PlusIcon className="h-4 w-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold">Create New Order</DialogTitle>
          </div>
          <DialogDescription>
            Fill in the details below to create a new order
          </DialogDescription>
        </DialogHeader>
        
        <Separator className="my-4" />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-medium">
                <Building2 className="h-4 w-4" />
                <h3>Dealer Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="dealer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Dealer</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedDealer(null);
                      }}
                      value={field.value}
                      disabled={fetchingDealers}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder={fetchingDealers ? "Loading dealers..." : "Select a dealer"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fetchingDealers ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </div>
                        ) : dealers.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">No dealers found</div>
                        ) : (
                          dealers.map((dealer) => (
                            <SelectItem key={dealer.id} value={dealer.id}>
                              {dealer.name} ({dealer.dealer_code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedDealer && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dealer Code:</span>
                    <span className="font-medium">{selectedDealer.dealer_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Salesman:</span>
                    <span className="font-medium">{selectedDealer.profile?.display_name || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Price Chart:</span>
                    <span className="font-medium">{selectedDealer.price_chart?.name || 'Not assigned'}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-medium">
                <Package2 className="h-4 w-4" />
                <h3>Product Details</h3>
              </div>

              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Product</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedDealer?.price_chart?.id || fetchingProducts}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-md border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder={fetchingProducts ? "Loading products..." : "Select a product"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fetchingProducts ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </div>
                        ) : products.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">No products available</div>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{product.name} ({product.unit})</span>
                                <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-orange-200">
                                  ₹{product.price_per_unit}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Enter quantity"
                        className="rounded-md border-gray-300 dark:border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("product_id") && form.watch("quantity") && Number(form.watch("quantity")) > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Total Price:</span>
                    <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      ₹{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-medium">
                <ClipboardList className="h-4 w-4" />
                <h3>Additional Information</h3>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes or special instructions"
                        className="rounded-md border-gray-300 dark:border-gray-700 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-full bg-orange-600 hover:bg-orange-700 text-white" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 