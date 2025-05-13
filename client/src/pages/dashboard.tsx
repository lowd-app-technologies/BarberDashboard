import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { TopBarbers } from "@/components/dashboard/TopBarbers";
import { PopularServices } from "@/components/dashboard/PopularServices";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  ShoppingCart, 
  CalendarCheck, 
  BanknoteIcon, 
  UserPlus,
  Download 
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/dashboard', selectedPeriod],
  });

  // Fetch upcoming appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointments/upcoming'],
  });

  // Fetch top barbers
  const { data: barbers, isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['/api/barbers/top'],
  });

  // Fetch popular services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services/popular'],
  });

  // Default values if data is loading
  const stats = dashboardData?.stats || {
    sales: 0,
    appointments: 0,
    pendingPayments: 0,
    newClients: 0,
    salesTrend: 0,
    appointmentsTrend: 0,
    pendingPaymentsTrend: 0,
    newClientsTrend: 0
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center">
            <div className="mr-3">
              <Select
                value={selectedPeriod}
                onValueChange={setSelectedPeriod}
              >
                <SelectTrigger className="bg-card text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="custom">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-primary text-primary-foreground flex items-center">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Vendas Hoje"
            value={formatCurrency(stats.sales)}
            icon={ShoppingCart}
            trend={{
              value: stats.salesTrend,
              isPositive: stats.salesTrend >= 0
            }}
            iconBackground="bg-primary bg-opacity-20"
          />
          
          <StatsCard
            title="Agendamentos"
            value={stats.appointments.toString()}
            icon={CalendarCheck}
            trend={{
              value: stats.appointmentsTrend,
              isPositive: stats.appointmentsTrend >= 0
            }}
            iconBackground="bg-secondary bg-opacity-20"
          />
          
          <StatsCard
            title="Pagamentos Pendentes"
            value={formatCurrency(stats.pendingPayments)}
            icon={BanknoteIcon}
            trend={{
              value: stats.pendingPaymentsTrend,
              isPositive: false // Usually an increase in pending payments is not positive
            }}
            iconBackground="bg-[hsl(var(--warning))] bg-opacity-20"
          />
          
          <StatsCard
            title="Clientes Novos"
            value={stats.newClients.toString()}
            icon={UserPlus}
            trend={{
              value: stats.newClientsTrend,
              isPositive: stats.newClientsTrend >= 0
            }}
            iconBackground="bg-[hsl(var(--accent-foreground))] bg-opacity-20"
          />
        </div>

        {/* Charts and Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Overview Chart */}
          <SalesChart 
            className="lg:col-span-2"
            data={dashboardData?.salesChart}
            onPeriodChange={setSelectedPeriod}
          />

          {/* Upcoming Appointments */}
          <AppointmentsList 
            appointments={appointments || []}
            showAllLink="/appointments"
            emptyMessage={isLoadingAppointments ? "Carregando..." : "Não há agendamentos próximos"}
          />
        </div>

        {/* Top Performing Barbers & Services */}
        <div className={user?.role === 'barber' ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'}>
          {/* Top Barbers - Visible only for admins */}
          {user?.role !== 'barber' && (
            <TopBarbers 
              barbers={barbers || []}
              title="Top Barbeiros"
            />
          )}

          {/* Popular Services */}
          <div className={user?.role === 'barber' ? 'mt-6' : ''}>
            <PopularServices 
              services={services || []}
              title="Serviços Populares"
            />
          </div>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
}
