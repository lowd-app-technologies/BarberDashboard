import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  User,
  Search,
  Filter,
  Heart,
  CalendarClock,
  UserPlus,
  Loader2,
  Phone,
  Mail,
  UserCog
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

// Schema for client form validation
const clientSchema = z.object({
  fullName: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }).optional(),
  phone: z.string().min(9, { message: "Telefone deve ter pelo menos 9 dígitos" }),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function BarberClients() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, setLocation] = useLocation();  // Importar useLocation de 'wouter'
  
  // Redirecionar para a página de login se o usuário não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [user, loading, setLocation, toast]);
  
  // Form setup
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });
  
  // Mutation for adding a new client
  const addClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      // Usando a rota real para adicionar clientes no banco de dados
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      // Invalidar as consultas corretas
      queryClient.invalidateQueries({ queryKey: ['/api/barber/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barber/clients/favorites'] });
      
      // Forçar a atualização dos dados
      refetchClients();
      
      toast({
        title: "Cliente adicionado",
        description: "O cliente foi adicionado com sucesso!",
      });
      
      // Reset form and close dialog
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      // Verificar se é um erro de telefone duplicado
      if (error.response?.data?.code === 'PHONE_ALREADY_EXISTS') {
        const details = error.response?.data?.details;
        const existingUser = details?.existingUser;
        
        // Mensagem personalizada para telefone duplicado
        toast({
          title: "Telefone já cadastrado",
          description: (
            <div className="space-y-2">
              <p>
                Este número de telefone já está associado a um cliente existente
                {existingUser ? `: ${existingUser.name}` : ""}.
              </p>
              <p className="text-sm text-muted-foreground">
                {details?.suggestion || "Por favor, verifique os dados e tente novamente."}
              </p>
            </div>
          ),
          variant: "destructive",
        });
        
        // Destacar o campo de telefone com erro
        form.setError("phone", { 
          type: "manual", 
          message: "Número de telefone já cadastrado" 
        });
      } else {
        // Tratamento genérico para outros erros
        toast({
          title: "Erro ao adicionar cliente",
          description: error.message || "Ocorreu um erro ao adicionar o cliente. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ClientFormValues) => {
    addClientMutation.mutate(data);
  };
  
  // Fetch clients - usando a rota real de clientes
  const { data: clients = [], isLoading: isLoadingClients, refetch: refetchClients } = useQuery({
    queryKey: ['/api/barber/clients'],
    queryFn: async () => {
      console.log('Buscando clientes...');
      try {
        // Usar URL absoluto para garantir que a requisição seja feita corretamente
        const baseUrl = window.location.origin; // Ex: http://localhost:3000
        const apiUrl = `${baseUrl}/api/barber/clients`;
        console.log('URL da API (React Query):', apiUrl);
        
        const response = await fetch(apiUrl, {
          credentials: 'include'
        });
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar clientes: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Recebidos ${data.length} clientes da API.`);
        return data;
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        throw error;
      }
    },
    // Só executa a query se o usuário estiver autenticado
    onError: (error) => {
      console.error('Erro na query de clientes:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    }
  });
  
  // Função para testar a API de clientes
  const testClientsApi = async () => {
    try {
      console.log('Testando API de clientes...');
      const baseUrl = window.location.origin; // Ex: http://localhost:3000
      const apiUrl = `${baseUrl}/api/barber/clients`;
      console.log('URL da API (teste):', apiUrl);
      console.log('Usuário atual:', user);
      console.log('Sessão armazenada:', sessionStorage.getItem('currentUser'));
      console.log('Auth status:', sessionStorage.getItem('auth'));
      
      // Verificar se o usuário está autenticado antes de fazer a requisição
      if (!user) {
        console.error('Usuário não autenticado. Tentando recuperar da sessão...');
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
          console.log('Usuário encontrado na sessão:', savedUser);
        } else {
          console.error('Nenhum usuário encontrado na sessão');
          // Redirecionar para a página de login se não houver usuário na sessão
          toast({
            title: 'Sessão expirada',
            description: 'Por favor, faça login novamente.',
            variant: 'destructive'
          });
          // Usar setTimeout para evitar problemas com o React Router
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Status da resposta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos:', data);
        toast({
          title: "API funcionando",
          description: `Recebidos ${data.length} clientes da API.`,
          variant: "default",
        });
      } else {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        toast({
          title: "Erro na API",
          description: `Status: ${response.status}, Erro: ${errorText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao testar API:', error);
      toast({
        title: "Erro ao testar API",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  // Fetch favorite clients - usando a API real
  const { data: favoriteClients = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['/api/barber/clients/favorites'],
    enabled: !!user, // Só executa a query se o usuário estiver autenticado
    queryFn: async () => {
      // Buscar clientes favoritos da API real
      const baseUrl = window.location.origin; // Ex: http://localhost:3000
      const apiUrl = `${baseUrl}/api/barber/clients/favorites`;
      console.log('URL da API (favoritos):', apiUrl);
      
      const response = await fetch(apiUrl, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Falha ao buscar clientes');
      }
      const allClients = await response.json();
      // Filtrar apenas os clientes marcados como favoritos
      return allClients.filter(client => client.isFavorite);
    },
    onError: (error) => {
      console.error('Erro ao buscar clientes favoritos:', error);
      toast({
        title: "Erro ao carregar favoritos",
        description: "Não foi possível carregar a lista de clientes favoritos.",
        variant: "destructive",
      });
    }
  });
  
  // Filter clients based on search term
  const filteredClients = Array.isArray(clients) 
    ? clients.filter(client => 
        client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm))
      )
    : [];
  
  // Filter favorite clients based on search term
  const filteredFavorites = Array.isArray(favoriteClients) 
    ? favoriteClients.filter(client => 
        client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm))
      )
    : [];
  
  // Format phone number
  const formatPhone = (phone: string) => {
    if (!phone) return "";
    
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    
    // Format based on length
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    } else if (cleaned.length === 10) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    
    return phone; // Return original if format not recognized
  };

  // Função para verificar a autenticação
  const checkAuth = async () => {
    try {
      console.log('Verificando autenticação...');
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/auth/check`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Status da resposta (auth check):', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dados de autenticação:', data);
        toast({
          title: 'Status de autenticação',
          description: data.authenticated 
            ? `Autenticado como ${data.userRole} (ID: ${data.userId})` 
            : 'Não autenticado',
        });
      } else {
        console.error('Erro ao verificar autenticação');
        toast({
          title: 'Erro de autenticação',
          description: 'Não foi possível verificar a autenticação',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      toast({
        title: 'Erro de autenticação',
        description: 'Ocorreu um erro ao verificar a autenticação',
        variant: 'destructive'
      });
    }
  };
  
  // Função para testar a API diretamente
  const testApi = async () => {
    try {
      console.log('Testando API...');
      const response = await fetch('/api/barber/clients', {
        credentials: 'include'
      });
      
      console.log('Status da resposta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos:', data);
        toast({
          title: "Sucesso",
          description: `Encontrados ${data.length} clientes`,
        });
      } else {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        toast({
          title: "Erro",
          description: `Erro ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao testar API:', error);
      toast({
        title: "Erro",
        description: "Erro ao testar API. Verifique o console.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gerencie suas relações com clientes</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/barber/clients', {
                    credentials: 'include'
                  });
                  const data = await response.json();
                  console.log('Resposta da API:', data);
                  toast({
                    title: response.ok ? "Sucesso" : "Erro",
                    description: response.ok 
                      ? `Encontrados ${data.length} clientes` 
                      : `Erro: ${response.status} - ${response.statusText}`,
                  });
                } catch (error) {
                  console.error('Erro ao testar API:', error);
                  toast({
                    title: "Erro",
                    description: "Erro ao testar API. Verifique o console.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Testar API
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Adicionar Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do cliente para adicioná-lo ao sistema.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Nome do cliente"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="email@exemplo.com"
                                type="email"
                                className="pl-9"
                                {...field}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="912 345 678"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Alguma observação sobre o cliente?"
                              className="min-h-[100px]"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={addClientMutation.isPending}>
                        {addClientMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adicionando...
                          </>
                        ) : (
                          "Adicionar Cliente"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full mb-6 grid grid-cols-2">
            <TabsTrigger value="all">Todos os Clientes</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Lista de Clientes</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={testClientsApi} size="sm">
                      Testar API Real
                    </Button>
                    <Button variant="outline" onClick={checkAuth} size="sm">
                      Verificar Auth
                    </Button>
                    <Button variant="outline" onClick={() => refetchClients()} size="sm">
                      Recarregar
                    </Button>
                  </div>
                </div>
                
                {/* Componente de depuração */}
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <h3 className="text-sm font-semibold mb-2">Informações de Depuração:</h3>
                  <div className="text-xs space-y-1">
                    <p>URL da API: {window.location.origin}/api/barber/clients</p>
                    <p>Usuário autenticado: {user ? 'Sim' : 'Não'}</p>
                    <p>ID do usuário: {user?.id || 'N/A'}</p>
                    <p>Função do usuário: {user?.role || 'N/A'}</p>
                    <p>Clientes carregados: {clients.length}</p>
                    <p>Favoritos carregados: {favoriteClients.length}</p>
                  </div>
                </div>
                <CardDescription>
                  Todos os clientes que você atendeu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClients ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Carregando clientes...</p>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="py-8 text-center">
                    <UserCog className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum cliente encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Nenhum cliente corresponde à sua busca" : "Adicione clientes para vê-los aqui"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Último Atendimento</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div>{client.fullName}</div>
                                <div className="text-xs text-muted-foreground">{client.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatPhone(client.phone)}</TableCell>
                          <TableCell>
                            {client.lastVisit ? formatDate(client.lastVisit) : "Nunca atendido"}
                          </TableCell>
                          <TableCell>
                            {client.isFavorite ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Favorito
                              </Badge>
                            ) : (
                              <Badge variant="outline">Regular</Badge>
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
          
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Favoritos</CardTitle>
                <CardDescription>
                  Clientes que você marcou como favoritos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFavorites ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Carregando favoritos...</p>
                  </div>
                ) : filteredFavorites.length === 0 ? (
                  <div className="py-8 text-center">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum cliente favorito</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Nenhum favorito corresponde à sua busca" : "Marque clientes como favoritos para vê-los aqui"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFavorites.map((client) => (
                      <Card key={client.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-semibold">{client.fullName}</h4>
                              <div className="text-sm text-muted-foreground">
                                {client.phone ? formatPhone(client.phone) : "Sem telefone"}
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <CalendarClock className="h-3 w-3 mr-1" />
                                <span>
                                  {client.lastVisit ? 
                                    `Último atendimento: ${formatDate(client.lastVisit)}` : 
                                    "Nunca atendido"}
                                </span>
                              </div>
                              {client.note && (
                                <div className="mt-2 pt-2 border-t border-border text-xs">
                                  <p className="font-medium mb-1">Observação:</p>
                                  <p className="text-muted-foreground">{client.note}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
