import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
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
import { 
  Phone, 
  MapPin, 
  ArrowLeft, 
  CalendarIcon, 
  Clock, 
  Scissors, 
  User, 
  Mail, 
  CheckCircle 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Form schema
const confirmationSchema = z.object({
  fullName: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres",
  }),
  email: z.string().email({
    message: "Digite um email válido",
  }),
  phone: z.string().min(9, {
    message: "Digite um número de telefone válido",
  }),
  notes: z.string().optional(),
});

type ConfirmationFormValues = z.infer<typeof confirmationSchema>;

export default function BookingConfirmation() {
  const [, setLocation] = useLocation();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState<string | null>(null);
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const storedServiceId = localStorage.getItem('booking_service_id');
    const storedBarberId = localStorage.getItem('booking_barber_id');
    const storedDateTime = localStorage.getItem('booking_date_time');
    
    if (!storedServiceId || !storedBarberId || !storedDateTime) {
      setLocation('/booking');
      return;
    }
    
    setServiceId(storedServiceId);
    setBarberId(storedBarberId);
    setDateTime(storedDateTime);
  }, [setLocation]);

  // Fetch service details
  const { data: service } = useQuery({
    queryKey: ['/api/services', serviceId],
    enabled: !!serviceId,
  });

  // Fetch barber details
  const { data: barber } = useQuery({
    queryKey: ['/api/barbers', barberId],
    enabled: !!barberId,
  });

  // Initialize form
  const form = useForm<ConfirmationFormValues>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setIsBookingComplete(true);
      setAppointmentId(data.id);
      
      // Clear booking data from localStorage
      localStorage.removeItem('booking_service_id');
      localStorage.removeItem('booking_barber_id');
      localStorage.removeItem('booking_date_time');
      
      toast({
        title: "Agendamento confirmado!",
        description: "Seu horário foi agendado com sucesso.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no agendamento",
        description: error.message || "Não foi possível concluir o agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: ConfirmationFormValues) => {
    if (!serviceId || !barberId || !dateTime) {
      toast({
        title: "Erro no agendamento",
        description: "Informações incompletas. Por favor, comece o agendamento novamente.",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate({
      serviceId: parseInt(serviceId),
      barberId: parseInt(barberId),
      date: dateTime,
      clientName: data.fullName,
      clientEmail: data.email,
      clientPhone: data.phone,
      notes: data.notes,
    });
  };

  // Go to previous step
  const handlePreviousStep = () => {
    setLocation('/booking/date');
  };

  // Go to home
  const handleGoHome = () => {
    setLocation('/booking');
  };

  // Create a new appointment
  const handleNewAppointment = () => {
    setLocation('/booking');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Booking Header */}
      <header className="bg-card p-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl text-primary font-bold">BarberPro</h1>
          <div className="flex items-center">
            <Button variant="ghost" className="mr-4 text-foreground hover:text-primary">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              <MapPin className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative">
        <div 
          className="h-64 bg-center bg-cover" 
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=500')` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <h1 className="text-3xl text-foreground font-bold mb-2">Agende o seu Corte</h1>
            <p className="text-muted-foreground">
              {isBookingComplete ? "Agendamento confirmado!" : "Confirme seus dados abaixo"}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Process */}
      <div className="container mx-auto p-6">
        {!isBookingComplete ? (
          <>
            {/* Steps */}
            <div className="flex justify-between mb-8">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary font-bold">✓</div>
                <span className="text-xs text-primary mt-2">Serviço</span>
              </div>
              <div className="relative flex items-center flex-1 mx-4">
                <div className="flex-1 h-0.5 bg-primary"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary font-bold">✓</div>
                <span className="text-xs text-primary mt-2">Barbeiro</span>
              </div>
              <div className="relative flex items-center flex-1 mx-4">
                <div className="flex-1 h-0.5 bg-primary"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary font-bold">✓</div>
                <span className="text-xs text-primary mt-2">Data</span>
              </div>
              <div className="relative flex items-center flex-1 mx-4">
                <div className="flex-1 h-0.5 bg-primary"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">4</div>
                <span className="text-xs text-primary mt-2">Confirmação</span>
              </div>
            </div>

            {/* Confirmation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-6">Resumo do Agendamento</h2>
                <Card className="mb-6">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start">
                      <Scissors className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Serviço</p>
                        <p className="font-semibold">{service?.name || "Carregando..."}</p>
                        <p className="text-primary font-medium">{service ? formatCurrency(service.price) : ""}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <User className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Barbeiro</p>
                        <p className="font-semibold">{barber?.user?.fullName || "Carregando..."}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <CalendarIcon className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-semibold">{dateTime ? formatDate(new Date(dateTime)) : "Carregando..."}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Horário</p>
                        <p className="font-semibold">{dateTime ? formatTime(new Date(dateTime)) : "Carregando..."}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-6">Seus Dados</h2>
                <Card>
                  <CardContent className="p-5">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Seu nome completo" {...field} />
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
                                <Input 
                                  type="email" 
                                  placeholder="seu.email@exemplo.com" 
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

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações (opcional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Alguma observação especial para o seu atendimento?" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={createAppointmentMutation.isPending}
                className="px-6 py-3 border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createAppointmentMutation.isPending}
                className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createAppointmentMutation.isPending ? "Confirmando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </>
        ) : (
          // Booking complete view
          <Card className="max-w-lg mx-auto my-12">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-[hsl(var(--success))] p-4 rounded-full">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Agendamento Confirmado!</h2>
              <p className="text-muted-foreground mb-6">
                Seu horário foi agendado com sucesso. Enviamos os detalhes para o seu email.
              </p>
              
              <div className="bg-accent bg-opacity-20 p-4 rounded-lg mb-6 text-left">
                <div className="flex items-start mb-3">
                  <CalendarIcon className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data e Hora</p>
                    <p className="font-semibold">
                      {dateTime ? `${formatDate(new Date(dateTime))} às ${formatTime(new Date(dateTime))}` : ""}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start mb-3">
                  <Scissors className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Serviço</p>
                    <p className="font-semibold">{service?.name || ""}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Barbeiro</p>
                    <p className="font-semibold">{barber?.user?.fullName || ""}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button 
                  onClick={handleNewAppointment}
                  className="bg-primary text-primary-foreground"
                >
                  Fazer Novo Agendamento
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleGoHome}
                >
                  Voltar para o Início
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
