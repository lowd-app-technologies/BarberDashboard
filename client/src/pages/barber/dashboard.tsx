import { useState } from "react";
import { BarberNavigation } from "@/components/layout/BarberNavigation";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Card, 
  CardContent, 
  CardTitle,
  CardHeader 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, MoreVertical } from "lucide-react";

export default function BarberDashboard() {
  const { user } = useAuth();
  
  // Fetch dashboard data for barber
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/barber/dashboard'],
  });
  
  // Fetch today's appointments
  const { data: todayAppointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/barber/appointments/today'],
  });
  
  // Fetch recent services
  const { data: recentServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/barber/services/recent'],
  });
  
  // Default values if data is loading
  const barberData = dashboardData?.barber || {
    monthlyEarnings: 0,
    servicesCount: 0,
    nextPaymentDate: null,
    previousMonthGrowth: 0
  };
  
  const appointments = todayAppointments || [];
  const services = recentServices || [];
  
  // Generate initials from full name
  const getInitials = (name: string) => {
    return name
      ? name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
      : 'BB';
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Mobile Header for Barber */}
      <header className="bg-card p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold mr-3">
            {user?.user_metadata?.full_name 
              ? getInitials(user.user_metadata.full_name)
              : "BP"}
          </div>
          <div>
            <h1 className="text-primary text-lg font-bold">
              {user?.user_metadata?.full_name || "Barbeiro"}
            </h1>
            <p className="text-xs text-muted-foreground">Barbeiro</p>
          </div>
        </div>
        <div className="flex items-center">
          <button className="mr-2 text-muted-foreground">
            <Bell className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Earnings Overview */}
      <div className="p-4">
        <Card className="bg-card shadow-sm mb-6">
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-sm">Ganhos Totais (Este Mês)</p>
            <p className="text-3xl text-primary mt-1 font-bold">
              {isLoadingDashboard ? "..." : formatCurrency(barberData.monthlyEarnings)}
            </p>
            <div className="flex items-center text-[hsl(var(--success))] text-sm mt-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>+{barberData.previousMonthGrowth || 0}% vs. mês anterior</span>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-accent rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Serviços</p>
                <p className="text-xl mt-1 font-semibold">
                  {isLoadingDashboard ? "..." : barberData.servicesCount}
                </p>
              </div>
              <div className="bg-accent rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Próximo Pagamento</p>
                <p className="text-xl mt-1 font-semibold">
                  {isLoadingDashboard 
                    ? "..." 
                    : barberData.nextPaymentDate 
                      ? formatDate(barberData.nextPaymentDate).split('/').slice(0, 2).join('/')
                      : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Agendamentos de Hoje</h2>
            <Badge className="bg-primary text-primary-foreground text-xs">
              {isLoadingAppointments ? "..." : appointments.length} Agendamentos
            </Badge>
          </div>
          
          {isLoadingAppointments ? (
            <div className="py-4 text-center text-muted-foreground">Carregando agendamentos...</div>
          ) : appointments.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              Não há agendamentos para hoje.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment: any) => (
                <Card key={appointment.id} className="bg-card">
                  <CardContent className="p-4 flex items-center">
                    <div className="bg-primary bg-opacity-20 p-3 rounded-full mr-3">
                      <p className="text-primary text-lg font-bold">
                        {new Date(appointment.date).toLocaleTimeString('pt-PT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{appointment.client.fullName}</p>
                      <p className="text-xs text-muted-foreground">{appointment.service.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary">{formatCurrency(appointment.service.price)}</p>
                      <div className="flex mt-1">
                        <button className="mr-2 text-[hsl(var(--success))]">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </button>
                        <button className="text-destructive">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Service Button */}
        <Button className="w-full bg-primary text-primary-foreground py-3 rounded-lg flex items-center justify-center mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="font-semibold">Adicionar Serviço</span>
        </Button>

        {/* Recent Services */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Serviços Recentes</h2>
            <Button variant="link" className="text-primary text-sm p-0">Ver todos</Button>
          </div>
          
          {isLoadingServices ? (
            <div className="py-4 text-center text-muted-foreground">Carregando serviços...</div>
          ) : services.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              Não há serviços recentes.
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service: any) => (
                <Card key={service.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <p className="font-semibold text-foreground">{service.service.name}</p>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {formatDate(service.date) === formatDate(new Date()) ? 'Hoje' : formatDate(service.date)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cliente: {service.clientName}
                        </p>
                      </div>
                      <p className="text-primary">{formatCurrency(service.price)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BarberNavigation />
    </div>
  );
}
