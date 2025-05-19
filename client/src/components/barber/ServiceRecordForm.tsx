import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Schema para o formulário
const serviceRecordSchema = z.object({
  serviceId: z.string({
    required_error: "O serviço é obrigatório",
  }),
  clientId: z.string({
    required_error: "O cliente é obrigatório",
  }),
  date: z.date({
    required_error: "A data é obrigatória",
  }),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "O preço deve ser um número positivo" }
  ),
  notes: z.string().optional(),
});

type ServiceRecordFormValues = z.infer<typeof serviceRecordSchema>;

interface ServiceRecordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceRecordForm({ onSuccess, onCancel }: ServiceRecordFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Buscar serviços
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      console.log("Buscando serviços");
      try {
        const res = await fetch('/api/services');
        if (!res.ok) {
          throw new Error('Falha ao carregar serviços');
        }
        const data = await res.json();
        console.log("Serviços recebidos:", data);
        return data;
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        return [];
      }
    },
  });

  // Buscar clientes
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      console.log("Buscando clientes");
      try {
        const res = await fetch('/api/clients', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) {
          throw new Error('Falha ao carregar clientes');
        }
        const data = await res.json();
        console.log("Clientes recebidos:", data);
        return data;
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        return [];
      }
    },
  });

  // Formulário
  const form = useForm<ServiceRecordFormValues>({
    resolver: zodResolver(serviceRecordSchema),
    defaultValues: {
      serviceId: "0", // Valor padrão não vazio
      clientId: "0", // Valor padrão não vazio
      price: "",
      notes: "",
      date: new Date(),
    },
  });

  // Atualizar o preço quando o serviço mudar
  const watchedServiceId = form.watch("serviceId");
  
  // Efeito para atualizar o preço quando o serviço mudar
  useEffect(() => {
    if (watchedServiceId && Array.isArray(services)) {
      const selectedService = services.find((s: any) => s.id.toString() === watchedServiceId);
      if (selectedService) {
        form.setValue("price", selectedService.price.toString());
      }
    }
  }, [watchedServiceId, services, form]);

  // Criar registro de serviço
  const createServiceRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Enviando dados para API:", data);
      return await apiRequest("POST", "/api/completed-services", data);
    },
    onSuccess: () => {
      if (user?.barber?.id) {
        // Invalidar especificamente a consulta dos serviços deste barbeiro
        queryClient.invalidateQueries({ 
          queryKey: ['/api/completed-services/barber', user.barber.id] 
        });
      }
      // Também invalidar a consulta geral
      queryClient.invalidateQueries({ 
        queryKey: ['/api/completed-services'] 
      });
      
      toast({
        title: "Serviço registrado com sucesso",
        description: "O registro do serviço foi criado."
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error("Erro ao registrar serviço:", error);
      toast({
        title: "Erro ao registrar serviço",
        description: error.message || "Ocorreu um erro ao registrar o serviço.",
        variant: "destructive"
      });
    }
  });

  // Submit do formulário
  const onSubmit = (data: ServiceRecordFormValues) => {
    if (!user?.barber?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado como barbeiro para registrar serviços.",
        variant: "destructive"
      });
      return;
    }
    
    // Garantir que a data seja enviada como string ISO
    const formattedDate = data.date instanceof Date 
      ? data.date.toISOString() 
      : new Date().toISOString();
    
    console.log("Enviando data formatada:", formattedDate);
    
    createServiceRecordMutation.mutate({
      serviceId: parseInt(data.serviceId),
      clientId: parseInt(data.clientId),
      barberId: user.barber.id,
      date: formattedDate,
      price: data.price,
      notes: data.notes || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serviço</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Selecione um serviço</SelectItem>
                    {Array.isArray(services) ? (
                      services.map((service: any) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="-1">Carregando serviços...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Selecione um cliente</SelectItem>
                    {Array.isArray(clients) ? (
                      clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.fullName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="-1">Carregando clientes...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Serviço</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
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
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date);
                          setDate(date);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (€)</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Adicione notas sobre o serviço" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={createServiceRecordMutation.isPending}
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit"
            disabled={createServiceRecordMutation.isPending || isLoadingServices || isLoadingClients}
          >
            {createServiceRecordMutation.isPending ? "Registrando..." : "Registrar Serviço"}
          </Button>
        </div>
      </form>
    </Form>
  );
}