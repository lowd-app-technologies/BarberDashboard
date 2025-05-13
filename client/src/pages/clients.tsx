import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
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
import { Users, UserPlus, Search, MoreHorizontal, Calendar, Scissors, Heart, NotebookPen, UserCircle2, Clock, Phone, Mail, MapPin } from "lucide-react";

// Interfaces
interface ClientProfile {
  id: number;
  userId: number;
  createdAt: Date;
  birthdate: Date | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  referralSource: string | null;
  notes: string | null;
  lastVisit: Date | null;
}

interface ClientPreference {
  id: number;
  clientId: number;
  createdAt: Date;
  updatedAt: Date;
  preferredBarberId: number | null;
  preferredDayOfWeek: number | null;
  preferredTimeOfDay: string | null;
  hairType: "straight" | "wavy" | "curly" | "coily" | null;
  beardType: "none" | "stubble" | "short" | "medium" | "long" | "full" | null;
  preferredHairStyle: string | null;
  preferredBeardStyle: string | null;
  allergies: string | null;
}

interface ClientNote {
  id: number;
  barberId: number;
  clientId: number;
  createdAt: Date;
  note: string;
  appointmentId: number | null;
}

interface Service {
  id: number;
  name: string;
  price: string;
  duration: number;
  description: string | null;
  active: boolean;
  createdAt: Date;
}

interface ClientFavoriteService {
  id: number;
  clientId: number;
  serviceId: number;
  createdAt: Date;
  service: Service;
}

interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "admin" | "barber" | "client";
  active: boolean;
  createdAt: Date;
}

interface Barber {
  id: number;
  userId: number;
  nif: string;
  iban: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  specialty: string | null;
  active: boolean;
  createdAt: Date;
}

interface BarberWithUser extends Barber {
  user: User;
}

interface Appointment {
  id: number;
  date: Date;
  barberId: number;
  serviceId: number;
  clientId: number;
  status: "pending" | "confirmed" | "completed" | "canceled";
  notes: string | null;
  createdAt: Date;
}

interface AppointmentWithDetails extends Appointment {
  client: User;
  barber: BarberWithUser;
  service: Service;
}

interface ClientWithProfile extends User {
  profile: ClientProfile;
}

interface ClientWithPreferences extends ClientWithProfile {
  preferences: ClientPreference;
}

