import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Scissors, 
  Calendar, 
  CheckCircle,
  DollarSign,
  UserRound,
  ArrowUpCircle,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Payments() {
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  
  // Buscar todos os serviços concluídos
  const { data: completedServices = [], isLoading } = useQuery({
    queryKey: ['/api/completed-services'],
  });
  
  // Buscar todos os barbeiros
  const { data: barbers = [] } = useQuery({
    queryKey: ['/api/barbers'],
  });
  
  // Validar um serviço
  const validateServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      return await apiRequest("PATCH", `/api/completed-services/${serviceId}/validate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      toast({
        title: "Serviço validado",
        description: "O serviço foi validado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao validar serviço",
        description: error.message || "Ocorreu um erro ao validar o serviço.",
        variant: "destructive"
      });
    }
  });
  
  // Marcar um pagamento como pago (para futuras implementações)
  const markPaymentAsPaidMutation = useMutation({
    mutationFn: async (barberId: number) => {
      return await apiRequest("POST", `/api/payments`, {
        barberId,
        amount: getTotalAmountForBarber(barberId),
        periodStart: new Date(new Date().setDate(1)), // Primeiro dia do mês atual
        periodEnd: new Date(), // Data atual
        status: "paid"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message || "Ocorreu um erro ao registrar o pagamento.",
        variant: "destructive"
      });
    }
  });
  
  // Rejeitar um serviço
  const rejectServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      return await apiRequest("DELETE", `/api/completed-services/${serviceId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      toast({
        title: "Serviço rejeitado",
        description: "O serviço foi rejeitado e removido do sistema."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar serviço",
        description: error.message || "Ocorreu um erro ao rejeitar o serviço.",
        variant: "destructive"
      });
    }
  });
  
  // Validar o serviço
  const handleValidateService = (serviceId: number) => {
    validateServiceMutation.mutate(serviceId);
  };
  
  // Rejeitar o serviço
  const handleRejectService = (serviceId: number) => {
    rejectServiceMutation.mutate(serviceId);
  };
  
  // Registrar pagamento para um barbeiro
  const handlePayBarber = (barberId: number) => {
    markPaymentAsPaidMutation.mutate(barberId);
  };
  
  // Filtrar serviços por status
  const pendingServices = completedServices.filter((service: any) => !service.validatedByAdmin);
  const validatedServices = completedServices.filter((service: any) => service.validatedByAdmin);
  
  // Agrupar serviços validados por barbeiro
  const getServicesGroupedByBarber = () => {
    const groupedServices: Record<number, any[]> = {};
    
    validatedServices.forEach((service: any) => {
      const barberId = service.barberId;
      if (!groupedServices[barberId]) {
        groupedServices[barberId] = [];
      }
      groupedServices[barberId].push(service);
    });
    
    return groupedServices;
  };
  
  // Calcular valor total para um barbeiro
  const getTotalAmountForBarber = (barberId: number) => {
    const services = validatedServices.filter((service: any) => service.barberId === barberId);
    return services.reduce((sum: number, service: any) => sum + parseFloat(service.price), 0);
  };
  
  // Calcular comissão para um barbeiro (50% como exemplo)
  const getCommissionForBarber = (barberId: number) => {
    return getTotalAmountForBarber(barberId) * 0.5;
  };
  
  // Obter informações de um barbeiro pelo ID
  const getBarberInfo = (barberId: number) => {
    return barbers.find((barber: any) => barber.id === barberId);
  };
  
  // Serviços agrupados por barbeiro
  const servicesGroupedByBarber = getServicesGroupedByBarber();
  
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Pagamentos e Validações</h1>
            <p className="text-muted-foreground">Gerencie pagamentos e valide serviços prestados</p>
          </div>
        </div>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Validar Serviços
              {pendingServices.length > 0 && (
                <Badge className="ml-2 bg-primary">{pendingServices.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          </TabsList>

          {/* Tab de Validação de Serviços */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Pendentes de Validação</CardTitle>
                <CardDescription>
                  Valide os serviços prestados pelos barbeiros antes de processar o pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando serviços...</div>
                ) : pendingServices.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Não há serviços pendentes</h3>
                    <p className="text-muted-foreground">
                      Todos os serviços registrados já foram validados
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barbeiro</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingServices.map((service: any) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src="" />
                                <AvatarFallback>{service.barber.user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>{service.barber.user.fullName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(service.date)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{service.service.name}</div>
                            {service.notes && (
                              <div className="text-xs text-muted-foreground">{service.notes}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {service.client.fullName}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(service.price)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[hsl(var(--success))]"
                                onClick={() => handleValidateService(service.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="sr-only">Validar</span>
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span className="sr-only">Rejeitar</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Rejeitar Serviço</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja rejeitar este serviço? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRejectService(service.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Rejeitar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Pagamentos */}
          <TabsContent value="payments">
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(servicesGroupedByBarber).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Não há pagamentos pendentes</h3>
                    <p className="text-muted-foreground">
                      Todos os serviços validados já foram pagos ou não existem serviços validados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                Object.keys(servicesGroupedByBarber).map((barberIdStr) => {
                  const barberId = parseInt(barberIdStr);
                  const barber = getBarberInfo(barberId);
                  const services = servicesGroupedByBarber[barberId];
                  const totalAmount = getTotalAmountForBarber(barberId);
                  const commissionAmount = getCommissionForBarber(barberId);
                  
                  return (
                    <Card key={barberId} className="overflow-hidden">
                      <CardHeader className="bg-muted/20">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src="" />
                              <AvatarFallback>{barber?.user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle>{barber?.user.fullName}</CardTitle>
                              <CardDescription>
                                {services.length} serviços realizados
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(commissionAmount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              a pagar (50% de {formatCurrency(totalAmount)})
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Serviço</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead className="text-right">Comissão (50%)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {services.map((service: any) => (
                              <TableRow key={service.id}>
                                <TableCell>{formatDate(service.date)}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{service.service.name}</div>
                                </TableCell>
                                <TableCell>{service.client.fullName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(service.price)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(parseFloat(service.price) * 0.5)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={3} className="font-medium">Total</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(totalAmount)}</TableCell>
                              <TableCell className="text-right font-bold text-primary">{formatCurrency(commissionAmount)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                      <div className="p-4 bg-card border-t flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Registrar Pagamento
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirmar Pagamento</DialogTitle>
                              <DialogDescription>
                                Você está prestes a registrar um pagamento de {formatCurrency(commissionAmount)} para {barber?.user.fullName}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div className="bg-muted p-4 rounded-md">
                                <div className="flex justify-between mb-2">
                                  <div className="text-muted-foreground">Barbeiro:</div>
                                  <div className="font-medium">{barber?.user.fullName}</div>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <div className="text-muted-foreground">Valor total:</div>
                                  <div className="font-medium">{formatCurrency(totalAmount)}</div>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <div className="text-muted-foreground">Comissão (50%):</div>
                                  <div className="font-medium text-primary">{formatCurrency(commissionAmount)}</div>
                                </div>
                                <div className="flex justify-between">
                                  <div className="text-muted-foreground">Serviços:</div>
                                  <div className="font-medium">{services.length}</div>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Este pagamento será registrado no sistema e os serviços marcados como pagos.
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {}}>Cancelar</Button>
                              <Button onClick={() => handlePayBarber(barberId)}>Confirmar Pagamento</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}