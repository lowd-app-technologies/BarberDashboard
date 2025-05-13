import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Extended schema with client-side validation
const serviceFormSchema = insertServiceSchema.extend({
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "O preço deve ser um número positivo" }
  ),
  duration: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    { message: "A duração deve ser um número positivo em minutos" }
  ),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  serviceId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceForm({ serviceId, onSuccess, onCancel }: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      duration: "",
      active: true
    }
  });
  
  // Load service data if editing an existing service
  useEffect(() => {
    const loadService = async () => {
      if (serviceId) {
        setIsLoading(true);
        try {
          const res = await apiRequest("GET", `/api/services/${serviceId}`);
          const service = await res.json();
          
          form.reset({
            name: service.name,
            description: service.description || "",
            price: service.price.toString(),
            duration: service.duration.toString(),
            active: service.active
          });
        } catch (error) {
          toast({
            title: "Erro ao carregar serviço",
            description: "Não foi possível carregar os dados do serviço. Tente novamente.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadService();
  }, [serviceId, form, toast]);
  
  // Form submission handler
  const onSubmit = async (data: ServiceFormValues) => {
    setIsLoading(true);
    
    try {
      const formattedData = {
        ...data,
        price: parseFloat(data.price),
        duration: parseInt(data.duration),
      };
      
      if (serviceId) {
        // Update existing service
        await apiRequest("PATCH", `/api/services/${serviceId}`, formattedData);
        toast({
          title: "Serviço atualizado",
          description: "O serviço foi atualizado com sucesso."
        });
      } else {
        // Create new service
        await apiRequest("POST", "/api/services", formattedData);
        toast({
          title: "Serviço criado",
          description: "O serviço foi criado com sucesso."
        });
      }
      
      // Invalidate services queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o serviço. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Serviço</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Corte Degradê" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o serviço em poucas palavras..." 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (€)</FormLabel>
                <FormControl>
                  <Input placeholder="25.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <FormControl>
                  <Input placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : serviceId ? "Atualizar Serviço" : "Criar Serviço"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
