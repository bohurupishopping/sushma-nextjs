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
  SearchIcon,
  MoreHorizontal,
  UserCog,
  AlertCircle,
  CheckCircle2,
  XCircle
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { UserRole, UserStatus, Profile } from "@/types/user";
import { Separator } from "@/components/ui/separator";
import React from "react";

// Form schema for editing a profile
const profileFormSchema = z.object({
  display_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  role: z.enum(["user", "admin", "dealer", "worker", "salesman"] as const),
  status: z.enum(["active", "deactivated"] as const),
});

export default function ProfilePage() {
  const { authState } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: "",
      role: "user",
      status: "active",
    },
  });

  // Fetch profiles data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/profiles');
        if (!response.ok) {
          throw new Error('Failed to fetch profiles');
        }
        const profilesData = await response.json();
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error fetching data",
          description: "There was a problem fetching the profiles data.",
        });
        // Set empty profiles array to avoid undefined
        setProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Open edit dialog and set form values
  const handleEditProfile = (profile: Profile) => {
    setCurrentProfile(profile);
    form.reset({
      display_name: profile.display_name || '',
      role: profile.role,
      status: profile.status || 'active',
    });
    setIsEditDialogOpen(true);
  };

  // Handle form submission for updating a profile
  const handleUpdateProfile = async (values: z.infer<typeof profileFormSchema>) => {
    if (!currentProfile) return;
    
    try {
      const response = await fetch(`/api/profiles/${currentProfile.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      toast({
        title: "Profile updated successfully",
        description: `${values.display_name}'s profile has been updated.`,
        variant: "success"
      });

      // Refresh the profiles list
      const profilesResponse = await fetch('/api/profiles');
      if (!profilesResponse.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const profilesData = await profilesResponse.json();
      setProfiles(profilesData);

      // Reset form and close dialog
      form.reset();
      setIsEditDialogOpen(false);
      setCurrentProfile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: "There was a problem updating the profile.",
      });
    }
  };

  // Toggle user status (activate/deactivate)
  const handleToggleStatus = async (profile: Profile) => {
    try {
      const response = await fetch(`/api/profiles/${profile.user_id}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle user status');
      }

      const data = await response.json();
      
      toast({
        title: data.message,
        description: `${profile.display_name || 'User'}'s status has been updated.`,
        variant: "success"
      });

      // Refresh the profiles list
      const profilesResponse = await fetch('/api/profiles');
      if (!profilesResponse.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const profilesData = await profilesResponse.json();
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "There was a problem updating the user's status.",
      });
    }
  };

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter(profile => 
    profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get role badge variant
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "dealer":
        return "outline";
      case "worker":
        return "secondary";
      case "salesman":
        return "default";
      default:
        return "outline";
    }
  };

  // Get status badge and icon
  const getStatusBadge = (status: UserStatus) => {
    if (status === 'active') {
      return (
        <div key="active-status" className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Active</span>
        </div>
      );
    } else {
      return (
        <div key="deactivated-status" className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span>Deactivated</span>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen">
      {/* Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-purple-600">User Profiles</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage user accounts and roles
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 rounded-full">
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{profiles.length}</div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {profiles.filter(p => p.role === "admin").length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Dealers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {profiles.filter(p => p.role === "dealer").length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {profiles.filter(p => p.status === "active").length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">All User Profiles</CardTitle>
                <CardDescription>Manage and update user accounts</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search profiles..." 
                    className="pl-8 rounded-full bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2 rounded-full">
                  <FilterIcon className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                </div>
              ) : profiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No profiles found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    There are no user profiles in the system.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((profile) => (
                        <TableRow key={profile.user_id} className={profile.status === 'deactivated' ? 'opacity-60 bg-slate-50 dark:bg-slate-900/50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="border-2 border-purple-100">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.display_name || 'U'}`} />
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  {profile.display_name?.substring(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{profile.display_name || 'Unnamed User'}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {profile.user_id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(profile.role)} className="capitalize">
                              {profile.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(profile.status)}
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
                                <DropdownMenuItem 
                                  onClick={() => handleEditProfile(profile)}
                                  className="flex items-center gap-2 cursor-pointer"
                                  key={`edit-profile-${profile.user_id}`}
                                >
                                  <UserCog className="h-4 w-4" />
                                  Edit profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={profile.role}>
                                  <DropdownMenuRadioItem 
                                    key={`user-role-${profile.user_id}`}
                                    value="user"
                                    onClick={() => {
                                      handleEditProfile({...profile, role: "user"});
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Regular User
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem 
                                    key={`dealer-role-${profile.user_id}`}
                                    value="dealer"
                                    onClick={() => {
                                      handleEditProfile({...profile, role: "dealer"});
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Dealer
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem 
                                    key={`worker-role-${profile.user_id}`}
                                    value="worker"
                                    onClick={() => {
                                      handleEditProfile({...profile, role: "worker"});
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Worker
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem 
                                    key={`salesman-role-${profile.user_id}`}
                                    value="salesman"
                                    onClick={() => {
                                      handleEditProfile({...profile, role: "salesman"});
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Salesman
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem 
                                    key={`admin-role-${profile.user_id}`}
                                    value="admin"
                                    onClick={() => {
                                      handleEditProfile({...profile, role: "admin"});
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Admin
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className={`flex items-center gap-2 cursor-pointer ${profile.status === 'active' ? "text-destructive" : "text-green-600"}`}
                                  onClick={() => handleToggleStatus(profile)}
                                  key={`toggle-status-${profile.user_id}`}
                                >
                                  {profile.status === 'active' ? (
                                    <>
                                      <XCircle className="h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      Activate
                                    </>
                                  )}
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

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-purple-600" />
              Edit User Profile
            </DialogTitle>
            <DialogDescription>
              Update user information, role, and status. Changing a user's role will automatically create the appropriate role-specific record.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-5 py-4">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter display name" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">User Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Regular User</SelectItem>
                        <SelectItem value="dealer">Dealer</SelectItem>
                        <SelectItem value="worker">Worker</SelectItem>
                        <SelectItem value="salesman">Salesman</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Changing a user's role will automatically create the appropriate role-specific record.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">User Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="deactivated">Deactivated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Deactivated users cannot log in or access the system.
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
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full mt-2 sm:mt-0"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}