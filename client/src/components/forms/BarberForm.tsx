import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBarberSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  
  // Calendar visibility fields
  calendarVisibilityType: z.enum(['own', 'all', 'selected']),
  calendarVisibilityBarbers: z.array(z.number()).optional(),
});

type BarberFormValues = z.infer<typeof barberFormSchema>;

interface BarberFormProps {
  barberId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BarberForm({ barberId, onSuccess, onCancel }: BarberFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBarbers, setSelectedBarbers] = useState<number[]>([]);
  const { toast } = useToast();
  
  // Fetch available barbers for calendar visibility selection
  const { data: barbers } = useQuery({
    queryKey: ['/api/barbers'],
    select: (data) => Array.isArray(data) ? data : []
  });
  
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
      active: true,
      calendarVisibilityType: "own",
      calendarVisibilityBarbers: []
    }
  });
  
  // Watch for calendar visibility type changes
  const calendarVisibilityType = form.watch("calendarVisibilityType");
  
  // Load barber data if editing an existing barber
  useEffect(() => {
    const loadBarber = async () => {
      if (barberId) {
        setIsLoading(true);
        try {
          const res = await apiRequest("GET", `/api/barbers/${barberId}`);
          const barber = await res.json();
          
          // Parse calendar visibility settings
          let visibilityType = "own";
          let visibilityBarbers: number[] = [];
          
          if (barber.calendarVisibility) {
            if (barber.calendarVisibility === "all") {
              visibilityType = "all";
            } else if (barber.calendarVisibility === "own") {
              visibilityType = "own";
            } else {
              // Tenta fazer parse do JSON se for uma lista de IDs
              try {
                const parsedIds = JSON.parse(barber.calendarVisibility);
                if (Array.isArray(parsedIds) && parsedIds.length > 0) {
                  visibilityType = "selected";
                  visibilityBarbers = parsedIds;
                  setSelectedBarbers(parsedIds);
                }
              } catch (e) {
                // Se não for um JSON válido, assume configuração padrão
                visibilityType = "own";
              }
            }
          }
          
          form.reset({
            username: barber.user.username,
            email: barber.user.email,
            fullName: barber.user.fullName,
            phone: barber.user.phone || "",
            nif: barber.nif,
            iban: barber.iban,
            paymentPeriod: barber.paymentPeriod,
            active: barber.active,
            calendarVisibilityType: visibilityType as "own" | "all" | "selected",
            calendarVisibilityBarbers: visibilityBarbers
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
  }, [barberId, form, toast]);
  
  // Update form value when selected barbers change
  useEffect(() => {
    form.setValue("calendarVisibilityBarbers", selectedBarbers);
  }, [selectedBarbers, form]);
  
  // Form submission handler
  const onSubmit = async (data: BarberFormValues) => {
    setIsLoading(true);
    
    try {
      // Processar a configuração de visibilidade do calendário
      let calendarVisibility: string = data.calendarVisibilityType;
      
      if (data.calendarVisibilityType === 'selected' && data.calendarVisibilityBarbers && data.calendarVisibilityBarbers.length > 0) {
        // Se selecionar barbeiros específicos, armazena como JSON
        calendarVisibility = JSON.stringify(data.calendarVisibilityBarbers);
      }
      
      // Preparar dados para envio
      const formData = {
        ...data,
        calendarVisibility
      };
      
      if (barberId) {
        // Update existing barber
        await apiRequest("PATCH", `/api/barbers/${barberId}`, formData);
        toast({
          title: "Barbeiro atualizado",
          description: "Os dados do barbeiro foram atualizados com sucesso."
        });
      } else {
        // Create new barber
        await apiRequest("POST", "/api/barbers", formData);
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
        
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold">Configurações de Calendário</h3>
          <FormField
            control={form.control}
            name="calendarVisibilityType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Visibilidade de Calendários</FormLabel>
                <FormDescription>
                  Configure quais calendários este barbeiro pode visualizar na sua agenda
                </FormDescription>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="own" id="r1" />
                      <Label htmlFor="r1">Apenas o calendário próprio</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="r2" />
                      <Label htmlFor="r2">Todos os calendários</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selected" id="r3" />
                      <Label htmlFor="r3">Calendários selecionados</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {calendarVisibilityType === "selected" && (
            <div className="pl-6 pt-2">
              <FormLabel className="mb-2 block">Selecione os Barbeiros</FormLabel>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-2">
                  {barbers?.map((barber: any) => (
                    <div key={barber.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`barber-${barber.id}`}
                        checked={selectedBarbers.includes(barber.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBarbers(prev => [...prev, barber.id]);
                          } else {
                            setSelectedBarbers(prev => prev.filter(id => id !== barber.id));
                          }
                        }}
                      />
                      <label 
                        htmlFor={`barber-${barber.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {barber.user.fullName}
                      </label>
                    </div>
                  ))}
                  {barbers?.length === 0 && (
                    <p className="text-muted-foreground text-sm">Nenhum barbeiro disponível</p>
                  )}
                </div>
              </ScrollArea>
              {selectedBarbers.length === 0 && calendarVisibilityType === "selected" && (
                <p className="text-red-500 text-sm mt-2">Selecione pelo menos um barbeiro</p>
              )}
            </div>
          )}
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