interface ClientWithDetails extends ClientWithPreferences {
  notes: ClientNote[];
  favoriteServices: ClientFavoriteService[];
  appointments: AppointmentWithDetails[];
}

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const userRole = useRole();
  const [, navigate] = useLocation();
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  
  // Mova o useToast para depois de todas as inicializações de estado
  const { toast } = useToast();
  
  // Fetch clients
  const { 
    data: clients = [] as ClientWithProfile[],
    isLoading: isLoadingClients,
    error: clientsError,
  } = useQuery<ClientWithProfile[]>({
    queryKey: ['/api/clients'],
    enabled: userRole === 'admin' || userRole === 'barber'
  });
  
  // Fetch recent clients
  const { 
    data: recentClients = [] as ClientWithProfile[],
    isLoading: isLoadingRecentClients,
  } = useQuery<ClientWithProfile[]>({
    queryKey: ['/api/clients/recent'],
    enabled: userRole === 'admin' || userRole === 'barber'
  });
  
  // Fetch selected client details when needed
  const {
    data: clientDetails,
    isLoading: isLoadingClientDetails,
  } = useQuery<ClientWithDetails>({
    queryKey: ['/api/clients', selectedClient],
    enabled: !!selectedClient && showClientDetailsDialog,
  });
  
  // Handle search
  const getFilteredClients = () => {
    if (!searchTerm) return clients;
    
    const searchLower = searchTerm.toLowerCase();
    return clients.filter((client: ClientWithProfile) => {
      return (
        client.fullName.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        (client.phone && client.phone.toLowerCase().includes(searchLower)) ||
        (client.profile.city && client.profile.city.toLowerCase().includes(searchLower))
      );
    });
  };
  
  // Calculate filtered clients outside of render
  const filteredClients = getFilteredClients();
  
  // Show client details
  const handleViewClient = (clientId: number) => {
    setSelectedClient(clientId);
    setShowClientDetailsDialog(true);
  };
  
  // Error handling
  useEffect(() => {
    if (clientsError) {
      toast({
        title: "Error loading clients",
        description: "There was a problem loading the client list.",
        variant: "destructive",
      });
    }
  }, [clientsError, toast]);
  
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Client Management</h1>
            <p className="text-muted-foreground">Manage your clients and their preferences</p>
          </div>
          <Button onClick={() => setShowAddClientDialog(true)}>
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
              <CardTitle className="text-lg font-medium">New Clients (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {clients.filter(c => {
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return new Date(c.createdAt) >= thirtyDaysAgo;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Clients added in the last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Average Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2.4</div>
              <p className="text-xs text-muted-foreground">Avg. visits per client</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Clients</TabsTrigger>
            <TabsTrigger value="recent">Recent Clients</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client List</CardTitle>
                <CardDescription>
                  Manage and view all your clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Try a different search term" : "Add clients to get started"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src="" />
                                <AvatarFallback>{getInitials(client.fullName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                {client.fullName}
                                {client.profile.notes && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="ml-2 text-xs">Note</Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">{client.profile.notes}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{client.email}</div>
                              {client.phone && <div className="text-muted-foreground">{client.phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.profile.city ? (
                              client.profile.city
                            ) : (
                              <span className="text-muted-foreground">Not specified</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {client.profile.lastVisit ? (
                              formatDate(client.profile.lastVisit)
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
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
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem>Edit client</DropdownMenuItem>
                                <DropdownMenuItem>Add note</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Book appointment</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Clients</CardTitle>
                <CardDescription>
                  Clients who have recently visited your shop
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRecentClients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : recentClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">No recent clients</h3>
                    <p className="text-muted-foreground">
                      Clients who visit will appear here
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recentClients.map((client) => (
                      <Card key={client.id} className="overflow-hidden">
                        <CardHeader className="p-4">
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarImage src="" />
                              <AvatarFallback>{getInitials(client.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{client.fullName}</CardTitle>
                              <CardDescription>{client.email}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-sm space-y-2">
                            {client.profile.lastVisit && (
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="mr-2 h-4 w-4" />
                                <span>Last visit: {formatDate(client.profile.lastVisit)}</span>
                              </div>
                            )}
                            {client.profile.city && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="mr-2 h-4 w-4" />
                                <span>{client.profile.city}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t p-4">
                          <Button 
                            variant="ghost" 
                            className="w-full" 
                            onClick={() => handleViewClient(client.id)}
                          >
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
          
          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Clients</CardTitle>
                <CardDescription>
                  View and manage your favorite clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No favorite clients yet</h3>
                  <p className="text-muted-foreground">
                    Mark clients as favorites to see them here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Client Details Dialog */}
      <Dialog open={showClientDetailsDialog} onOpenChange={setShowClientDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              View detailed information about this client
            </DialogDescription>
          </DialogHeader>
          {clientDetails ? (
            <div className="space-y-6">
              {/* Client Profile */}
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  {/* Client Info */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <UserCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{clientDetails.fullName}</span>
                      </div>
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
                      {clientDetails.profile.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {clientDetails.profile.address}, 
                            {clientDetails.profile.city && ` ${clientDetails.profile.city}`}
                            {clientDetails.profile.postalCode && ` ${clientDetails.profile.postalCode}`}
                          </span>
                        </div>
                      )}
                      {clientDetails.profile.birthdate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Birthdate: {formatDate(clientDetails.profile.birthdate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Client Preferences */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Preferences</h3>
                    {clientDetails.preferences ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Hair & Beard</h4>
                          <ul className="space-y-2">
                            <li className="flex items-start">
                              <span className="font-medium mr-2">Hair Type:</span>
                              <span>{clientDetails.preferences.hairType || "Not specified"}</span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium mr-2">Beard Type:</span>
                              <span>{clientDetails.preferences.beardType || "Not specified"}</span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium mr-2">Preferred Style:</span>
                              <span>{clientDetails.preferences.preferredHairStyle || "Not specified"}</span>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Scheduling</h4>
                          <ul className="space-y-2">
                            <li className="flex items-start">
                              <span className="font-medium mr-2">Preferred Day:</span>
                              <span>
                                {clientDetails.preferences.preferredDayOfWeek !== null 
                                  ? new Date(0, 0, clientDetails.preferences.preferredDayOfWeek).toLocaleString('en-US', { weekday: 'long' })
                                  : "Not specified"}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium mr-2">Preferred Time:</span>
                              <span>{clientDetails.preferences.preferredTimeOfDay || "Not specified"}</span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium mr-2">Allergies:</span>
                              <span>{clientDetails.preferences.allergies || "None"}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No preferences set</div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  {/* Recent Appointments */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Recent Appointments</h3>
                      <Button variant="outline" size="sm">Book New</Button>
                    </div>
                    
                    {clientDetails.appointments.length > 0 ? (
                      <div className="space-y-3">
                        {clientDetails.appointments.slice(0, 3).map(appointment => (
                          <div key={appointment.id} className="flex justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <div className="font-medium">{appointment.service.name}</div>
                              <div className="text-xs text-muted-foreground">
                                with {appointment.barber.user.fullName}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatDate(appointment.date)}</div>
                              <div className="text-xs text-muted-foreground">
                                Status: {appointment.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No appointment history</div>
                    )}
                  </div>
                  
                  {/* Favorite Services */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Favorite Services</h3>
                    
                    {clientDetails.favoriteServices.length > 0 ? (
                      <div className="space-y-2">
                        {clientDetails.favoriteServices.map(favorite => (
                          <div key={favorite.id} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Scissors className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{favorite.service.name}</span>
                            </div>
                            <Badge>{favorite.service.price}€</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No favorite services</div>
                    )}
                  </div>
                  
                  {/* Notes */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Notes</h3>
                      <Button variant="outline" size="sm">Add Note</Button>
                    </div>
                    
                    {clientDetails.notes.length > 0 ? (
                      <div className="space-y-3">
                        {clientDetails.notes.map(note => (
                          <div key={note.id} className="border-l-2 border-primary pl-3">
                            <p className="text-sm">{note.note}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-muted-foreground">
                                by Barber #{note.barberId}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(note.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No notes yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : isLoadingClientDetails ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Client details not available
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Client Dialog */}
      {/* This would be implemented with a form for adding new clients */}
      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the details for the new client
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              This feature is coming soon
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClientDialog(false)}>Cancel</Button>
            <Button>Add Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}