import { useState } from "react";
import { BarberNavigation } from "@/components/layout/BarberNavigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTime } from "@/lib/utils";
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
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, XCircle, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

export default function BarberAppointments() {
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  
  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['/api/barber/appointments'],
  });
  
  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number, status: string }) => {
      await apiRequest("PATCH", `/api/barber/appointments/${appointmentId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/barber/appointments'] });
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
  
  // Filter appointments by selected date
  const filteredAppointments = appointments 
    ? appointments.filter((appointment: any) => {
        if (!dateFilter) return true;
        const appointmentDate = new Date(appointment.date);
        return appointmentDate.toDateString() === dateFilter.toDateString();
      })
    : [];
  
  // Handle appointment completion
  const handleComplete = (appointmentId: number) => {
    updateStatusMutation.mutate({ appointmentId, status: 'completed' });
  };
  
  // Handle appointment cancellation
  const handleCancel = (appointmentId: number) => {
    updateStatusMutation.mutate({ appointmentId, status: 'canceled' });
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

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Mobile Header */}
      <header className="bg-card p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Meus Agendamentos</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Date Filter */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <DatePicker 
              date={dateFilter} 
              setDate={setDateFilter} 
              className="max-w-[280px]"
            />
            {dateFilter && (
              <Button 
                variant="link" 
                onClick={() => setDateFilter(undefined)}
                className="text-sm p-0 h-auto mt-1"
              >
                Limpar filtro
              </Button>
            )}
          </div>
        </div>

        {/* Appointments Tabs */}
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="upcoming" className="flex-1">Próximos</TabsTrigger>
            <TabsTrigger value="past" className="flex-1">Passados</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            <AppointmentsList 
              appointments={filteredAppointments.filter((a: any) => {
                const now = new Date();
                const appointmentDate = new Date(a.date);
                return appointmentDate > now && 
                  (a.status === 'pending' || a.status === 'confirmed');
              })}
              isLoading={isLoading}
              onComplete={handleComplete}
              onCancel={handleCancel}
              emptyMessage="Não há agendamentos próximos."
            />
          </TabsContent>
          
          <TabsContent value="past">
            <AppointmentsList 
              appointments={filteredAppointments.filter((a: any) => {
                const now = new Date();
                const appointmentDate = new Date(a.date);
                return appointmentDate < now || 
                  a.status === 'completed' || 
                  a.status === 'canceled';
              })}
              isLoading={isLoading}
              onComplete={handleComplete}
              onCancel={handleCancel}
              emptyMessage="Não há agendamentos passados."
            />
          </TabsContent>
          
          <TabsContent value="all">
            <AppointmentsList 
              appointments={filteredAppointments}
              isLoading={isLoading}
              onComplete={handleComplete}
              onCancel={handleCancel}
              emptyMessage="Não há agendamentos registrados."
            />
          </TabsContent>
        </Tabs>
      </div>

      <BarberNavigation />
    </div>
  );
}

// Appointments list component
interface AppointmentsListProps {
  appointments: any[];
  isLoading: boolean;
  onComplete: (id: number) => void;
  onCancel: (id: number) => void;
  emptyMessage?: string;
}

function AppointmentsList({ 
  appointments, 
  isLoading, 
  onComplete, 
  onCancel,
  emptyMessage = "Não há agendamentos." 
}: AppointmentsListProps) {
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
  
  // Can perform actions on appointment
  const canPerformActions = (appointment: any) => {
    return appointment.status === 'pending' || appointment.status === 'confirmed';
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Agendamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">Carregando agendamentos...</div>
        ) : appointments.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <Card key={appointment.id} className="bg-card border border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
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
                    <div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center">
                      <Scissors className="h-4 w-4 text-muted-foreground mr-2" />
                      <div className="text-sm">{appointment.service.name}</div>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                      <div className="text-sm">{appointment.service.duration} min</div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <div className="text-sm">{formatDate(appointment.date)}</div>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                      <div className="text-sm">{formatTime(appointment.date)}</div>
                    </div>
                  </div>
                  
                  {canPerformActions(appointment) && (
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onComplete(appointment.id)}
                        className="text-[hsl(var(--success))] border-[hsl(var(--success))]"
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Concluir
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onCancel(appointment.id)}
                        className="text-destructive border-destructive"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
