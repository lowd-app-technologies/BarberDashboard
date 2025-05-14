import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { NotificationsPanel } from "@/components/barber/NotificationsPanel";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatTime } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  UserRound,
  Check,
  X,
  CalendarIcon,
  CircleSlash,
  Scissors,
  AlertCircle,
  Calendar,
  Plus,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Appointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Buscar todos os agendamentos para admin, apenas os do barbeiro para função barber
  const endpoint = user?.role === "barber" ? "/api/barber/appointments" : "/api/appointments";
  
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });
  
  // Confirmar agendamento
  const confirmAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/appointments/${id}/confirm`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({
        title: "Agendamento confirmado",
        description: "O agendamento foi confirmado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar agendamento",
        description: error.message || "Ocorreu um erro ao confirmar o agendamento.",
        variant: "destructive"
      });
    }
  });
  
  // Completar agendamento
  const completeAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/appointments/${id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({
        title: "Serviço concluído",
        description: "O serviço foi marcado como concluído."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao concluir serviço",
        description: error.message || "Ocorreu um erro ao concluir o serviço.",
        variant: "destructive"
      });
    }
  });
  
  // Cancelar agendamento
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/appointments/${id}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar agendamento",
        description: error.message || "Ocorreu um erro ao cancelar o agendamento.",
        variant: "destructive"
      });
    }
  });
  
  // Ações para agendamentos
  const handleConfirmAppointment = (id: number) => {
    confirmAppointmentMutation.mutate(id);
  };
  
  const handleCompleteAppointment = (id: number) => {
    completeAppointmentMutation.mutate(id);
  };
  
  const handleCancelAppointment = (id: number) => {
    cancelAppointmentMutation.mutate(id);
  };
  
  // Filtrar agendamentos por status e data
  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filtragem inicial por período (tab)
    let filtered = [...appointments];
    if (activeTab === "upcoming") {
      filtered = filtered.filter((appointment: any) => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= today;
      });
    } else if (activeTab === "past") {
      filtered = filtered.filter((appointment: any) => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate < today;
      });
    }
    
    // Adicionar filtro por status se não for "all"
    if (filterStatus !== "all") {
      filtered = filtered.filter((appointment: any) => appointment.status === filterStatus);
    }
    
    // Adicionar filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((appointment: any) => {
        return (
          appointment.client?.fullName?.toLowerCase().includes(term) ||
          appointment.barber?.user?.fullName?.toLowerCase().includes(term) ||
          appointment.service?.name?.toLowerCase().includes(term)
        );
      });
    }
    
    return filtered;
  };
  
  const filteredAppointments = filterAppointments();
  
  // Traduzir status
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Concluído",
      canceled: "Cancelado",
      all: "Todos"
    };
    return statusMap[status] || status;
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Mobile Notifications for barbers */}
        {user?.role === "barber" && (
          <div className="md:hidden mb-4">
            <NotificationsPanel />
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie todos os agendamentos</p>
          </div>
          
          <div className="w-full sm:w-auto space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar agendamentos..."
                className="pl-8 w-full sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {user?.role === "admin" && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lista de Agendamentos</CardTitle>
                <CardDescription>
                  Visualize e gerencie agendamentos futuros e passados
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-background border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="confirmed">Confirmados</option>
                    <option value="completed">Concluídos</option>
                    <option value="canceled">Cancelados</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                <TabsTrigger value="past">Passados</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando agendamentos...</div>
                ) : filteredAppointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data e Hora</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Barbeiro</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment: any) => (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <span>{formatDate(appointment.date)}</span>
                                </div>
                                <div className="flex items-center text-muted-foreground text-sm">
                                  <Clock className="mr-2 h-3 w-3" />
                                  <span>{formatTime(appointment.date)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback>
                                    {appointment.client?.fullName?.substring(0, 2).toUpperCase() || "CL"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{appointment.client?.fullName || "Cliente"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {appointment.client?.phone || "Sem telefone"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Scissors className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{appointment.service?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback>
                                    {appointment.barber?.user?.fullName?.substring(0, 2).toUpperCase() || "BR"}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{appointment.barber?.user?.fullName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={appointment.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                {appointment.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-[hsl(var(--success))]"
                                      onClick={() => handleConfirmAppointment(appointment.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="sr-only">Confirmar</span>
                                    </Button>
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive"
                                        >
                                          <X className="h-4 w-4" />
                                          <span className="sr-only">Cancelar</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleCancelAppointment(appointment.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Sim, cancelar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                                
                                {appointment.status === "confirmed" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-[hsl(var(--success))]"
                                      onClick={() => handleCompleteAppointment(appointment.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="sr-only">Concluir</span>
                                    </Button>
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive"
                                        >
                                          <X className="h-4 w-4" />
                                          <span className="sr-only">Cancelar</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleCancelAppointment(appointment.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Sim, cancelar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum agendamento encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || filterStatus !== "all"
                        ? "Nenhum agendamento corresponde aos filtros aplicados"
                        : "Não há agendamentos futuros no sistema"}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="past">
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando agendamentos...</div>
                ) : filteredAppointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data e Hora</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Barbeiro</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment: any) => (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <span>{formatDate(appointment.date)}</span>
                                </div>
                                <div className="flex items-center text-muted-foreground text-sm">
                                  <Clock className="mr-2 h-3 w-3" />
                                  <span>{formatTime(appointment.date)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback>
                                    {appointment.client?.fullName?.substring(0, 2).toUpperCase() || "CL"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{appointment.client?.fullName || "Cliente"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {appointment.client?.phone || "Sem telefone"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Scissors className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{appointment.service?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback>
                                    {appointment.barber?.user?.fullName?.substring(0, 2).toUpperCase() || "BR"}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{appointment.barber?.user?.fullName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={appointment.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum agendamento encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || filterStatus !== "all"
                        ? "Nenhum agendamento corresponde aos filtros aplicados"
                        : "Não há agendamentos passados no sistema"}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          {filteredAppointments.length > 0 && (
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredAppointments.length} agendamentos
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </Layout>
  );
}

// Componente para o badge de status
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
    pending: { 
      label: "Pendente", 
      variant: "outline" 
    },
    confirmed: { 
      label: "Confirmado", 
      variant: "default"
    },
    completed: { 
      label: "Concluído", 
      variant: "secondary"
    },
    canceled: { 
      label: "Cancelado", 
      variant: "destructive"
    }
  };
  
  const config = statusConfig[status] || { label: status, variant: "outline" };
  
  return (
    <Badge variant={config.variant}>{config.label}</Badge>
  );
}