import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Componente Spinner para indicação de carregamento
function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
  };

  return (
    <div 
      className={`animate-spin rounded-full border-solid border-primary border-t-transparent ${sizeClasses[size]} ${className}`}
      aria-label="Carregando..."
    />
  );
}

// Schema de validação para o formulário
const serviceRecordSchema = z.object({
  serviceId: z.string().min(1, "Selecione um serviço"),
  clientName: z.string().min(3, "Nome do cliente é obrigatório"),
  date: z.date({
    required_error: "Por favor, selecione uma data",
  }),
  price: z.string().min(1, "Preço é obrigatório"),
  clientId: z.string().optional(),
  notes: z.string().optional(),
});

type ServiceRecordFormValues = z.infer<typeof serviceRecordSchema>;

interface Service {
  id: number;
  name: string;
  price: string;
  duration: number;
  description: string | null;
}

interface Client {
  id: number;
  fullName: string;
  email: string;
}

interface ServiceRecordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceRecordForm({ onSuccess, onCancel }: ServiceRecordFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);

  const form = useForm<ServiceRecordFormValues>({
    resolver: zodResolver(serviceRecordSchema),
    defaultValues: {
      serviceId: "",
      clientName: "",
      date: new Date(),
      price: "",
      clientId: "",
      notes: "",
    },
  });

  // Buscar serviços disponíveis
  const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  // Buscar clientes quando necessário
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    enabled: showClientSearch,
  });

  // Filtrar clientes com base no termo de pesquisa
  const filteredClients = clients.filter(client => 
    client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Atualizar preço quando um serviço é selecionado
  const handleServiceChange = (serviceId: string) => {
    const selectedService = services.find(s => s.id.toString() === serviceId);
    if (selectedService) {
      form.setValue("price", selectedService.price);
    }
  };

  // Selecionar um cliente a partir da pesquisa
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    form.setValue("clientName", client.fullName);
    form.setValue("clientId", client.id.toString());
    setShowClientSearch(false);
  };

  // Enviar formulário
  const onSubmit = async (data: ServiceRecordFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Obter ID do barbeiro logado
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para registrar um atendimento",
          variant: "destructive",
        });
        return;
      }
      
      // Aqui assumimos que user.uid contém o ID do usuário (barbeiro)
      const barberId = user.uid;
      
      // Converter price para número
      const price = parseFloat(data.price.replace(',', '.'));
      
      const completedServiceData = {
        barberId: parseInt(barberId),
        serviceId: parseInt(data.serviceId),
        clientName: data.clientName,
        price,
        date: data.date,
        clientId: data.clientId ? parseInt(data.clientId) : undefined,
        notes: data.notes || undefined,
        // Se for baseado em agendamento, adicionar appointmentId: ...
      };
      
      const response = await apiRequest("POST", "/api/completed-services", completedServiceData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao registrar atendimento");
      }
      
      toast({
        title: "Atendimento registrado",
        description: "O atendimento foi registrado com sucesso",
      });
      
      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/completed-services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      // Resetar o formulário
      form.reset();
      
      // Callback de sucesso
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao registrar o atendimento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Serviço */}
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serviço</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleServiceChange(value);
                  }}
                  value={field.value}
                  disabled={isLoadingServices}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingServices ? (
                      <div className="flex justify-center p-2">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      services.map((service) => (
                        <SelectItem 
                          key={service.id} 
                          value={service.id.toString()}
                        >
                          {service.name} - {service.price}€
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Preço */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (€)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Cliente */}
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        placeholder="Nome do cliente" 
                        {...field} 
                        onFocus={() => setShowClientSearch(true)}
                        // onBlur={() => setTimeout(() => setShowClientSearch(false), 200)}
                      />
                    </FormControl>
                    {showClientSearch && (
                      <div className="absolute z-10 mt-1 w-full p-1 bg-background border rounded-md shadow-lg">
                        <Input
                          placeholder="Pesquisar cliente..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                        <div className="max-h-60 overflow-y-auto">
                          {isLoadingClients ? (
                            <div className="flex justify-center p-4">
                              <Spinner size="sm" />
                            </div>
                          ) : filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                              <div 
                                key={client.id}
                                className="p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => handleSelectClient(client)}
                              >
                                <div className="font-medium">{client.fullName}</div>
                                <div className="text-xs text-muted-foreground">{client.email}</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-center text-muted-foreground">
                              Nenhum cliente encontrado
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowClientSearch(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="button" 
                            size="sm"
                            onClick={() => {
                              // Criar novo cliente
                              // Abrir modal de criação de cliente
                              setShowClientSearch(false);
                            }}
                          >
                            Novo Cliente
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Data */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Observações */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Observações opcionais"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2" size="sm" />}
            Registrar Atendimento
          </Button>
        </div>
      </form>
    </Form>
  );
}