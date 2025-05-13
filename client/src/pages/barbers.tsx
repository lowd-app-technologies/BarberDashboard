import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarberForm } from "@/components/forms/BarberForm";
import { CommissionForm } from "@/components/forms/CommissionForm";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
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
  Pencil, 
  Trash2, 
  Plus, 
  Search, 
  Percent,
  Coins 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Barbers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  
  const { toast } = useToast();
  
  // Fetch barbers
  const { data: barbers, isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['/api/barbers'],
  });
  
  // Fetch commissions
  const { data: commissions, isLoading: isLoadingCommissions } = useQuery({
    queryKey: ['/api/commissions'],
  });
  
  // Delete barber mutation
  const deleteBarberMutation = useMutation({
    mutationFn: async (barberId: number) => {
      await apiRequest("DELETE", `/api/barbers/${barberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/barbers'] });
      toast({
        title: "Barbeiro excluído",
        description: "O barbeiro foi excluído com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir barbeiro",
        description: error.message || "Ocorreu um erro ao excluir o barbeiro. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Delete commission mutation
  const deleteCommissionMutation = useMutation({
    mutationFn: async (commissionId: number) => {
      await apiRequest("DELETE", `/api/commissions/${commissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      toast({
        title: "Comissão excluída",
        description: "A comissão foi excluída com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir comissão",
        description: error.message || "Ocorreu um erro ao excluir a comissão. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Filter barbers by search term
  const filteredBarbers = barbers 
    ? barbers.filter((barber: any) => 
        barber.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
    
  // Get commissions for a specific barber
  const getBarberCommissions = (barberId: number) => {
    if (!commissions) return [];
    return commissions.filter((commission: any) => commission.barberId === barberId);
  };
  
  const handleEdit = (barberId: number) => {
    setSelectedBarberId(barberId);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (barberId: number) => {
    deleteBarberMutation.mutate(barberId);
  };
  
  const handleAddCommission = (barberId: number) => {
    setSelectedBarberId(barberId);
    setIsCommissionDialogOpen(true);
  };
  
  const handleDeleteCommission = (commissionId: number) => {
    deleteCommissionMutation.mutate(commissionId);
  };
  
  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
  };
  
  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedBarberId(null);
  };
  
  const handleCommissionSuccess = () => {
    setIsCommissionDialogOpen(false);
  };
  
  const getPaymentPeriodLabel = (period: string) => {
    const labels = {
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal"
    };
    return labels[period as keyof typeof labels] || period;
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
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Barbeiros</h1>
          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar barbeiros..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Barbeiro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Barbeiro</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes para adicionar um novo barbeiro.
                  </DialogDescription>
                </DialogHeader>
                <BarberForm onSuccess={handleAddSuccess} onCancel={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="barbers">
          <TabsList className="mb-4">
            <TabsTrigger value="barbers">Barbeiros</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="barbers">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Barbeiros</CardTitle>
                <CardDescription>
                  Gerencie os barbeiros da sua barbearia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBarbers ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando barbeiros...</div>
                ) : filteredBarbers.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {searchTerm ? "Nenhum barbeiro encontrado com esse termo." : "Não há barbeiros cadastrados."}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barbeiro</TableHead>
                        <TableHead>NIF</TableHead>
                        <TableHead>Periodicidade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBarbers.map((barber: any) => (
                        <TableRow key={barber.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-muted-foreground bg-opacity-20 text-foreground">
                                  {barber.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{barber.user.fullName}</div>
                                <div className="text-sm text-muted-foreground">{barber.user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{barber.nif}</TableCell>
                          <TableCell>{getPaymentPeriodLabel(barber.paymentPeriod)}</TableCell>
                          <TableCell>
                            {barber.active ? (
                              <Badge variant="default" className="bg-[hsl(var(--success))]">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddCommission(barber.id)}
                            >
                              <Percent className="h-4 w-4" />
                              <span className="sr-only">Comissão</span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(barber.id)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Barbeiro</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o barbeiro "{barber.user.fullName}"?
                                    Esta ação não pode ser desfeita e removerá todos os dados associados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(barber.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Comissões por Serviço</CardTitle>
                <CardDescription>
                  Gerencie as comissões dos barbeiros para cada serviço.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCommissions ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando comissões...</div>
                ) : !commissions || commissions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Não há comissões configuradas.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barbeiro</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Comissão (%)</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission: any) => (
                        <TableRow key={commission.id}>
                          <TableCell>{commission.barber.user.fullName}</TableCell>
                          <TableCell>{commission.service.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Coins className="h-4 w-4 mr-2 text-primary" />
                              {commission.percentage}%
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Comissão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir esta comissão?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCommission(commission.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Edit Barber Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Barbeiro</DialogTitle>
            <DialogDescription>
              Modifique os detalhes do barbeiro.
            </DialogDescription>
          </DialogHeader>
          {selectedBarberId && (
            <BarberForm 
              barberId={selectedBarberId} 
              onSuccess={handleEditSuccess} 
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Commission Dialog */}
      <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Comissão</DialogTitle>
            <DialogDescription>
              Configure a comissão do barbeiro para um serviço específico.
            </DialogDescription>
          </DialogHeader>
          {selectedBarberId && (
            <CommissionForm 
              barberId={selectedBarberId} 
              onSuccess={handleCommissionSuccess} 
              onCancel={() => setIsCommissionDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <MobileNavigation />
    </div>
  );
}
