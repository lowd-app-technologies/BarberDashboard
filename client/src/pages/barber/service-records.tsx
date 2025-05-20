import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";
import { ServiceRecordForm } from "@/components/barber/ServiceRecordForm";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { 
  Scissors, 
  Plus, 
  Users, 
  Calendar, 
  PieChart, 
  Clock, 
  User 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function ServiceRecords() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useAuth();
  
  // Carregar registros de serviços completos específicos do barbeiro logado
  const { data: completedServices, isLoading, refetch } = useQuery({
    queryKey: ['/api/completed-services/barber', user?.barber?.id],
    queryFn: async () => {
      if (!user || user.role !== 'barber') return [];
      
      try {
        // Primeiro buscar o barbeiro associado ao usuário logado
        const barberResponse = await fetch('/api/user/barber', {
          credentials: 'include'
        });
        
        if (!barberResponse.ok) {
          throw new Error('Não foi possível obter os dados do barbeiro');
        }
        
        const barberData = await barberResponse.json();
        console.log('Dados do barbeiro recuperados:', barberData);
        
        if (!barberData || !barberData.id) {
          throw new Error('ID do barbeiro não encontrado');
        }
        
        // Agora buscar os serviços deste barbeiro
        const response = await fetch(`/api/completed-services/barber/${barberData.id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao carregar os serviços realizados');
        }
        
        const data = await response.json();
        console.log('Serviços carregados:', data);
        return data;
      } catch (error: any) {
        console.error('Erro ao carregar serviços:', error);
        throw error;
      }
    },
    enabled: !!user && user.role === 'barber',
  });

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    // Atualizar a lista de serviços após adicionar um novo
    refetch();
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Serviços Realizados</h1>
            <p className="text-muted-foreground">Registre e acompanhe os serviços prestados</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Serviço Realizado</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do serviço prestado
                </DialogDescription>
              </DialogHeader>
              <ServiceRecordForm 
                onSuccess={handleAddSuccess} 
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Serviços este mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {completedServices ? completedServices.length : 0}
              </div>
              <p className="text-xs text-muted-foreground">Total de serviços prestados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Valor Acumulado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {completedServices 
                  ? formatCurrency(completedServices.reduce((sum: number, service: any) => sum + parseFloat(service.price), 0))
                  : formatCurrency(0)
                }
              </div>
              <p className="text-xs text-muted-foreground">Total faturado no período</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pagamento Estimado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--success))]">
                {completedServices 
                  ? formatCurrency(completedServices.reduce((sum: number, service: any) => sum + parseFloat(service.price), 0) * 0.5)
                  : formatCurrency(0)
                }
              </div>
              <p className="text-xs text-muted-foreground">Baseado na sua comissão (50%)</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Serviços</CardTitle>
            <CardDescription>
              Lista de todos os serviços que você realizou
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Carregando registros...</div>
            ) : !completedServices || completedServices.length === 0 ? (
              <div className="py-8 text-center">
                <Scissors className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum serviço registrado</h3>
                <p className="text-muted-foreground">
                  Registre os serviços que você prestar para acompanhar seus ganhos
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  Registrar primeiro serviço
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedServices.map((service: any) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        {formatDate(service.date)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {service.service ? service.service.name : `Serviço #${service.serviceId}`}
                        </div>
                        {service.notes && (
                          <div className="text-xs text-muted-foreground">{service.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.clientName}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(service.price)}
                      </TableCell>
                      <TableCell>
                        {service.validatedByAdmin ? (
                          <Badge className="bg-[hsl(var(--success))]">Validado</Badge>
                        ) : (
                          <Badge variant="outline" className="border-[hsl(var(--warning))] text-[hsl(var(--warning))]">Pendente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}