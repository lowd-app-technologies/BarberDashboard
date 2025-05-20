import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Calendar, 
  ClipboardList, 
  CheckCircle, 
  Plus, 
  Loader2,
  AlertTriangle,
  Check,
  X
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
import { AdminPageLayout } from "@/components/layout/AdminPageLayout";

export default function CompletedServicesAdmin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

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
  const { data: completedServices, isLoading: isLoadingServices } = useQuery({
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

  // Mutation para aprovar um serviço
  const approveServiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/completed-services/${id}/validate`, { validatedByAdmin: true })
      .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Serviço aprovado com sucesso",
        description: "O serviço foi validado e será contabilizado nos relatórios.",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      setIsApproveDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar serviço",
        description: error.message || "Ocorreu um erro ao aprovar o serviço. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
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
    mutationFn: (id: number) => apiRequest('DELETE', `/api/completed-services/${id}`),
    onSuccess: () => {
      toast({
        title: "Serviço rejeitado com sucesso",
        description: "O serviço foi removido do sistema.",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      setIsRejectDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar serviço",
        description: error.message || "Ocorreu um erro ao rejeitar o serviço. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
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
      approveServiceMutation.mutate(selectedService.id);
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
    <AdminPageLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Serviços Realizados</h1>
            <p className="text-muted-foreground">
              Gerencie e aprove os serviços realizados pelos barbeiros.
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Serviço
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Todos os Serviços</CardTitle>
            <CardDescription>
              Visualize e aprove os serviços realizados pelos barbeiros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingServices ? (
              <div className="w-full py-10 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : completedServices && completedServices.length > 0 ? (
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
                        <TableCell>
                          {barberDetails?.user ? barberDetails.user.fullName : `Barbeiro ID: ${service.barberId}`}
                        </TableCell>
                        <TableCell>{formatCurrency(service.price)}</TableCell>
                        <TableCell>
                          {service.validatedByAdmin ? (
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
                          {!service.validatedByAdmin && (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 bg-green-50 hover:bg-green-100 text-green-700"
                                onClick={() => openApproveDialog(service)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 bg-red-50 hover:bg-red-100 text-red-700"
                                onClick={() => openRejectDialog(service)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {service.validatedByAdmin && (
                            <span className="text-xs text-muted-foreground">
                              Aprovado
                            </span>
                          )}
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
                  Nenhum serviço foi registrado no sistema.
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
                      onValueChange={(value) => handleSelectChange('barberId', value)}
                      value={newService.barberId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbers && barbers.map((barber: any) => (
                          <SelectItem key={barber.id} value={barber.id.toString()}>
                            {barber.user ? barber.user.fullName : `Barbeiro #${barber.id}`}
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
      </div>
    </AdminPageLayout>
  );
}