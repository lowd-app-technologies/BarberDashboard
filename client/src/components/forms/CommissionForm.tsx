import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommissionSchema } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

const commissionFormSchema = insertCommissionSchema.extend({
  percentage: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    {
      message: "A percentagem deve ser um número entre 0 e 100",
    }
  ),
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;

interface CommissionFormProps {
  commissionId?: number;
  barberId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CommissionForm({ 
  commissionId, 
  barberId, 
  onSuccess, 
  onCancel 
}: CommissionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [barbers, setBarbers] = useState<{id: number, name: string}[]>([]);
  const [services, setServices] = useState<{id: number, name: string}[]>([]);
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      barberId: barberId?.toString() || "",
      serviceId: "",
      percentage: "50",
    }
  });
  
  // Load barbers and services
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch barbers
        const barbersRes = await apiRequest("GET", "/api/barbers");
        const barbersData = await barbersRes.json();
        setBarbers(barbersData.map((b: any) => ({ 
          id: b.id, 
          name: b.user.fullName 
        })));
        
        // Fetch services
        const servicesRes = await apiRequest("GET", "/api/services");
        const servicesData = await servicesRes.json();
        setServices(servicesData.map((s: any) => ({ 
          id: s.id, 
          name: s.name 
        })));
        
        // If editing, load commission data
        if (commissionId) {
          const commissionRes = await apiRequest("GET", `/api/commissions/${commissionId}`);
          const commission = await commissionRes.json();
          
          form.reset({
            barberId: commission.barberId.toString(),
            serviceId: commission.serviceId.toString(),
            percentage: commission.percentage.toString(),
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os barbeiros e serviços. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [commissionId]);
  
  // Form submission handler
  const onSubmit = async (data: CommissionFormValues) => {
    setIsLoading(true);
    
    try {
      const formattedData = {
        ...data,
        barberId: parseInt(data.barberId),
        serviceId: parseInt(data.serviceId),
        percentage: parseFloat(data.percentage),
      };
      
      if (commissionId) {
        // Update existing commission
        await apiRequest("PATCH", `/api/commissions/${commissionId}`, formattedData);
        toast({
          title: "Comissão atualizada",
          description: "A comissão foi atualizada com sucesso."
        });
      } else {
        // Create new commission
        await apiRequest("POST", "/api/commissions", formattedData);
        toast({
          title: "Comissão criada",
          description: "A comissão foi criada com sucesso."
        });
      }
      
      // Invalidate commissions queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a comissão. Tente novamente.",
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
          name="barberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barbeiro</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!!barberId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem 
                      key={barber.id} 
                      value={barber.id.toString()}
                    >
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem 
                      key={service.id} 
                      value={service.id.toString()}
                    >
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percentagem da Comissão (%)</FormLabel>
              <FormControl>
                <Input {...field} />
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
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : commissionId ? "Atualizar Comissão" : "Criar Comissão"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
