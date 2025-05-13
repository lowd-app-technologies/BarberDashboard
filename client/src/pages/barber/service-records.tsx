import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { ServiceRecordForm } from "@/components/barber/ServiceRecordForm";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scissors, Plus, Search, Info } from "lucide-react";

// Interface para tipificar os registros de atendimento
interface CompletedService {
  id: number;
  barberId: number;
  serviceId: number;
  clientName: string;
  price: number;
  date: string;
  appointmentId: number | null;
  createdAt: string;
  barber: {
    id: number;
    user: {
      id: number;
      fullName: string;
    };
  };
  service: {
    id: number;
    name: string;
    price: string;
    duration: number;
  };
}

export default function ServiceRecords() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month" | "all">("week");

  // Buscar registros de atendimentos
  const { data: completedServices = [], isLoading } = useQuery<CompletedService[]>({
    queryKey: ['/api/completed-services', filterPeriod],
    // na implementação real, teríamos um parametro de query para filtrar por período
  });

  // Buscar detalhes de um serviço específico
  const { data: selectedService, isLoading: isLoadingDetails } = useQuery<CompletedService>({
    queryKey: ['/api/completed-services', selectedServiceId],
    enabled: !!selectedServiceId,
  });

  // Filtrar registros com base no termo de pesquisa
  const filteredServices = completedServices.filter((service) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      service.clientName.toLowerCase().includes(searchLower) ||
      service.service.name.toLowerCase().includes(searchLower) ||
      service.barber.user.fullName.toLowerCase().includes(searchLower)
    );
  });

  // Funções para agrupar e calcular estatísticas
  const totalEarnings = filteredServices.reduce((sum, service) => sum + service.price, 0);
  const uniqueClients = new Set(filteredServices.map(service => service.clientName)).size;
  
  // Serviços mais populares
  const popularServices: Record<string, { count: number, revenue: number }> = {};
  filteredServices.forEach(service => {
    const name = service.service.name;
    if (!popularServices[name]) {
      popularServices[name] = { count: 0, revenue: 0 };
    }
    popularServices[name].count += 1;
    popularServices[name].revenue += service.price;
  });
  
  const topServices = Object.entries(popularServices)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Visualizar detalhes de um serviço
  const handleViewDetails = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setShowDetailsDialog(true);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Registros de Atendimentos</h1>
            <p className="text-muted-foreground">Gerencie e visualize os atendimentos realizados</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Atendimento
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total de Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredServices.length}</div>
              <p className="text-xs text-muted-foreground">Atendimentos registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">Valor dos atendimentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Clientes Atendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueClients}</div>
              <p className="text-xs text-muted-foreground">Clientes únicos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e pesquisa */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por cliente, serviço ou barbeiro..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Tabs defaultValue="week" value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as any)}>
              <TabsList>
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="week">Esta Semana</TabsTrigger>
                <TabsTrigger value="month">Este Mês</TabsTrigger>
                <TabsTrigger value="all">Todos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Tabela de atendimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos Realizados</CardTitle>
            <CardDescription>
              Listagem de todos os atendimentos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-10">
                <Scissors className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum atendimento encontrado</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  {searchTerm
                    ? "Nenhum resultado para sua busca. Tente termos diferentes."
                    : "Não há atendimentos registrados no período selecionado."}
                </p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Registrar Atendimento
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Barbeiro</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          {formatDate(new Date(service.date))}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{service.clientName}</div>
                        </TableCell>
                        <TableCell>{service.service.name}</TableCell>
                        <TableCell>{service.barber.user.fullName}</TableCell>
                        <TableCell>{formatCurrency(service.price)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(service.id)}
                          >
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Detalhes</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard de serviços populares */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Serviços Mais Populares</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topServices.map((service) => (
              <Card key={service.name}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-medium">{service.name}</CardTitle>
                    <Badge>{service.count} realizados</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(service.revenue)}</div>
                  <p className="text-xs text-muted-foreground">Receita total</p>
                  <div className="mt-2 text-sm">
                    Média por serviço: {formatCurrency(service.revenue / service.count)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Dialog para adicionar novo atendimento */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Novo Atendimento</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do atendimento realizado
              </DialogDescription>
            </DialogHeader>
            <ServiceRecordForm 
              onSuccess={() => {
                setShowAddDialog(false);
                queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
                toast({
                  title: "Atendimento registrado",
                  description: "O atendimento foi registrado com sucesso",
                });
              }}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog para exibir detalhes */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Atendimento</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre o atendimento realizado
              </DialogDescription>
            </DialogHeader>
            {isLoadingDetails ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : selectedService ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Cliente</h4>
                    <p className="text-lg font-semibold">{selectedService.clientName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Data</h4>
                    <p className="text-lg font-semibold">{formatDate(new Date(selectedService.date))}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Serviço</h4>
                    <p className="text-lg font-semibold">{selectedService.service.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Valor</h4>
                    <p className="text-lg font-semibold">{formatCurrency(selectedService.price)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Barbeiro</h4>
                    <p className="text-lg font-semibold">{selectedService.barber.user.fullName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Duração</h4>
                    <p className="text-lg font-semibold">{selectedService.service.duration} min</p>
                  </div>
                </div>
                
                {selectedService.appointmentId && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Agendamento</h4>
                    <Badge variant="outline">
                      Agendamento #{selectedService.appointmentId}
                    </Badge>
                  </div>
                )}
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setShowDetailsDialog(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p>Não foi possível carregar os detalhes deste atendimento.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}