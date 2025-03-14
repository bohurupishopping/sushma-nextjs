"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import { ProtectedRoute } from "@/app/components/protected-route";
import { AdminSidebar } from "@/app/components/admin-sidebar";
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
  PlusIcon, 
  SearchIcon,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

// Type definitions
type PriceChart = {
  id: string;
  price_chart_code: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  items?: PriceChartItem[];
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  unit: string;
};

type PriceChartItem = {
  id: string;
  price_chart_id: string;
  product_id: string;
  price_per_unit: number;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
  product?: Product;
};

// Form data type
type PriceItemFormData = {
  product_id: string;
  price_per_unit: string;
  currency: string;
  effective_date: string;
  expiry_date: string;
};

interface PriceChartDetailsClientProps {
  id: string;
}

export function PriceChartDetailsClient({ id }: PriceChartDetailsClientProps) {
  const router = useRouter();
  const { authState } = useAuth();
  const [priceChart, setPriceChart] = useState<PriceChart | null>(null);
  const [priceItems, setPriceItems] = useState<PriceChartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState<PriceChartItem | null>(null);
  const [formData, setFormData] = useState<PriceItemFormData>({
    product_id: "",
    price_per_unit: "",
    currency: "INR",
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch price chart and items on component mount
  useEffect(() => {
    if (id) {
      fetchPriceChart();
      fetchProducts();
    }
  }, [id]);

  // Fetch price chart details from API
  const fetchPriceChart = async () => {
    try {
      setLoading(true);
      
      // Fetch price chart with items
      const response = await fetch(`/api/price-charts/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch price chart details');
      }
      
      const data = await response.json();
      setPriceChart(data);
      setPriceItems(data.items || []);
    } catch (error) {
      console.error("Error fetching price chart details:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch price chart details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all products from API
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch products. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update available products when price items change
  useEffect(() => {
    if (products.length > 0 && priceItems.length > 0) {
      const existingProductIds = priceItems.map(item => item.product_id);
      const filtered = products.filter(product => !existingProductIds.includes(product.id));
      setAvailableProducts(filtered);
    } else {
      setAvailableProducts(products);
    }
  }, [products, priceItems]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      product_id: "",
      price_per_unit: "",
      currency: "INR",
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
    });
    setEditingPriceItem(null);
  };

  // Open dialog for creating a new price item
  const handleAddProduct = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing a price item
  const handleEditPriceItem = (item: PriceChartItem) => {
    setEditingPriceItem(item);
    setFormData({
      product_id: item.product_id,
      price_per_unit: item.price_per_unit.toString(),
      currency: item.currency,
      effective_date: new Date(item.effective_date).toISOString().split('T')[0],
      expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  // Save price item (create or update)
  const handleSavePriceItem = async () => {
    try {
      setSubmitting(true);
      
      if (!formData.product_id || !formData.price_per_unit) {
        toast({
          title: "Error",
          description: "Product and price are required fields.",
          variant: "destructive",
        });
        return;
      }

      const priceItemData = {
        product_id: formData.product_id,
        price_per_unit: parseFloat(formData.price_per_unit),
        currency: formData.currency,
        effective_date: formData.effective_date,
        expiry_date: formData.expiry_date || null,
      };

      if (editingPriceItem) {
        // Update existing price item
        const response = await fetch(`/api/price-charts/${id}/items/${editingPriceItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(priceItemData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update price item');
        }
        
        toast({
          title: "Success",
          description: "Price item updated successfully",
        });
      } else {
        // Create new price item
        const response = await fetch(`/api/price-charts/${id}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(priceItemData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add product to price chart');
        }
        
        toast({
          title: "Success",
          description: "Product added to price chart successfully",
        });
      }

      // Refresh price items and close dialog
      await fetchPriceChart();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving price item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save price item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete price item
  const handleDeletePriceItem = async (itemId: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/price-charts/${id}/items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove product from price chart');
      }
      
      toast({
        title: "Success",
        description: "Product removed from price chart successfully",
      });
      
      // Refresh price items
      await fetchPriceChart();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting price item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter price items based on search query
  const filteredPriceItems = priceItems.filter((item) =>
    item.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex h-screen">
        {/* Admin Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.push("/admin/price-charts")}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">
                  {loading ? "Loading..." : priceChart?.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {loading ? "..." : priceChart?.price_chart_code}
                  </Badge>
                  <p className="text-gray-500 dark:text-gray-400">
                    {loading ? "..." : priceChart?.description}
                  </p>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Products & Pricing</CardTitle>
                    <CardDescription>
                      Manage products and their prices in this price chart
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={fetchPriceChart}
                      disabled={loading || submitting}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      )}
                      Refresh
                    </Button>
                    <Button className="gap-2" onClick={handleAddProduct} disabled={submitting}>
                      <PlusIcon className="h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search products..." 
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            <div className="flex justify-center items-center">
                              <Loader2 className="h-6 w-6 animate-spin mr-2" />
                              Loading products...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPriceItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            No products in this price chart
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPriceItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.product?.name}
                            </TableCell>
                            <TableCell>
                              {item.product?.category ? (
                                <Badge variant="outline">{item.product.category}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>{item.product?.unit}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(item.price_per_unit, item.currency)}
                            </TableCell>
                            <TableCell>
                              {new Date(item.effective_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {item.expiry_date 
                                ? new Date(item.expiry_date).toLocaleDateString() 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Edit"
                                  onClick={() => handleEditPriceItem(item)}
                                  disabled={submitting}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {deleteConfirmId === item.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeletePriceItem(item.id)}
                                      title="Confirm Delete"
                                      disabled={submitting}
                                    >
                                      {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4 text-green-500" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeleteConfirmId(null)}
                                      title="Cancel"
                                      disabled={submitting}
                                    >
                                      <X className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteConfirmId(item.id)}
                                    title="Delete"
                                    disabled={submitting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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

      {/* Add/Edit Product Price Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !submitting && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPriceItem ? "Edit Product Price" : "Add Product to Price Chart"}
            </DialogTitle>
            <DialogDescription>
              {editingPriceItem
                ? "Update the product price details below."
                : "Add a product and set its price for this price chart."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product_id" className="text-right">
                Product
              </Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => handleSelectChange("product_id", value)}
                disabled={!!editingPriceItem || submitting}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {editingPriceItem ? (
                    <SelectItem value={editingPriceItem.product_id}>
                      {editingPriceItem.product?.name} ({editingPriceItem.product?.unit})
                    </SelectItem>
                  ) : (
                    availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.unit})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price_per_unit" className="text-right">
                Price
              </Label>
              <Input
                id="price_per_unit"
                name="price_per_unit"
                type="number"
                step="0.01"
                value={formData.price_per_unit}
                onChange={handleInputChange}
                className="col-span-3"
                required
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
                disabled={submitting}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="effective_date" className="text-right">
                Effective Date
              </Label>
              <Input
                id="effective_date"
                name="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={handleInputChange}
                className="col-span-3"
                required
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry_date" className="text-right">
                Expiry Date
              </Label>
              <Input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleInputChange}
                className="col-span-3"
                disabled={submitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSavePriceItem} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
} 