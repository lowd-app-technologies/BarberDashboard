import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CalendarIcon, Loader2, CheckCircle, XCircle, ClipboardList, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';

const CompletedServicesPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Estado para o formulário de novo serviço
  const [newService, setNewService] = useState({
    barberId: '',
    serviceId: '',
    clientName: '',
    price: '',
    date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    notes: ''
  });
  
  // Query para buscar dados
  const { 
    data: completedServices, 
    isLoading: loadingServices, 
    isError: servicesError,
    refetch: refetchServices
  } = useQuery({ 
    queryKey: ['/api/completed-services'], 
  });
  
  const { 
    data: barbers, 
    isLoading: loadingBarbers 
  } = useQuery({ 
    queryKey: ['/api/barbers'], 
  });
  
  const { 
    data: services, 
    isLoading: loadingServiceOptions 
  } = useQuery({ 
    queryKey: ['/api/services'], 
  });
  
  // Mutation para adicionar um serviço completo
  const addServiceMutation = useMutation({
    mutationFn: (serviceData: any) => {
      return apiRequest('POST', '/api/completed-services', serviceData);
    },
    onSuccess: () => {
      toast({
        title: "Serviço registrado com sucesso",
        description: "O serviço foi registrado e será visível no relatório de faturamento.",
        variant: "default",
      });
      
      // Limpar formulário e fechar modal
      setNewService({
        barberId: '',
        serviceId: '',
        clientName: '',
        price: '',
        date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
        notes: ''
      });
      
      setIsAddDialogOpen(false);
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar serviço",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setNewService(prev => ({ ...prev, [name]: value }));
    
    // Se for seleção de serviço, preencher o preço automaticamente
    if (name === 'serviceId' && services) {
      const selectedService = services.find((s: any) => s.id.toString() === value);
      if (selectedService) {
        setNewService(prev => ({ 
          ...prev, 
          serviceId: value,
          price: selectedService.price
        }));
      }
    }
  };
  
  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!newService.barberId || !newService.serviceId || !newService.clientName || !newService.price || !newService.date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Enviar para a API
    addServiceMutation.mutate({
      barberId: parseInt(newService.barberId),
      serviceId: parseInt(newService.serviceId),
      clientName: newService.clientName,
      price: newService.price,
      date: new Date(newService.date).toISOString(),
      notes: newService.notes
    });
  };
  
  // Formatação de valores monetários
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(value));
  };
  
  // Mostrar mensagem de carregamento
  if (loadingServices || loadingBarbers || loadingServiceOptions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }
  
  // Mostrar mensagem de erro
  if (servicesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <XCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-muted-foreground">Erro ao carregar os dados. Tente novamente mais tarde.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refetchServices()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Serviços Realizados</h1>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Registrar Serviço
        </Button>
      </div>
      
      {/* Lista de serviços completos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atendimentos</CardTitle>
          <CardDescription>
            Lista de serviços realizados no salão
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedServices && completedServices.length > 0 ? (
            <Table>
              <TableCaption>Lista de serviços realizados</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedServices.map((service: any) => {
                  const serviceDetails = services?.find((s: any) => s.id === service.serviceId);
                  const barberDetails = barbers?.find((b: any) => b.id === service.barberId);
                  
                  return (
                    <TableRow key={service.id}>
                      <TableCell>
                        {format(new Date(service.date), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{service.clientName}</TableCell>
                      <TableCell>{serviceDetails?.name || '-'}</TableCell>
                      <TableCell>{barberDetails?.name || '-'}</TableCell>
                      <TableCell>{formatCurrency(service.price)}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Concluído
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum serviço registrado</h3>
              <p className="text-muted-foreground mt-2">
                Registre seu primeiro serviço clicando no botão acima.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de adicionar serviço */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Novo Serviço</DialogTitle>
            <DialogDescription>
              Preencha os dados do serviço realizado para registrá-lo no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="barberId" className="text-right">
                  Barbeiro
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newService.barberId}
                    onValueChange={(value) => handleSelectChange('barberId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o barbeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbers?.map((barber: any) => (
                        <SelectItem 
                          key={barber.id} 
                          value={barber.id.toString()}
                        >
                          {barber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceId" className="text-right">
                  Serviço
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newService.serviceId}
                    onValueChange={(value) => handleSelectChange('serviceId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((service: any) => (
                        <SelectItem 
                          key={service.id} 
                          value={service.id.toString()}
                        >
                          {service.name} - {formatCurrency(service.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientName" className="text-right">
                  Cliente
                </Label>
                <div className="col-span-3">
                  <Input
                    id="clientName"
                    name="clientName"
                    value={newService.clientName}
                    onChange={handleChange}
                    placeholder="Nome do cliente"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Valor (€)
                </Label>
                <div className="col-span-3">
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={newService.price}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data e Hora
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    <Input
                      id="date"
                      name="date"
                      type="datetime-local"
                      value={newService.date}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Observações
                </Label>
                <div className="col-span-3">
                  <Input
                    id="notes"
                    name="notes"
                    value={newService.notes}
                    onChange={handleChange}
                    placeholder="Observações (opcional)"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button 
                type="submit"
                disabled={addServiceMutation.isPending}
              >
                {addServiceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Serviço'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompletedServicesPage;