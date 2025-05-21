import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  ClipboardList, 
  CheckCircle, 
  Plus, 
  Loader2,
  AlertTriangle,
  Check,
  X,
  Search,
  PlusCircle,
  Calendar
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";

export default function CompletedServicesAdmin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para novo serviço
  const [newService, setNewService] = useState({
    barberId: "",
    serviceId: "",
    clientName: "",
    price: "",
    date: "",
    notes: ""
  });

  // Buscar dados necessários
  const { data: completedServices, isLoading: isLoadingServices, refetch } = useQuery({
    queryKey: ['/api/completed-services'],
    queryFn: () => apiRequest('GET', '/api/completed-services')
      .then(res => res.json()),
  });

  const { data: services } = useQuery({
    queryKey: ['/api/services'],
    queryFn: () => apiRequest('GET', '/api/services')
      .then(res => res.json()),
  });

  const { data: barbers } = useQuery({
    queryKey: ['/api/barbers'],
    queryFn: () => apiRequest('GET', '/api/barbers')
      .then(res => res.json()),
  });
  
  // Filtrar serviços com base no termo de busca
  const filteredServices = completedServices 
    ? completedServices.filter((service: any) => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        const clientName = service.clientName?.toLowerCase() || '';
        const notes = service.notes?.toLowerCase() || '';
        const serviceName = services?.find((s: any) => s.id === service.serviceId)?.name?.toLowerCase() || '';
        const barberName = barbers?.find((b: any) => b.id === service.barberId)?.user?.fullName?.toLowerCase() || '';
        
        return (
          clientName.includes(searchLower) ||
          notes.includes(searchLower) ||
          serviceName.includes(searchLower) ||
          barberName.includes(searchLower)
        );
      })
    : [];

  // Mutation para aprovar um serviço
  const approveServiceMutation = useMutation({
    mutationFn: async (service: any) => {
      const response = await apiRequest('PATCH', `/api/completed-services/${service.id}/validate`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao aprovar serviço');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Serviço aprovado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      setIsApproveDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar serviço",
        variant: "destructive",
      });
    },
  });

  // Mutation para registrar um novo serviço
  const addServiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/completed-services', data)
      .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Serviço registrado com sucesso",
        description: "O serviço foi adicionado com sucesso ao sistema.",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      setIsAddDialogOpen(false);
      // Limpar formulário
      setNewService({
        barberId: "",
        serviceId: "",
        clientName: "",
        price: "",
        date: "",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar serviço",
        description: error.message || "Ocorreu um erro ao registrar o serviço. Verifique os dados e tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Mutation para excluir um serviço
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/completed-services/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao rejeitar serviço');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Serviço rejeitado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      setIsRejectDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar serviço",
        variant: "destructive",
      });
    },
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      notes: newService.notes,
      validatedByAdmin: true // Admin já valida diretamente
    });
  };

  // Aprovação de serviço
  const openApproveDialog = (service: any) => {
    setSelectedService(service);
    setIsApproveDialogOpen(true);
  };

  const handleApproveService = () => {
    if (selectedService) {
      approveServiceMutation.mutate(selectedService);
    }
  };

  // Rejeição de serviço
  const openRejectDialog = (service: any) => {
    setSelectedService(service);
    setIsRejectDialogOpen(true);
  };

  const handleRejectService = () => {
    if (selectedService) {
      deleteServiceMutation.mutate(selectedService.id);
    }
  };

  // Formatação de valores monetários
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(value));
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
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Serviços Completados</h1>
          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar serviços..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar Serviço
                </Button>
              </DialogTrigger>
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
                          onValueChange={(value) => handleSelectChange('barberId', value)}
                          value={newService.barberId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o barbeiro" />
                          </SelectTrigger>
                          <SelectContent>
                            {barbers && barbers.map((barber: any) => (
                              <SelectItem key={barber.id} value={barber.id.toString()}>
                                {barber.user ? barber.user.fullName : `Barbeiro ID: ${barber.id}`}
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
                          onValueChange={(value) => handleSelectChange('serviceId', value)}
                          value={newService.serviceId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {services && services.map((service: any) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
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
                          onChange={handleInputChange}
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
                          value={newService.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">
                        Data
                      </Label>
                      <div className="col-span-3">
                        <Input
                          id="date"
                          name="date"
                          type="datetime-local"
                          value={newService.date}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="notes" className="text-right">
                        Observações
                      </Label>
                      <div className="col-span-3">
                        <Textarea
                          id="notes"
                          name="notes"
                          value={newService.notes || ""}
                          onChange={handleInputChange}
                          placeholder="Observações adicionais"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addServiceMutation.isPending}
                    >
                      {addServiceMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Registrar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Serviços</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os serviços realizados pelos barbeiros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingServices ? (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Carregando serviços...</p>
              </div>
            ) : !filteredServices || filteredServices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-2" />
                <p>{searchTerm ? "Nenhum serviço encontrado com esse termo." : "Não há serviços registrados no sistema."}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Barbeiro</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service: any) => {
                    const serviceDetails = services?.find((s: any) => s.id === service.serviceId);
                    const barberDetails = barbers?.find((b: any) => b.id === service.barberId);
                    const isServiceApproved = service.validatedByAdmin === true;
                    
                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          {format(new Date(service.date), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{service.clientName}</TableCell>
                        <TableCell>{serviceDetails?.name || '-'}</TableCell>
                        <TableCell>
                          {barberDetails?.user ? barberDetails.user.fullName : `Barbeiro ID: ${service.barberId}`}
                        </TableCell>
                        <TableCell>{formatCurrency(service.price)}</TableCell>
                        <TableCell>
                          {isServiceApproved ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aprovado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isServiceApproved ? (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 bg-green-50 hover:bg-green-100 text-green-700"
                                onClick={() => openApproveDialog(service)}
                                disabled={approveServiceMutation.isPending}
                              >
                                {approveServiceMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4 mr-1" />
                                )}
                                Aprovar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 bg-red-50 hover:bg-red-100 text-red-700"
                                onClick={() => openRejectDialog(service)}
                                disabled={deleteServiceMutation.isPending}
                              >
                                {deleteServiceMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4 mr-1" />
                                )}
                                Rejeitar
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Aprovado em {format(new Date(service.updatedAt || service.createdAt), 'dd/MM/yyyy HH:mm')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Modal de aprovar serviço */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Aprovar Serviço</DialogTitle>
              <DialogDescription>
                Você está prestes a aprovar este serviço. Uma vez aprovado, ele será contabilizado nas estatísticas e pagamentos do barbeiro.
              </DialogDescription>
            </DialogHeader>
            
            {selectedService && (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 text-sm">
                  <div className="font-medium">Cliente:</div>
                  <div>{selectedService.clientName}</div>
                  
                  <div className="font-medium">Serviço:</div>
                  <div>{services?.find((s: any) => s.id === selectedService.serviceId)?.name}</div>
                  
                  <div className="font-medium">Barbeiro:</div>
                  <div>{barbers?.find((b: any) => b.id === selectedService.barberId)?.user?.fullName}</div>
                  
                  <div className="font-medium">Valor:</div>
                  <div>{formatCurrency(selectedService.price)}</div>
                  
                  <div className="font-medium">Data:</div>
                  <div>{format(new Date(selectedService.date), 'dd/MM/yyyy HH:mm')}</div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsApproveDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApproveService}
                disabled={approveServiceMutation.isPending}
              >
                {approveServiceMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar Aprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal de rejeitar serviço */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rejeitar Serviço</DialogTitle>
              <DialogDescription>
                Você está prestes a rejeitar este serviço. Esta ação removerá o serviço permanentemente.
              </DialogDescription>
            </DialogHeader>
            
            {selectedService && (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 text-sm">
                  <div className="font-medium">Cliente:</div>
                  <div>{selectedService.clientName}</div>
                  
                  <div className="font-medium">Serviço:</div>
                  <div>{services?.find((s: any) => s.id === selectedService.serviceId)?.name}</div>
                  
                  <div className="font-medium">Barbeiro:</div>
                  <div>{barbers?.find((b: any) => b.id === selectedService.barberId)?.user?.fullName}</div>
                  
                  <div className="font-medium">Valor:</div>
                  <div>{formatCurrency(selectedService.price)}</div>
                  
                  <div className="font-medium">Data:</div>
                  <div>{format(new Date(selectedService.date), 'dd/MM/yyyy HH:mm')}</div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectService}
                disabled={deleteServiceMutation.isPending}
              >
                {deleteServiceMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      
      <MobileNavigation />
    </div>
  );
}