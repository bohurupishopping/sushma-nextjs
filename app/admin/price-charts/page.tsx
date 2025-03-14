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
  Eye,
  Loader2,
  FileSpreadsheet,
  Filter
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
import { Separator } from "@/components/ui/separator";

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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex h-screen">
        {/* Admin Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-orange-600">Price Charts</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage price charts for different dealers and customers
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  className="gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full" 
                  onClick={handleCreatePriceChart} 
                  disabled={submitting}
                >
                  <PlusIcon className="h-4 w-4" />
                  New Price Chart
                </Button>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Price Charts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{priceCharts.length}</div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Active Charts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {priceCharts.length}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Assigned Charts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {priceCharts.length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">All Price Charts</CardTitle>
                  <CardDescription>
                    {filteredPriceCharts.length} price charts available
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 rounded-full"
                  onClick={fetchPriceCharts}
                  disabled={loading || submitting}
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search price charts..." 
                      className="pl-8 rounded-full bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
                  </div>
                ) : filteredPriceCharts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No price charts found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      There are no price charts in the system.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={handleCreatePriceChart}
                    >
                      Create your first price chart
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800">
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPriceCharts.map((chart) => (
                          <TableRow 
                            key={chart.id} 
                            className="cursor-pointer" 
                            onClick={() => !submitting && handleViewPriceChart(chart.id)}
                          >
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className="bg-orange-50 text-orange-700 border-orange-200 font-mono"
                              >
                                {chart.price_chart_code}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{chart.name}</TableCell>
                            <TableCell className="max-w-xs truncate text-muted-foreground">
                              {chart.description || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(chart.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="View Details"
                                  onClick={() => handleViewPriceChart(chart.id)}
                                  disabled={submitting}
                                  className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Edit"
                                  onClick={() => handleEditPriceChart(chart)}
                                  disabled={submitting}
                                  className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
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
                                      className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
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
                                      className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
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
                                    className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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

      {/* Create/Edit Price Chart Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !submitting && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingPriceChart ? (
                <>
                  <Pencil className="h-5 w-5 text-orange-600" />
                  Edit Price Chart
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 text-orange-600" />
                  Create New Price Chart
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingPriceChart
                ? "Update the price chart details below."
                : "Fill in the details to create a new price chart."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-medium">
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
              <Label htmlFor="description" className="text-right font-medium">
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
          <Separator />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)} 
              disabled={submitting}
              className="rounded-full mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePriceChart} 
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-full mt-2 sm:mt-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Price Chart"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
} 