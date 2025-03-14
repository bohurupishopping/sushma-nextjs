"use client";

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
  BarChart3,
  TrendingUp
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

// Mock data for salesmen
const salesmen = [
  {
    id: "S001",
    name: "James Wilson",
    email: "jwilson@example.com",
    phone: "+1 (555) 123-4567",
    region: "Northeast",
    performance: "excellent",
    sales: "$145,890",
    clients: 24,
  },
  {
    id: "S002",
    name: "Sarah Miller",
    email: "smiller@example.com",
    phone: "+1 (555) 234-5678",
    region: "West Coast",
    performance: "good",
    sales: "$98,450",
    clients: 18,
  },
  {
    id: "S003",
    name: "Robert Chen",
    email: "rchen@example.com",
    phone: "+1 (555) 345-6789",
    region: "Midwest",
    performance: "average",
    sales: "$67,230",
    clients: 12,
  },
  {
    id: "S004",
    name: "Emily Johnson",
    email: "ejohnson@example.com",
    phone: "+1 (555) 456-7890",
    region: "Southeast",
    performance: "excellent",
    sales: "$112,780",
    clients: 21,
  },
  {
    id: "S005",
    name: "David Kim",
    email: "dkim@example.com",
    phone: "+1 (555) 567-8901",
    region: "Northwest",
    performance: "poor",
    sales: "$34,120",
    clients: 8,
  },
];

// Performance data for chart
const performanceData = [
  { month: "Jan", sales: 65000 },
  { month: "Feb", sales: 72000 },
  { month: "Mar", sales: 68000 },
  { month: "Apr", sales: 92000 },
  { month: "May", sales: 110000 },
  { month: "Jun", sales: 125000 },
];

export default function SalesmanPage() {
  const { authState } = useAuth();

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
                <h1 className="text-3xl font-bold">Salesman</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage your sales team and track performance
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <Button className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add Salesman
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Salesman
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$532,470</div>
                  <div className="flex items-center text-sm text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>18% increase</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Average Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Good</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">83</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sales Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-2">
                    {performanceData.map((data) => (
                      <div key={data.month} className="flex flex-col items-center gap-2">
                        <div 
                          className="bg-primary/90 rounded-t-md w-12" 
                          style={{ 
                            height: `${(data.sales / 125000) * 250}px`,
                          }}
                        ></div>
                        <div className="text-xs font-medium">{data.month}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesmen
                      .filter(s => s.performance === "excellent")
                      .map((salesman) => (
                        <div key={salesman.id} className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {salesman.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{salesman.name}</div>
                            <div className="text-sm text-muted-foreground">{salesman.region}</div>
                          </div>
                          <div className="ml-auto font-medium">{salesman.sales}</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>All Salesman</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search salesman..." 
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FilterIcon className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Clients</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesmen.map((salesman) => (
                        <TableRow key={salesman.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {salesman.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{salesman.name}</div>
                                <div className="text-sm text-muted-foreground">{salesman.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {salesman.region}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                salesman.performance === "excellent" ? "secondary" : 
                                salesman.performance === "good" ? "default" :
                                salesman.performance === "average" ? "outline" : "destructive"
                              }
                            >
                              {salesman.performance}
                            </Badge>
                          </TableCell>
                          <TableCell>{salesman.sales}</TableCell>
                          <TableCell>{salesman.clients}</TableCell>
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
                                <DropdownMenuItem>View profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit details</DropdownMenuItem>
                                <DropdownMenuItem>View clients</DropdownMenuItem>
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