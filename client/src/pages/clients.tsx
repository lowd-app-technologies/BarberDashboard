import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useNavigate } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";
import { Users, User, UserPlus, Search, MoreHorizontal, Calendar, ScissorsIcon, Scissors, Heart, NotebookPen, UserCircle2, Clock, Phone, Mail, MapPin } from "lucide-react";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const userRole = useRole();
  const [, navigate] = useNavigate();
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  
  // Fetch clients
  const { 
    data: clients = [],
    isLoading: isLoadingClients,
    error: clientsError,
  } = useQuery({
    queryKey: ['/api/clients'],
    enabled: userRole === 'admin' || userRole === 'barber'
  });
  
  // Fetch recent clients
  const { 
    data: recentClients = [],
    isLoading: isLoadingRecentClients,
  } = useQuery({
    queryKey: ['/api/clients/recent'],
    enabled: userRole === 'admin' || userRole === 'barber'
  });
  
  // Fetch selected client details when needed
  const {
    data: clientDetails,
    isLoading: isLoadingClientDetails,
  } = useQuery({
    queryKey: ['/api/clients', selectedClient],
    enabled: !!selectedClient && showClientDetailsDialog,
  });
  
  // Handle search
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      client.fullName?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower) ||
      client.profile?.city?.toLowerCase().includes(searchLower)
    );
  });
  
  // Show client details
  const handleViewClient = (clientId: number) => {
    setSelectedClient(clientId);
    setShowClientDetailsDialog(true);
  };
  
  // Error handling
  if (clientsError) {
    toast({
      title: "Error loading clients",
      description: "There was a problem loading the client list.",
      variant: "destructive",
    });
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">Manage your clients and their preferences</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Active client accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recentClients.length}</div>
            <p className="text-xs text-muted-foreground">New clients in last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Scheduled for next 7 days</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients by name, email, or phone..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Clients</TabsTrigger>
          <TabsTrigger value="recent">Recent Clients</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Clients</CardTitle>
              <CardDescription>
                View and manage all your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClients ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "No results match your search criteria." : "Start by adding a new client."}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead>Preferred Barber</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(client.fullName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{client.fullName}</div>
                                <div className="text-sm text-muted-foreground">{client.profile?.city || "No location"}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span className="text-sm">{client.email}</span>
                              </div>
                              {client.phone && (
                                <div className="flex items-center mt-1">
                                  <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  <span className="text-sm">{client.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.profile?.lastVisit ? (
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span>{formatDate(client.profile.lastVisit)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {client.preferences?.preferredBarberId ? (
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="text-xs">AB</AvatarFallback>
                                </Avatar>
                                <span>Preferred Barber Name</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewClient(client.id)}>
                                  <UserCircle2 className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Schedule Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <NotebookPen className="mr-2 h-4 w-4" />
                                  Add Note
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  Delete Client
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredClients.length} of {clients.length} clients
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>
                View your recent clients and their last appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecentClients ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : recentClients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No recent clients</h3>
                  <p className="text-muted-foreground">No clients have visited recently.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recentClients.map((client) => (
                    <Card key={client.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarFallback>{getInitials(client.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{client.fullName}</CardTitle>
                              <CardDescription>{client.profile?.city || "No location"}</CardDescription>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-7 w-7">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add to favorites</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Last Visit: {client.profile?.lastVisit ? formatDate(client.profile.lastVisit) : "Never"}</span>
                          </div>
                          <div className="flex items-center">
                            <Scissors className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Services: Haircut, Beard Trim</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/50 px-6 py-3">
                        <Button variant="outline" className="w-full" onClick={() => handleViewClient(client.id)}>
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Clients</CardTitle>
              <CardDescription>
                Your marked favorite clients for quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">No favorite clients yet</h3>
                <p className="text-muted-foreground">
                  Mark clients as favorites for quick access.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Client Details Dialog */}
      <Dialog open={showClientDetailsDialog} onOpenChange={setShowClientDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              View and manage client information, preferences and history
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingClientDetails ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : clientDetails ? (
            <div className="space-y-6">
              {/* Client Basic Info */}
              <div className="flex gap-4 items-start">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">{getInitials(clientDetails.fullName)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <h2 className="text-xl font-semibold">{clientDetails.fullName}</h2>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{clientDetails.email}</span>
                    </div>
                    {clientDetails.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{clientDetails.phone}</span>
                      </div>
                    )}
                    {clientDetails.profile?.city && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{clientDetails.profile.city}</span>
                      </div>
                    )}
                    {clientDetails.profile?.lastVisit && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Last visit: {formatDate(clientDetails.profile.lastVisit)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button>Edit Profile</Button>
              </div>
              
              {/* Client Preferences */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Hair Preferences</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Hair Type:</span>
                        <span className="text-sm font-medium">{clientDetails.preferences?.hairType || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Preferred Style:</span>
                        <span className="text-sm font-medium">{clientDetails.preferences?.preferredHairStyle || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Beard Preferences</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Beard Type:</span>
                        <span className="text-sm font-medium">{clientDetails.preferences?.beardType || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Preferred Style:</span>
                        <span className="text-sm font-medium">{clientDetails.preferences?.preferredBeardStyle || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Scheduling Preferences</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Preferred Barber:</span>
                        <span className="text-sm font-medium">
                          {clientDetails.preferences?.preferredBarberId 
                            ? "Barber Name" 
                            : "No preference"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Preferred Day:</span>
                        <span className="text-sm font-medium">
                          {clientDetails.preferences?.preferredDayOfWeek 
                            ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][clientDetails.preferences.preferredDayOfWeek] 
                            : "No preference"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Preferred Time:</span>
                        <span className="text-sm font-medium">
                          {clientDetails.preferences?.preferredTimeOfDay || "No preference"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Additional Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Allergies:</span>
                        <span className="text-sm font-medium">{clientDetails.preferences?.allergies || "None"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Notes:</span>
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {clientDetails.profile?.notes || "No notes"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button variant="outline" size="sm">Edit Preferences</Button>
                </div>
              </div>
              
              {/* Appointment History */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Appointment History</h3>
                {clientDetails.appointments && clientDetails.appointments.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Barber</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientDetails.appointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{formatDate(appointment.date)}</TableCell>
                            <TableCell>{appointment.service.name}</TableCell>
                            <TableCell>{appointment.barber.user.fullName}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  appointment.status === "completed" ? "default" :
                                  appointment.status === "confirmed" ? "success" :
                                  appointment.status === "pending" ? "warning" : "destructive"
                                }
                              >
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-lg">
                    <Calendar className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                    <h3 className="mt-2 text-base font-semibold">No appointments yet</h3>
                    <p className="text-sm text-muted-foreground">
                      This client hasn't had any appointments yet.
                    </p>
                    <Button variant="outline" className="mt-4">
                      Schedule Appointment
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Notes and Favorites */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <NotebookPen className="mr-2 h-5 w-5" />
                    Barber Notes
                  </h3>
                  {clientDetails.notes && clientDetails.notes.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {clientDetails.notes.map((note) => (
                        <div key={note.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-sm">Barber Name</div>
                            <div className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</div>
                          </div>
                          <p className="mt-1 text-sm">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No notes yet</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <Button variant="outline" size="sm" className="w-full">Add Note</Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Heart className="mr-2 h-5 w-5" />
                    Favorite Services
                  </h3>
                  {clientDetails.favoriteServices && clientDetails.favoriteServices.length > 0 ? (
                    <div className="space-y-2">
                      {clientDetails.favoriteServices.map((favorite) => (
                        <div key={favorite.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Scissors className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{favorite.service.name}</span>
                          </div>
                          <Badge variant="outline">${favorite.service.price}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No favorite services</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <Button variant="outline" size="sm" className="w-full">Add Favorite Service</Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>No client details available</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDetailsDialog(false)}>
              Close
            </Button>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}