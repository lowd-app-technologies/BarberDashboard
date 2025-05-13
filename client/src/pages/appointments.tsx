import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Search, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FilterIcon,
  Scissors,
  UserRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [barberFilter, setBarberFilter] = useState("all");
  const { toast } = useToast();
  
  // Fetch appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointments'],
  });
  
  // Fetch barbers for filter
  const { data: barbers } = useQuery({
    queryKey: ['/api/barbers'],
  });
  
  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number, status: string }) => {
      await apiRequest("PATCH", `/api/appointments/${appointmentId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Status atualizado",
        description: "O status do agendamento foi atualizado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Filter appointments
  const filteredAppointments = appointments 
    ? appointments.filter((appointment: any) => {
        // Text search filter
        const matchesSearch = 
          appointment.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.barber.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
        
        // Date filter
        const matchesDate = !dateFilter || 
          new Date(appointment.date).toDateString() === dateFilter.toDateString();
        
        // Barber filter
        const matchesBarber = barberFilter === "all" || 
          appointment.barber.id.toString() === barberFilter;
        
        return matchesSearch && matchesStatus && matchesDate && matchesBarber;
      })
    : [];
  
  // Handle status change
  const handleStatusChange = (appointmentId: number, status: string) => {
    updateStatusMutation.mutate({ appointmentId, status });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter(undefined);
    setBarberFilter("all");
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-[hsl(var(--success))]">Confirmado</Badge>;
      case 'completed':
        return <Badge className="bg-primary">Concluído</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline" className="border-[hsl(var(--warning))] text-[hsl(var(--warning))]">Pendente</Badge>;
    }
  };
  
  // Get localized appointment status name
  const getStatusName = (status: string) => {
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Sidebar />
      
      {/* Mobile Header */}
      <header className="bg-card p-4 flex justify-between items-center md:hidden">
        <h1 className="text-primary text-xl font-bold">BarberPro</h1>
        <button className="text-foreground">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Agendamentos</h1>
          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar agendamentos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="ml-auto flex">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Filtros
                  {(statusFilter !== "all" || dateFilter || barberFilter !== "all") && (
                    <Badge className="ml-2 bg-primary">!</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrar Agendamentos</h4>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data</label>
                    <DatePicker 
                      date={dateFilter} 
                      setDate={setDateFilter} 
                      className="w-full" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Barbeiro</label>
                    <Select
                      value={barberFilter}
                      onValueChange={setBarberFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {barbers && barbers.map((barber: any) => (
                          <SelectItem 
                            key={barber.id} 
                            value={barber.id.toString()}
                          >
                            {barber.user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearFilters} 
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="past">Passados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <AppointmentList 
              appointments={filteredAppointments} 
              isLoading={isLoadingAppointments}
              onStatusChange={handleStatusChange}
              searchTerm={searchTerm}
            />
          </TabsContent>
          
          <TabsContent value="today">
            <AppointmentList 
              appointments={filteredAppointments.filter((appointment: any) => {
                const today = new Date();
                const appointmentDate = new Date(appointment.date);
                return appointmentDate.toDateString() === today.toDateString();
              })} 
              isLoading={isLoadingAppointments}
              onStatusChange={handleStatusChange}
              searchTerm={searchTerm}
              emptyMessage="Não há agendamentos para hoje."
            />
          </TabsContent>
          
          <TabsContent value="upcoming">
            <AppointmentList 
              appointments={filteredAppointments.filter((appointment: any) => {
                const now = new Date();
                const appointmentDate = new Date(appointment.date);
                return appointmentDate > now;
              })} 
              isLoading={isLoadingAppointments}
              onStatusChange={handleStatusChange}
              searchTerm={searchTerm}
              emptyMessage="Não há agendamentos futuros."
            />
          </TabsContent>
          
          <TabsContent value="past">
            <AppointmentList 
              appointments={filteredAppointments.filter((appointment: any) => {
                const now = new Date();
                const appointmentDate = new Date(appointment.date);
                return appointmentDate < now;
              })} 
              isLoading={isLoadingAppointments}
              onStatusChange={handleStatusChange}
              searchTerm={searchTerm}
              emptyMessage="Não há agendamentos passados."
            />
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNavigation />
    </div>
  );
}

// Appointment List component
interface AppointmentListProps {
  appointments: any[];
  isLoading: boolean;
  onStatusChange: (appointmentId: number, status: string) => void;
  searchTerm: string;
  emptyMessage?: string;
}

function AppointmentList({ 
  appointments, 
  isLoading, 
  onStatusChange,
  searchTerm,
  emptyMessage = "Não há agendamentos."
}: AppointmentListProps) {
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-[hsl(var(--success))]">Confirmado</Badge>;
      case 'completed':
        return <Badge className="bg-primary">Concluído</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline" className="border-[hsl(var(--warning))] text-[hsl(var(--warning))]">Pendente</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Agendamentos</CardTitle>
        <CardDescription>
          Gerencie os agendamentos da barbearia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando agendamentos...</div>
        ) : appointments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchTerm ? "Nenhum agendamento encontrado com esse termo." : emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Barbeiro</TableHead>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment: any) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-muted-foreground bg-opacity-20 text-foreground">
                          {appointment.client.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{appointment.client.fullName}</div>
                        <div className="text-xs text-muted-foreground">{appointment.client.phone || "Sem telefone"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.service.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.barber.user.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatTime(appointment.date)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(appointment.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(appointment.id, 'completed')}
                          className="text-[hsl(var(--success))] hover:text-[hsl(var(--success))] hover:bg-[hsl(var(--success))/10]"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Concluir</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(appointment.id, 'canceled')}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Cancelar</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
