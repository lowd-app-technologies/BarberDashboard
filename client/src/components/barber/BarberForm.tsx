import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";

// Componente Spinner interno para não depender do módulo externo
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

// Definição do schema de validação usando Zod
const barberFormSchema = z.object({
  fullName: z.string().min(3, "O nome completo é obrigatório"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  nif: z.string().min(6, "NIF é obrigatório"),
  iban: z.string().min(10, "IBAN deve ter pelo menos 10 caracteres"),
  paymentPeriod: z.enum(["weekly", "biweekly", "monthly"]),
  active: z.boolean().default(true),
});

type BarberFormData = z.infer<typeof barberFormSchema>;

interface BarberFormProps {
  barberId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BarberForm({ barberId, onSuccess, onCancel }: BarberFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Definição do formulário com React Hook Form
  const form = useForm<BarberFormData>({
    resolver: zodResolver(barberFormSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      nif: "",
      iban: "",
      paymentPeriod: "monthly",
      active: true,
    },
  });

  // Interface para tipificar a resposta do barbeiro
  interface BarberResponse {
    id: number;
    userId: number;
    nif: string;
    iban: string;
    paymentPeriod: "weekly" | "biweekly" | "monthly";
    active: boolean;
    createdAt: string;
    user: {
      id: number;
      username: string;
      email: string;
      fullName: string;
      role: string;
    };
  }

  // Fetch barber data for editing
  const { data: barber, isLoading } = useQuery<BarberResponse>({
    queryKey: ['/api/barbers', barberId],
    enabled: !!barberId,
  });

  // Preencher o formulário com os dados do barbeiro quando disponíveis
  useEffect(() => {
    if (barber && barberId) {
      form.setValue("fullName", barber.user.fullName);
      form.setValue("username", barber.user.username);
      form.setValue("email", barber.user.email);
      form.setValue("nif", barber.nif);
      form.setValue("iban", barber.iban);
      form.setValue("paymentPeriod", barber.paymentPeriod);
      form.setValue("active", barber.active);
    }
  }, [barber, form, barberId]);

  // Função para salvar os dados do barbeiro
  const onSubmit = async (data: BarberFormData) => {
    setIsSubmitting(true);
    try {
      if (barberId) {
        // Atualizar barbeiro existente
        const response = await apiRequest("PATCH", `/api/barbers/${barberId}`, data);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao atualizar barbeiro");
        }
        
        toast({
          title: "Barbeiro atualizado",
          description: "Dados do barbeiro atualizados com sucesso",
        });
      } else {
        // Criar novo barbeiro
        const response = await apiRequest("POST", "/api/barbers", data);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao criar barbeiro");
        }
        
        toast({
          title: "Barbeiro criado",
          description: "Novo barbeiro adicionado com sucesso",
        });
      }
      
      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/barbers'] });
      
      // Callback de sucesso
      if (onSuccess) onSuccess();
      
      // Limpar formulário se for criação
      if (!barberId) {
        form.reset();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar os dados",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && barberId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do barbeiro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Usuário</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
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
            name="nif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIF</FormLabel>
                <FormControl>
                  <Input placeholder="Número de Identificação Fiscal" {...field} />
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
                  <Input placeholder="IBAN para pagamentos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="paymentPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Período de Pagamento</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
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
        
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Ativo</FormLabel>
                <FormDescription>
                  O barbeiro está atualmente ativo e disponível para agendamentos.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
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
            {barberId ? "Atualizar Barbeiro" : "Criar Barbeiro"}
          </Button>
        </div>
      </form>
    </Form>
  );
}