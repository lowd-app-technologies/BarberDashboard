import { useState } from "react";
import { BarberNavigation } from "@/components/layout/BarberNavigation";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  DownloadIcon, 
  Calendar, 
  Clock, 
  DollarSign,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export default function BarberEarnings() {
  const [period, setPeriod] = useState("month");
  
  // Fetch earnings data
  const { data: earningsData, isLoading: isLoadingEarnings } = useQuery({
    queryKey: ['/api/barber/earnings', period],
  });
  
  // Fetch service history
  const { data: servicesHistory, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/barber/services/history', period],
  });
  
  // Fetch payment history
  const { data: paymentsHistory, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/barber/payments/history', period],
  });
  
  // Default values if data is loading
  const earnings = earningsData || {
    total: 0,
    previous: 0,
    change: 0,
    chartData: []
  };
  
  const services = servicesHistory || [];
  const payments = paymentsHistory || [];
  
  // Calculate percentage change
  const getChangePercentage = () => {
    if (earnings.previous === 0) return 100;
    return Math.round((earnings.total - earnings.previous) / earnings.previous * 100);
  };
  
  // Generate period label
  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
      case 'year':
        return 'Este Ano';
      default:
        return 'Este Mês';
    }
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Mobile Header */}
      <header className="bg-card p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Meus Ganhos</h1>
        <Button variant="outline" size="icon">
          <DownloadIcon className="h-4 w-4" />
        </Button>
      </header>

      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Visão Geral</h2>
          <Select
            value={period}
            onValueChange={setPeriod}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Earnings Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <p className="text-muted-foreground text-sm">{getPeriodLabel()}</p>
              <div className="flex items-end">
                <p className="text-3xl text-primary font-bold">
                  {isLoadingEarnings ? "..." : formatCurrency(earnings.total)}
                </p>
                <p className={`ml-2 text-sm flex items-center ${
                  earnings.change >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
                }`}>
                  {earnings.change >= 0 ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(getChangePercentage())}%
                </p>
              </div>
            </div>

            <div className="h-64">
              {isLoadingEarnings ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Carregando dados...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={earnings.chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={false} 
                      stroke="hsl(var(--border))" 
                    />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--card-foreground))'
                      }}
                      formatter={(value) => [`€${value}`, 'Ganhos']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorEarnings)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Services and Payments Tabs */}
        <Tabs defaultValue="services">
          <TabsList className="w-full">
            <TabsTrigger value="services" className="flex-1">
              <BarChart className="h-4 w-4 mr-2" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Pagamentos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Serviços</CardTitle>
                <CardDescription>
                  Serviços realizados e valores recebidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingServices ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Carregando histórico de serviços...
                  </div>
                ) : services.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Não há serviços registrados no período selecionado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service: any) => (
                      <div 
                        key={service.id} 
                        className="flex justify-between items-start border-b border-border pb-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{service.service.name}</div>
                          <div className="text-sm text-muted-foreground">Cliente: {service.clientName}</div>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(service.date)}</span>
                            <Clock className="h-3 w-3 ml-2 mr-1" />
                            <span>
                              {new Date(service.date).toLocaleTimeString('pt-PT', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-primary font-medium">
                          {formatCurrency(service.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
                <CardDescription>
                  Pagamentos recebidos da barbearia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Carregando histórico de pagamentos...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Não há pagamentos registrados no período selecionado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment: any) => (
                      <div 
                        key={payment.id} 
                        className="p-3 border border-border rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">Pagamento de Comissões</div>
                          <div className="text-primary font-medium">
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Período: {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Pago em: {payment.paymentDate ? formatDate(payment.paymentDate) : 'Pendente'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BarberNavigation />
    </div>
  );
}
