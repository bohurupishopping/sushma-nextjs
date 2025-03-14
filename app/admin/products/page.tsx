"use client";

import { useState, useEffect } from "react";
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
  PlusIcon, 
  SearchIcon,
  Pencil,
  Trash2,
  X,
  Check,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

// Product type definition
type Product = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  unit: string;
  created_at: string;
  updated_at: string;
};

// Form data type
type ProductFormData = {
  name: string;
  category: string;
  description: string;
  unit: string;
};

export default function ProductsPage() {
  const { authState } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category: "",
    description: "",
    unit: "50kg",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      name: "",
      category: "",
      description: "",
      unit: "50kg",
    });
    setEditingProduct(null);
  };

  // Open dialog for creating a new product
  const handleCreateProduct = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing a product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category || "",
      description: product.description || "",
      unit: product.unit,
    });
    setIsDialogOpen(true);
  };

  // Save product (create or update)
  const handleSaveProduct = async () => {
    try {
      setSubmitting(true);
      
      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update product');
        }
        
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        // Create new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create product');
        }
        
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      // Refresh products list and close dialog
      await fetchProducts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      // Refresh products list
      await fetchProducts();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
                <h1 className="text-3xl font-bold">Products</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage your product catalog
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="gap-2" onClick={handleCreateProduct} disabled={submitting}>
                  <PlusIcon className="h-4 w-4" />
                  New Product
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>All Products</CardTitle>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={fetchProducts}
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
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            <div className="flex justify-center items-center">
                              <Loader2 className="h-6 w-6 animate-spin mr-2" />
                              Loading products...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No products found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              {product.category ? (
                                <Badge variant="outline">{product.category}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>{product.unit}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {product.description || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditProduct(product)}
                                  disabled={submitting}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {deleteConfirmId === product.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteProduct(product.id)}
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
                                      disabled={submitting}
                                    >
                                      <X className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteConfirmId(product.id)}
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

      {/* Create/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !submitting && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details below."
                : "Fill in the details to create a new product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
                disabled={submitting}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                Unit
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleSelectChange("unit", value)}
                disabled={submitting}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50kg">50kg</SelectItem>
                  <SelectItem value="10kg">10kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
                rows={3}
                disabled={submitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={submitting}>
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