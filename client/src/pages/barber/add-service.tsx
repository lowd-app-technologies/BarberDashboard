import { useState, useEffect } from "react";
import { BarberNavigation } from "@/components/layout/BarberNavigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Scissors, Plus } from "lucide-react";

// Form schema
const addServiceSchema = z.object({
  serviceId: z.string({
    required_error: "Selecione um serviço",
  }),
  clientName: z.string().min(3, {
    message: "O nome do cliente deve ter pelo menos 3 caracteres",
  }),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "O preço deve ser um número positivo" }
  ),
  date: z.date({
    required_error: "Selecione uma data",
  }),
});

type AddServiceFormValues = z.infer<typeof addServiceSchema>;

export default function BarberAddService() {
  const [defaultPrice, setDefaultPrice] = useState("");
  const { toast } = useToast();
  
  // Fetch services list
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
  });
  
  // Initialize form
  const form = useForm<AddServiceFormValues>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      serviceId: "",
      clientName: "",
      price: "",
      date: new Date(),
    },
  });
  
  // Add completed service mutation
  const addServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/barber/completed-services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/barber/services/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barber/dashboard'] });
      
      toast({
        title: "Serviço adicionado",
        description: "O serviço foi adicionado com sucesso."
      });
      
      // Reset the form
      form.reset({
        serviceId: "",
        clientName: "",
        price: "",
        date: new Date(),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar serviço",
        description: error.message || "Ocorreu um erro ao adicionar o serviço. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Update price when service changes
  useEffect(() => {
    const serviceId = form.watch("serviceId");
    if (serviceId && services) {
      const selectedService = services.find((service: any) => service.id.toString() === serviceId);
      if (selectedService) {
        setDefaultPrice(selectedService.price.toString());
        form.setValue("price", selectedService.price.toString());
      }
    }
  }, [form.watch("serviceId"), services]);
  
  // Form submission handler
  const onSubmit = (data: AddServiceFormValues) => {
    addServiceMutation.mutate({
      serviceId: parseInt(data.serviceId),
      clientName: data.clientName,
      price: parseFloat(data.price),
      date: data.date,
    });
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Mobile Header */}
      <header className="bg-card p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Adicionar Serviço</h1>
      </header>

      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registrar Serviço Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingServices ? (
                            <SelectItem value="loading" disabled>Carregando...</SelectItem>
                          ) : services && services.length > 0 ? (
                            services.map((service: any) => (
                              <SelectItem 
                                key={service.id} 
                                value={service.id.toString()}
                              >
                                <div className="flex items-center">
                                  <Scissors className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{service.name} - {formatCurrency(service.price)}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-services" disabled>Nenhum serviço disponível</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do cliente" {...field} />
                      </FormControl>
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
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Serviço</FormLabel>
                      <DatePicker 
                        date={field.value} 
                        setDate={(date) => field.onChange(date)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground"
                  disabled={addServiceMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addServiceMutation.isPending ? "Adicionando..." : "Adicionar Serviço"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <BarberNavigation />
    </div>
  );
}
