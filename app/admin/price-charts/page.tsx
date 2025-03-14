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
  Eye,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

// Type definitions
type PriceChart = {
  id: string;
  price_chart_code: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// Form data type
type PriceChartFormData = {
  name: string;
  description: string;
};

export default function PriceChartsPage() {
  const router = useRouter();
  const { authState } = useAuth();
  const [priceCharts, setPriceCharts] = useState<PriceChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPriceChart, setEditingPriceChart] = useState<PriceChart | null>(null);
  const [formData, setFormData] = useState<PriceChartFormData>({
    name: "",
    description: "",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch price charts on component mount
  useEffect(() => {
    fetchPriceCharts();
  }, []);

  // Fetch price charts from API
  const fetchPriceCharts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/price-charts');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch price charts');
      }
      
      const data = await response.json();
      setPriceCharts(data);
    } catch (error) {
      console.error("Error fetching price charts:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch price charts. Please try again.",
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

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setEditingPriceChart(null);
  };

  // Open dialog for creating a new price chart
  const handleCreatePriceChart = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing a price chart
  const handleEditPriceChart = (chart: PriceChart) => {
    setEditingPriceChart(chart);
    setFormData({
      name: chart.name,
      description: chart.description || "",
    });
    setIsDialogOpen(true);
  };

  // Navigate to price chart details page
  const handleViewPriceChart = (id: string) => {
    router.push(`/admin/price-charts/${id}`);
  };

  // Save price chart (create or update)
  const handleSavePriceChart = async () => {
    try {
      setSubmitting(true);
      
      if (editingPriceChart) {
        // Update existing price chart
        const response = await fetch(`/api/price-charts/${editingPriceChart.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update price chart');
        }
        
        toast({
          title: "Success",
          description: "Price chart updated successfully",
        });
      } else {
        // Create new price chart
        const response = await fetch('/api/price-charts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create price chart');
        }
        
        toast({
          title: "Success",
          description: "Price chart created successfully",
        });
      }

      // Refresh price charts list and close dialog
      await fetchPriceCharts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving price chart:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save price chart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete price chart
  const handleDeletePriceChart = async (id: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/price-charts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete price chart');
      }
      
      toast({
        title: "Success",
        description: "Price chart deleted successfully",
      });
      
      // Refresh price charts list
      await fetchPriceCharts();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting price chart:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete price chart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter price charts based on search query
  const filteredPriceCharts = priceCharts.filter((chart) =>
    chart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chart.price_chart_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chart.description && chart.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
                <h1 className="text-3xl font-bold">Price Charts</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage price charts for different dealers
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="gap-2" onClick={handleCreatePriceChart} disabled={submitting}>
                  <PlusIcon className="h-4 w-4" />
                  New Price Chart
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>All Price Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search price charts..." 
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={fetchPriceCharts}
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
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            <div className="flex justify-center items-center">
                              <Loader2 className="h-6 w-6 animate-spin mr-2" />
                              Loading price charts...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPriceCharts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No price charts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPriceCharts.map((chart) => (
                          <TableRow 
                            key={chart.id} 
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" 
                            onClick={() => !submitting && handleViewPriceChart(chart.id)}
                          >
                            <TableCell className="font-medium">
                              <Badge variant="outline">{chart.price_chart_code}</Badge>
                            </TableCell>
                            <TableCell>{chart.name}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {chart.description || "-"}
                            </TableCell>
                            <TableCell>
                              {new Date(chart.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="View Details"
                                  onClick={() => handleViewPriceChart(chart.id)}
                                  disabled={submitting}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Edit"
                                  onClick={() => handleEditPriceChart(chart)}
                                  disabled={submitting}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {deleteConfirmId === chart.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeletePriceChart(chart.id)}
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
                                    onClick={() => setDeleteConfirmId(chart.id)}
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

      {/* Create/Edit Price Chart Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !submitting && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPriceChart ? "Edit Price Chart" : "Create New Price Chart"}
            </DialogTitle>
            <DialogDescription>
              {editingPriceChart
                ? "Update the price chart details below."
                : "Fill in the details to create a new price chart."}
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
            <Button onClick={handleSavePriceChart} disabled={submitting}>
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