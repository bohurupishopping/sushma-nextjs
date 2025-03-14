"use client";

import { useEffect, useState } from "react";
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
  DownloadIcon, 
  FilterIcon, 
  PlusIcon, 
  SearchIcon,
  MoreHorizontal,
  MapPin,
  Phone,
  Store,
  UserCheck,
  AlertCircle,
  Pencil
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Define the dealer type
interface Dealer {
  id: string;
  user_id: string;
  name: string;
  dealer_code: string;
  salesman_id: string | null;
  price_chart_code: string | null;
  created_at: string;
  updated_at: string;
  profile_display_name?: string | null;
  profile_role?: string;
  price_chart_name?: string | null;
  price_chart_code_display?: string | null;
}

// Form schema for adding/editing a dealer
const dealerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional(),
  salesman_id: z.string().optional(),
  price_chart_code: z.string().optional(),
});

// Edit form schema without email requirement
const editDealerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  salesman_id: z.string().optional(),
  price_chart_code: z.string().optional(),
});

export default function DealerPage() {
  const { authState } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [priceCharts, setPriceCharts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentDealer, setCurrentDealer] = useState<Dealer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof dealerFormSchema>>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      salesman_id: "",
      price_chart_code: "",
    },
  });

  // Edit form
  const editForm = useForm<z.infer<typeof editDealerFormSchema>>({
    resolver: zodResolver(editDealerFormSchema),
    defaultValues: {
      name: "",
      salesman_id: "",
      price_chart_code: "",
    },
  });

  // Fetch dealers and salesmen data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch dealers from API
        const dealersResponse = await fetch('/api/dealers');
        if (!dealersResponse.ok) {
          throw new Error('Failed to fetch dealers');
        }
        const dealersData = await dealersResponse.json();
        setDealers(dealersData);
        
        // Fetch salesmen from API
        const salesmenResponse = await fetch('/api/profiles');
        if (!salesmenResponse.ok) {
          throw new Error('Failed to fetch salesmen');
        }
        const profilesData = await salesmenResponse.json();
        const salesmenData = profilesData.filter((profile: any) => profile.role === 'salesman');
        setSalesmen(salesmenData);
        
        // Fetch price charts from API
        const priceChartsResponse = await fetch('/api/price-charts');
        if (!priceChartsResponse.ok) {
          throw new Error('Failed to fetch price charts');
        }
        const priceChartsData = await priceChartsResponse.json();
        setPriceCharts(priceChartsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: "There was a problem fetching the dealers data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Make fetchData available for other functions
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Fetch dealers from API
      const dealersResponse = await fetch('/api/dealers');
      if (!dealersResponse.ok) {
        throw new Error('Failed to fetch dealers');
      }
      const dealersData = await dealersResponse.json();
      setDealers(dealersData);
    } catch (error) {
      console.error('Error refreshing dealers:', error);
      toast({
        variant: "destructive",
        title: "Error refreshing data",
        description: "There was a problem refreshing the dealers data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for adding a new dealer
  const handleAddDealer = async (values: z.infer<typeof dealerFormSchema>) => {
    try {
      const response = await fetch('/api/dealers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dealer');
      }

      toast({
        title: "Dealer added successfully",
        description: "The new dealer has been added to the system.",
      });

      // Refresh the dealers list
      const dealersResponse = await fetch('/api/dealers');
      if (!dealersResponse.ok) {
        throw new Error('Failed to fetch dealers');
      }
      const dealersData = await dealersResponse.json();
      setDealers(dealersData);

      // Reset form and close dialog
      form.reset();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding dealer:', error);
      toast({
        variant: "destructive",
        title: "Error adding dealer",
        description: "There was a problem adding the new dealer.",
      });
    }
  };

  // Handle form submission for updating a dealer
  const handleUpdateDealer = async (values: z.infer<typeof dealerFormSchema>) => {
    if (!currentDealer) return;
    
    try {
      const response = await fetch(`/api/dealers/${currentDealer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          salesman_id: values.salesman_id || null,
          price_chart_code: values.price_chart_code || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update dealer');
      }

      toast({
        title: "Dealer updated successfully",
        description: `${values.name}'s information has been updated.`,
      });

      // Refresh the dealers list
      await refreshData();

      // Reset form and close dialog
      editForm.reset();
      setIsEditDialogOpen(false);
      setCurrentDealer(null);
    } catch (error) {
      console.error('Error updating dealer:', error);
      toast({
        variant: "destructive",
        title: "Error updating dealer",
        description: "There was a problem updating the dealer information.",
      });
    }
  };

  // Open edit dialog and set form values
  const handleEditDealer = (dealer: Dealer) => {
    setCurrentDealer(dealer);
    editForm.reset({
      name: dealer.name,
      
      salesman_id: dealer.salesman_id || "",
      price_chart_code: dealer.price_chart_code || "",
    });
    setIsEditDialogOpen(true);
  };

  // Filter dealers based on search query
  const filteredDealers = dealers.filter(dealer => 
    dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dealer.dealer_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <h1 className="text-3xl font-bold text-orange-600">Dealer Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage your dealer network and partners
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 rounded-full"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Dealer
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Dealers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{dealers.length}</div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Dealers with Salesman
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {dealers.filter(d => d.salesman_id).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Dealers without Salesman
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {dealers.filter(d => !d.salesman_id).length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">All Dealers</CardTitle>
                  <CardDescription>{filteredDealers.length} dealers in your network</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 rounded-full"
                  onClick={refreshData}
                  disabled={isLoading}
                >
                  <FilterIcon className="h-4 w-4" />
                  Filter
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search dealers..." 
                      className="pl-8 rounded-full bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
                  </div>
                ) : dealers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No dealers found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      There are no dealers in the system.
                    </p>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                        >
                          Add your first dealer
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800">
                          <TableHead>Dealer</TableHead>
                          <TableHead>Dealer Code</TableHead>
                          <TableHead>Salesman</TableHead>
                          <TableHead>Price Chart</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDealers.map((dealer) => (
                          <TableRow key={dealer.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="border-2 border-orange-100">
                                  <AvatarFallback className="bg-orange-100 text-orange-700">
                                    {dealer.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{dealer.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {dealer.profile_display_name as string}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className="bg-orange-50 text-orange-700 border-orange-200 font-mono"
                              >
                                {dealer.dealer_code}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {dealer.salesman_id ? (
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4 text-green-500" />
                                  <span>Assigned</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <UserCheck className="h-4 w-4" />
                                  <span>Not assigned</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {dealer.price_chart_code ? (
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4 text-green-500" />
                                  <div>
                                    <span className="font-medium">{dealer.price_chart_name || 'Assigned'}</span>
                                    {dealer.price_chart_code_display && (
                                      <div className="text-xs text-muted-foreground">
                                        {dealer.price_chart_code_display}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Store className="h-4 w-4" />
                                  <span>Not assigned</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                    <Store className="h-4 w-4" />
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleEditDealer(dealer)}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit dealer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                    <UserCheck className="h-4 w-4" />
                                    Assign salesman
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                    <Store className="h-4 w-4" />
                                    Assign price chart
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      {/* Edit Dealer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-orange-600" />
              Edit Dealer
            </DialogTitle>
            <DialogDescription>
              Update dealer information and assignments.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateDealer)} className="space-y-5 py-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Dealer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dealer name" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="salesman_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Assigned Salesman</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">None (Unassigned)</option>
                        {salesmen.map((salesman) => (
                          <option key={salesman.user_id} value={salesman.user_id}>
                            {salesman.display_name || salesman.user_id}
                            {currentDealer?.salesman_id === salesman.user_id ? ' (Current)' : ''}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      The salesman responsible for this dealer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="price_chart_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Price Chart</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">None (Unassigned)</option>
                        {priceCharts.map((chart) => (
                          <option key={chart.id} value={chart.id}>
                            {chart.name} ({chart.price_chart_code})
                            {currentDealer?.price_chart_code === chart.id ? ' (Current)' : ''}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      The price chart assigned to this dealer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator className="my-2" />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="rounded-full mt-2 sm:mt-0"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-full mt-2 sm:mt-0"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Dealer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-orange-600" />
              Add New Dealer
            </DialogTitle>
            <DialogDescription>
              Create a new dealer account. This will also create a user account with dealer role.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddDealer)} className="space-y-5 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Dealer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dealer name" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="dealer@example.com" {...field} className="bg-background" />
                    </FormControl>
                    <FormDescription>
                      This will be used for login credentials.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesman_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Assigned Salesman (Optional)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">None (Unassigned)</option>
                        {salesmen.map((salesman) => (
                          <option key={salesman.user_id} value={salesman.user_id}>
                            {salesman.display_name || salesman.user_id}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_chart_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Price Chart (Optional)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">None (Unassigned)</option>
                        {priceCharts.map((chart) => (
                          <option key={chart.id} value={chart.id}>
                            {chart.name} ({chart.price_chart_code})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      The price chart assigned to this dealer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator className="my-2" />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="rounded-full mt-2 sm:mt-0"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-full mt-2 sm:mt-0"
                >
                  Add Dealer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
} 