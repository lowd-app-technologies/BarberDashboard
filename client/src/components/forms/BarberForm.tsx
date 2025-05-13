import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBarberSchema, insertUserSchema } from "@shared/schema";
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
import { isValidNIF, isValidIBAN } from "@/lib/utils";

// Combined schema for barber and user data
const barberFormSchema = z.object({
  // User fields
  username: insertUserSchema.shape.username,
  email: insertUserSchema.shape.email,
  password: insertUserSchema.shape.password.optional(),
  fullName: insertUserSchema.shape.fullName,
  phone: insertUserSchema.shape.phone.optional(),
  
  // Barber fields
  nif: insertBarberSchema.shape.nif.refine(
    (val) => isValidNIF(val),
    { message: "NIF inválido. Verifique o número fornecido." }
  ),
  iban: insertBarberSchema.shape.iban.refine(
    (val) => isValidIBAN(val),
    { message: "IBAN inválido. Verifique o formato (ex: PT50000201231234567890954)." }
  ),
  paymentPeriod: insertBarberSchema.shape.paymentPeriod,
  active: insertBarberSchema.shape.active,
});

type BarberFormValues = z.infer<typeof barberFormSchema>;

interface BarberFormProps {
  barberId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BarberForm({ barberId, onSuccess, onCancel }: BarberFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<BarberFormValues>({
    resolver: zodResolver(barberFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      phone: "",
      nif: "",
      iban: "",
      paymentPeriod: "monthly",
      active: true
    }
  });
  
  // Load barber data if editing an existing barber
  useState(() => {
    const loadBarber = async () => {
      if (barberId) {
        setIsLoading(true);
        try {
          const res = await apiRequest("GET", `/api/barbers/${barberId}`);
          const barber = await res.json();
          
          form.reset({
            username: barber.user.username,
            email: barber.user.email,
            fullName: barber.user.fullName,
            phone: barber.user.phone || "",
            nif: barber.nif,
            iban: barber.iban,
            paymentPeriod: barber.paymentPeriod,
            active: barber.active
          });
        } catch (error) {
          toast({
            title: "Erro ao carregar barbeiro",
            description: "Não foi possível carregar os dados do barbeiro. Tente novamente.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadBarber();
  }, [barberId]);
  
  // Form submission handler
  const onSubmit = async (data: BarberFormValues) => {
    setIsLoading(true);
    
    try {
      if (barberId) {
        // Update existing barber
        await apiRequest("PATCH", `/api/barbers/${barberId}`, data);
        toast({
          title: "Barbeiro atualizado",
          description: "Os dados do barbeiro foram atualizados com sucesso."
        });
      } else {
        // Create new barber
        await apiRequest("POST", "/api/barbers", data);
        toast({
          title: "Barbeiro criado",
          description: "O barbeiro foi cadastrado com sucesso."
        });
      }
      
      // Invalidate barbers queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/barbers'] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o barbeiro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações Pessoais</h3>
          
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo do barbeiro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="Username para login" {...field} />
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
                    <Input placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{barberId ? "Nova Senha (opcional)" : "Senha"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={barberId ? "Deixe em branco para manter a atual" : "Senha para login"} 
                      {...field} 
                    />
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
                    <Input placeholder="+351 912 345 678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold">Informações Financeiras</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIF</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de contribuinte" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
                  <FormControl>
                    <Input placeholder="PT50..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="paymentPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periodicidade de Pagamento</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a periodicidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
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
            {isLoading ? "Salvando..." : barberId ? "Atualizar Barbeiro" : "Cadastrar Barbeiro"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
