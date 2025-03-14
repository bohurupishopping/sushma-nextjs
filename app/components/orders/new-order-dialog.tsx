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
import { PlusIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
      }
    };

    fetchDealers();
  }, [toast]);

  // Fetch dealer details when selected
  useEffect(() => {
    const fetchDealerDetails = async () => {
      const dealerId = form.getValues("dealer_id");
      if (!dealerId) {
        console.log("No dealer ID selected, clearing state");
        setSelectedDealer(null);
        setProducts([]);
        return;
      }

      console.log("Fetching dealer details for ID:", dealerId);
      try {
        const response = await fetch(`/api/dealers/${dealerId}/details`);
        const data = await response.json();

        if (!response.ok) {
          console.error("Error response from API:", data);
          throw new Error(data.error || 'Failed to fetch dealer details');
        }
        
        console.log("Received dealer data:", data);
        setSelectedDealer(data);
        
        // If dealer has a price chart, fetch its products
        if (data.price_chart?.id) {
          console.log("Dealer has price chart:", data.price_chart.id);
          await fetchPriceChartProducts(data.price_chart.id);
        } else {
          console.log("Dealer has no price chart assigned");
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
      }
    };

    fetchDealerDetails();
  }, [form.getValues("dealer_id"), toast]);

  // Fetch price chart products
  const fetchPriceChartProducts = async (priceChartId: string) => {
    try {
      console.log("Fetching products for price chart:", priceChartId);
      const response = await fetch(`/api/price-charts/${priceChartId}/items`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", data);
        throw new Error(data.error || 'Failed to fetch price chart products');
      }

      console.log("Received price chart products:", data);
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

      console.log('Submitting order data:', orderData);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Error response:', responseData);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dealer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dealer</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedDealer(null);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dealer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(dealers) && dealers.map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id}>
                          {dealer.name} ({dealer.dealer_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedDealer && (
              <div className="text-sm text-gray-500">
                <p>Dealer Code: {selectedDealer.dealer_code}</p>
                <p>Salesman: {selectedDealer.profile?.display_name || 'Not assigned'}</p>
                <p>Price Chart: {selectedDealer.price_chart?.name || 'Not assigned'}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedDealer?.price_chart?.id}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(products) && products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.unit}) - ₹{product.price_per_unit}
                        </SelectItem>
                      ))}
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 