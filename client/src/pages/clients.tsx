import { useState } from "react";
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
  CardFooter,
} from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
  Users, 
  UserPlus, 
  Scissors,
  Search,
  Phone,
  Calendar,
  Mail,
  User,
  Loader2 
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Esquema de validação para adicionar cliente
const clientSchema = z.object({
  fullName: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(9, { message: "Telefone deve ter pelo menos 9 dígitos" }),
  barberId: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

type Barber = {
  id: number;
  user: {
    fullName: string;
  };
};

export default function Clients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Buscar clientes
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients', user?.role],
    enabled: true,
  });

  // Buscar barbeiros (apenas para admin)
  const { data: barbers = [] } = useQuery<Barber[]>({
    queryKey: ['/api/barbers'],
    enabled: user?.role === 'admin',
  });

  // Filtrar clientes com base na busca
  const filteredClients = clients.filter((client: any) => 
    client.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    client.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.user?.phone?.toLowerCase().includes(search.toLowerCase())
  );

  // Configuração do formulário
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      barberId: "",
      notes: "",
    },
  });

  // Mutation para adicionar cliente
  const addClientMutation = useMutation({
    mutationFn: (data: ClientFormValues) => 
      apiRequest("POST", "/api/clients", {
        ...data,
        barberId: data.barberId ? parseInt(data.barberId) : undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente adicionado",
        description: "Cliente adicionado com sucesso!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar cliente",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmit = (data: ClientFormValues) => {
    addClientMutation.mutate(data);
  };

  // Formatador de números de telefone
  const formatPhone = (phone: string) => {
    if (!phone) return "";
    
    // Formato básico para números portugueses
    if (phone.startsWith("+")) {
      return phone;
    }
    
    if (phone.length === 9) {
      return `+351 ${phone}`;
    }
    
    return phone;
  };

  // Obter as iniciais do nome
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Gerenciar seus clientes e suas preferências</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar clientes..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do cliente para adicioná-lo ao sistema.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente" {...field} />
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
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="+351 912345678" {...field} />
                          </FormControl>
                          <FormDescription>
                            Incluir o código do país, ex: +351 para Portugal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {user?.role === 'admin' && (
                      <FormField
                        control={form.control}
                        name="barberId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barbeiro Responsável</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <div className="flex items-center gap-2">
                                    <UserCog className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Selecione um barbeiro" />
                                  </div>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {barbers.map((barber) => (
                                  <SelectItem key={barber.id} value={barber.id.toString()}>
                                    {barber.user.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Notas sobre o cliente, preferências, etc..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter className="gap-2 sm:gap-0">
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button 
                        type="submit" 
                        disabled={addClientMutation.isPending}
                      >
                        {addClientMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Salvar Cliente
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Visualize e gerencie informações dos seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead>Última Visita</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client: any) => (
                      <TableRow key={client.userId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>
                                {getInitials(client.user.fullName || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{client.user.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                {client.user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <span>{formatPhone(client.user.phone || "")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.createdAt ? (
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <span>
                                {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {client.lastVisit ? (
                            format(new Date(client.lastVisit), "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            "Nunca visitou"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon">
                              <User className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Scissors className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground">
                  {search ? "Nenhum cliente corresponde à pesquisa" : "Adicione clientes para começar"}
                </p>
              </div>
            )}
          </CardContent>
          {filteredClients.length > 0 && (
            <CardFooter className="justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredClients.length} de {clients.length} clientes
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </Layout>
  );
}