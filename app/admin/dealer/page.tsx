"use client";

import { useEffect, useState } from "react";
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
  DownloadIcon, 
  FilterIcon, 
  PlusIcon, 
  SearchIcon,
  MoreHorizontal,
  MapPin,
  Phone,
  Store,
  UserCheck,
  AlertCircle
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
import { supabase } from "@/lib/supabase";
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
}

// Form schema for adding/editing a dealer
const dealerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  salesman_id: z.string().optional(),
  price_chart_code: z.string().optional(),
});

export default function DealerPage() {
  const { authState } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  // Fetch dealers and salesmen data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch dealers without trying to use foreign key relationships
        const { data: dealersData, error: dealersError } = await supabase
          .from('dealers')
          .select('*');

        if (dealersError) throw dealersError;
        
        // Fetch profiles separately
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, role');
          
        if (profilesError) throw profilesError;
        
        // Create a map of user_id to profile data
        const profileMap = new Map();
        profilesData?.forEach(profile => {
          profileMap.set(profile.user_id, profile);
        });
        
        // Combine dealer data with profile data
        const formattedDealers = dealersData?.map(dealer => {
          const profile = profileMap.get(dealer.user_id);
          return {
            ...dealer,
            profile_display_name: profile?.display_name || null,
            profile_role: profile?.role || null
          };
        }) || [];
        
        // Fetch salesmen
        const { data: salesmenData, error: salesmenError } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .eq('role', 'salesman');

        if (salesmenError) throw salesmenError;

        setDealers(formattedDealers);
        setSalesmen(salesmenData || []);
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

  // Handle form submission for adding a new dealer
  const handleAddDealer = async (values: z.infer<typeof dealerFormSchema>) => {
    try {
      // First create a new user with dealer role
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: values.email,
        email_confirm: true,
        user_metadata: { name: values.name },
        role: "dealer",
      });

      if (userError) throw userError;

      // The dealer record should be created automatically via the trigger
      // But we can update it with additional info
      if (values.salesman_id || values.price_chart_code) {
        const { error: updateError } = await supabase
          .from('dealers')
          .update({
            salesman_id: values.salesman_id || null,
            price_chart_code: values.price_chart_code || null,
          })
          .eq('user_id', userData.user.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Dealer added successfully",
        description: "The new dealer has been added to the system.",
      });

      // Refresh the dealers list using the same approach as in fetchData
      const { data: dealersData, error: dealersError } = await supabase
        .from('dealers')
        .select('*');

      if (dealersError) throw dealersError;
      
      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, role');
        
      if (profilesError) throw profilesError;
      
      // Create a map of user_id to profile data
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });
      
      // Combine dealer data with profile data
      const formattedDealers = dealersData?.map(dealer => {
        const profile = profileMap.get(dealer.user_id);
        return {
          ...dealer,
          profile_display_name: profile?.display_name || null,
          profile_role: profile?.role || null
        };
      }) || [];
      
      setDealers(formattedDealers);

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
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Dealers</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage your dealer network and partners
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Add Dealer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Dealer</DialogTitle>
                      <DialogDescription>
                        Create a new dealer account. This will also create a user account with dealer role.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddDealer)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dealer Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter dealer name" {...field} />
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="dealer@example.com" {...field} />
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
                              <FormLabel>Assigned Salesman (Optional)</FormLabel>
                              <FormControl>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                >
                                  <option value="">Select a salesman</option>
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
                        <DialogFooter>
                          <Button type="submit">Add Dealer</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Dealers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dealers.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Dealers with Salesman
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dealers.filter(d => d.salesman_id).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Dealers without Salesman
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dealers.filter(d => !d.salesman_id).length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>All Dealers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search dealers..." 
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FilterIcon className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : dealers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No dealers found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get started by adding your first dealer.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
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
                                <Avatar>
                                  <AvatarFallback>
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
                              <Badge variant="outline" className="font-mono">
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
                                  <span>Assigned</span>
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
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>View details</DropdownMenuItem>
                                  <DropdownMenuItem>Edit dealer</DropdownMenuItem>
                                  <DropdownMenuItem>Assign salesman</DropdownMenuItem>
                                  <DropdownMenuItem>Assign price chart</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
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
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 