import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Calendar, 
  Check, 
  Clock,
  CalendarRange,
  ArrowUpRight,
  CreditCard
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function BarberPayments() {
  // Buscar pagamentos de comissões
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/barber/payments'],
  });
  
  // Buscar serviços completados e validados (para calcular próximo pagamento)
  const { data: validatedServices = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/barber/services/validated'],
  });

  // Buscar serviços pendentes de validação
  const { data: pendingServices = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['/api/barber/services/pending'],
  });

  // Calcular total previsto para o próximo pagamento (50% de comissão como exemplo)
  const calculateNextPayment = () => {
    if (!Array.isArray(validatedServices)) return 0;
    return validatedServices.reduce((total, service) => {
      const price = parseFloat(service.price);
      return total + (price * 0.5); // 50% de comissão
    }, 0);
  };

  // Calcular total pendente de validação
  const calculatePendingAmount = () => {
    if (!Array.isArray(pendingServices)) return 0;
    return pendingServices.reduce((total, service) => {
      const price = parseFloat(service.price);
      return total + (price * 0.5); // 50% de comissão
    }, 0);
  };

  // Calcular total já recebido
  const calculateTotalReceived = () => {
    if (!Array.isArray(payments)) return 0;
    return payments.reduce((total, payment) => {
      const amount = parseFloat(payment.amount);
      return total + amount;
    }, 0);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Pagamentos</h1>
            <p className="text-muted-foreground">Acompanhe seus pagamentos e comissões</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Próximo Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(calculateNextPayment())}
              </div>
              <p className="text-xs text-muted-foreground">Estimativa baseada em serviços validados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Pendente de Validação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">
                {formatCurrency(calculatePendingAmount())}
              </div>
              <p className="text-xs text-muted-foreground">Valores sujeitos à aprovação do admin</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Total Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--success))]">
                {formatCurrency(calculateTotalReceived())}
              </div>
              <p className="text-xs text-muted-foreground">Valor total já recebido em comissões</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="mb-6 grid grid-cols-2">
            <TabsTrigger value="history">
              <Calendar className="h-4 w-4 mr-2" />
              Histórico de Pagamentos
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-2" />
              Serviços Pendentes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>
                  Todos os pagamentos recebidos até o momento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando pagamentos...</div>
                ) : !Array.isArray(payments) || payments.length === 0 ? (
                  <div className="py-8 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum pagamento recebido</h3>
                    <p className="text-muted-foreground">
                      Os pagamentos aparecerão aqui após serem processados pelo administrador
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data do Pagamento</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {formatDate(payment.paymentDate || payment.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarRange className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span>
                                {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {payment.status === "paid" ? (
                              <Badge className="bg-[hsl(var(--success))]">Pago</Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-500 border-yellow-500">Processando</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Pendentes de Validação</CardTitle>
                <CardDescription>
                  Serviços que aguardam validação do administrador
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPending ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando serviços pendentes...</div>
                ) : !Array.isArray(pendingServices) || pendingServices.length === 0 ? (
                  <div className="py-8 text-center">
                    <Check className="mx-auto h-12 w-12 text-[hsl(var(--success))] opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum serviço pendente</h3>
                    <p className="text-muted-foreground">
                      Todos os seus serviços já foram validados
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead className="text-right">Sua Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingServices.map((service) => {
                        const price = parseFloat(service.price);
                        const commission = price * 0.5; // 50% de comissão
                        
                        return (
                          <TableRow key={service.id}>
                            <TableCell>
                              {formatDate(service.date)}
                            </TableCell>
                            <TableCell>
                              {service.service?.name || "Serviço"}
                            </TableCell>
                            <TableCell>
                              {service.clientName}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(price)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(commission)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableCaption>
                      Total estimado pendente: {formatCurrency(calculatePendingAmount())}
                    </TableCaption>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}