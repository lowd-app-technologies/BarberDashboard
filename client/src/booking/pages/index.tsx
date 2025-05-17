import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Scissors, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronDown,
  LogOut,
  Settings,
  CalendarDays,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import "../styles/booking.css";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

// Tipos para os dados da API
type Service = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  duration: number;
  active: boolean;
  createdAt: string;
};

type Barber = {
  id: number;
  userId: number;
  nif: string;
  iban: string;
  paymentPeriod: string;
  active: boolean;
  profileImage?: string; // Imagem de perfil do barbeiro (opcional)
  createdAt: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    phone: string | null;
    createdAt: string;
  };
};

// Horários disponíveis fictícios
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 19; hour++) {
    if (hour !== 13) { // Intervalo para almoço
      slots.push(`${hour}:00`);
      if (hour !== 19) slots.push(`${hour}:30`);
    }
  }
  return slots;
};

export default function Booking() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [barber, setBarber] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [step, setStep] = useState(0); // Começamos com 0 para mostrar a tela inicial
  const [isBooked, setIsBooked] = useState(false);
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const timeSlots = generateTimeSlots();
  
  // Estados para usuário não logado
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("+351"); // Prefixo Portugal
  const [guestEmail, setGuestEmail] = useState("");
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Dados de fallback para serviços caso a API falhe
  const fallbackServices: Service[] = [
    {
      id: 1,
      name: 'Corte Clássico',
      description: 'Corte tradicional masculino com acabamento perfeito',
      price: 'R$ 35,00',
      duration: 30,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Barba Completa',
      description: 'Tratamento completo para barba com produtos premium',
      price: 'R$ 30,00',
      duration: 30,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Corte + Barba',
      description: 'Combinação de corte clássico e barba completa',
      price: 'R$ 60,00',
      duration: 60,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Pezinho',
      description: 'Acabamento na nuca e laterais',
      price: 'R$ 15,00',
      duration: 15,
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  // Buscar serviços da API
  const { data: servicesFromApi = [], isLoading: isLoadingServices, isError: isServicesError } = useQuery<Service[]>({
    queryKey: ['/api/services'],
    staleTime: 60 * 1000, // 1 minuto
  });
  
  // Usar os serviços da API ou fallback se a API falhar
  const services = isServicesError || servicesFromApi.length === 0 ? fallbackServices : servicesFromApi;
  
  // Dados de fallback para barbeiros caso a API falhe
  const fallbackBarbers: Barber[] = [
    {
      id: 1,
      userId: 3,
      nif: "123456789",
      iban: "PT50123456789",
      paymentPeriod: "mensal",
      active: true,
      profileImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300&auto=format&fit=crop",
      createdAt: new Date().toISOString(),
      user: {
        id: 3,
        username: "barbeiro",
        email: "barbeiro@barberpro.com",
        fullName: "João Silva",
        role: "barber",
        phone: "+351912345678",
        createdAt: new Date().toISOString()
      }
    },
    {
      id: 2,
      userId: 4,
      nif: "987654321",
      iban: "PT50987654321",
      paymentPeriod: "mensal",
      active: true,
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop",
      createdAt: new Date().toISOString(),
      user: {
        id: 4,
        username: "barbeiro2",
        email: "barbeiro2@barberpro.com",
        fullName: "Carlos Santos",
        role: "barber",
        phone: "+351923456789",
        createdAt: new Date().toISOString()
      }
    }
  ];

  // Buscar barbeiros da API
  const { data: barbers = [], isLoading: isLoadingBarbers, isError: isBarbersError } = useQuery<Barber[]>({
    queryKey: ['/api/barbers'],
    staleTime: 60 * 1000, // 1 minuto
    retry: 3, // Tenta 3 vezes antes de falhar
    retryDelay: 1000, // Espera 1 segundo entre as tentativas
  });
  
  // Obter o serviço selecionado
  const selectedService = services.find(s => s.id.toString() === service);
  
  // Obter o barbeiro selecionado
  const selectedBarber = barbers.find(b => b.id.toString() === barber);
  
  // Ir para o próximo passo
  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };
  
  // Voltar para o passo anterior
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };
  
  // Iniciar o agendamento
  const startBooking = () => {
    setStep(1);
  };
  
  // Formatar a data para exibição
  const formatDate = (date?: Date) => {
    if (!date) return "";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  // Lidar com a confirmação do agendamento
  const handleCreateAppointment = async () => {
    try {
      // Limpar erros anteriores
      setFormErrors({});
      
      // Validar dados antes de prosseguir
      let hasErrors = false;
      const newErrors: {[key: string]: string} = {};
      
      const appointmentDate = new Date(date!);
      const [hours, minutes] = time.split(':').map(Number);
      appointmentDate.setHours(hours, minutes);

      // Preparar os dados para enviar à API
      let appointmentData;
      
      if (user) {
        // Cliente logado, usamos o ID do usuário
        appointmentData = {
          clientId: parseInt(user.uid),
          barberId: parseInt(barber),
          serviceId: parseInt(service),
          date: appointmentDate.toISOString(),
          status: "pending",
          notes: `Agendamento feito pelo cliente: ${selectedService?.name} com ${selectedBarber?.user?.fullName}`
        };
      } else {
        // Cliente não logado, usamos os dados fornecidos
        if (!guestName) {
          newErrors.guestName = "Nome é obrigatório";
          hasErrors = true;
        }
        
        if (!guestPhone) {
          newErrors.guestPhone = "Telefone é obrigatório";
          hasErrors = true;
        } else if (!guestPhone.startsWith("+351")) {
          newErrors.guestPhone = "O telefone deve começar com o prefixo de Portugal (+351)";
          hasErrors = true;
        }
        
        // Se tiver erros, atualizar o estado e parar
        if (hasErrors) {
          setFormErrors(newErrors);
          toast({
            title: "Erro no formulário",
            description: "Por favor, corrija os campos destacados",
            variant: "destructive"
          });
          return;
        }
        
        appointmentData = {
          barberId: parseInt(barber),
          serviceId: parseInt(service),
          date: appointmentDate.toISOString(),
          status: "pending",
          guestName: guestName,
          guestPhone: guestPhone,
          guestEmail: guestEmail || undefined, // Incluir email apenas se foi fornecido
          saveClientData: true, // Indicar para salvar os dados do cliente
          notes: `Agendamento feito pelo cliente não logado: ${guestName} (${guestPhone}) - ${selectedService?.name} com ${selectedBarber?.user?.fullName}`
        };
      }

      // Enviar para a API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        // Redirecionamos para a página de agradecimento
        toast({
          title: "Agendamento realizado!",
          description: "Seu horário foi reservado com sucesso",
        });
        navigate("/thank-you");
      } else {
        // Tratamento de erro
        const errorData = await response.json();
        
        if (errorData.error && Array.isArray(errorData.error)) {
          // Mapear os erros da API para os campos do formulário
          const apiErrors: {[key: string]: string} = {};
          
          errorData.error.forEach((err: any) => {
            // Converter o caminho do erro (como "data.guestName") para o nome do campo (como "guestName")
            const fieldMatch = err.path?.match(/\.(\w+)$/);
            const fieldName = fieldMatch ? fieldMatch[1] : 'general';
            apiErrors[fieldName] = err.message || 'Campo inválido';
          });
          
          setFormErrors(apiErrors);
          
          toast({
            title: "Erro de validação",
            description: "Verifique os campos do formulário",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro ao agendar",
            description: errorData.message || 'Ocorreu um erro desconhecido',
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro ao criar o agendamento. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Verificar se pode avançar para o próximo passo
  const canProceed = () => {
    switch(step) {
      case 1: return !!service;
      case 2: return !!barber;
      case 3: return !!date && !!time;
      case 4: return user ? true : (!!guestName && !!guestPhone); // Verificar dados do convidado se não estiver logado
      default: return true;
    }
  };
  
  // Processar logout
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Conteúdo principal */}
      <div className="flex-1">
        {/* Página inicial com banner e botões */}
        {step === 0 && (
          <div className="flex flex-col md:flex-row h-screen">
            <div className="flex-1 md:w-1/2 h-full">
              <img 
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop" 
                alt="Barbeiro profissional"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex items-center md:w-1/2">
              <div className="p-8 lg:p-12 xl:p-16 space-y-6 max-w-lg mx-auto">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold text-lg">Vossa Barbearia</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold">A melhor experiência para seu corte de cabelo</h1>
                <p className="text-base lg:text-lg text-gray-600 dark:text-gray-300">
                  Bem-vindo à melhor experiência de barbearia. Cortes precisos, ambiente confortável e profissionais experientes.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    onClick={startBooking} 
                    className="bg-primary text-white hover:bg-primary/90 px-4 py-2"
                  >
                    Agendar Agora
                  </Button>
                  <Link href="/login">
                    <Button variant="outline" className="px-4 py-2">
                      Entrar / Registrar
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Passos do agendamento */}
        {step > 0 && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Agende seu horário</h2>
            
            <div className="flex max-w-3xl mx-auto mb-8">
              <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                <div className="step-circle">
                  <span>1</span>
                </div>
                <p className="step-title">Serviço</p>
              </div>
              <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                <div className="step-circle">
                  <span>2</span>
                </div>
                <p className="step-title">Barbeiro</p>
              </div>
              <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                <div className="step-circle">
                  <span>3</span>
                </div>
                <p className="step-title">Data/Hora</p>
              </div>
              <div className={`step-item ${step >= 4 ? 'active' : ''}`}>
                <div className="step-circle">
                  <span>4</span>
                </div>
                <p className="step-title">Confirmação</p>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>
                    {step === 1 && "Escolha o serviço"}
                    {step === 2 && "Escolha o barbeiro"}
                    {step === 3 && "Escolha a data e hora"}
                    {step === 4 && "Confirme seu agendamento"}
                  </CardTitle>
                  <CardDescription>
                    {step === 1 && "Selecione o serviço que deseja agendar"}
                    {step === 2 && "Quem você prefere que realize o serviço?"}
                    {step === 3 && "Escolha quando você deseja ser atendido"}
                    {step === 4 && "Verifique as informações do seu agendamento"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {/* Passo 1: Escolha do serviço */}
                  {step === 1 && (
                    <>
                      {isLoadingServices ? (
                        <div className="flex justify-center items-center h-40">
                          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {services.filter(svc => svc.active).map(svc => (
                            <div 
                              key={svc.id} 
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${service === svc.id.toString() ? 'border-primary bg-primary/10' : 'hover:border-gray-400'}`}
                              onClick={() => setService(svc.id.toString())}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-medium ${service === svc.id.toString() ? 'text-primary' : ''}`}>{svc.name}</h3>
                                <span className={`font-bold ${service === svc.id.toString() ? 'text-primary' : ''}`}>{svc.price}</span>
                              </div>
                              <p className={`text-sm mb-2 ${service === svc.id.toString() ? 'text-primary/80' : 'text-gray-500'}`}>{svc.description}</p>
                              <div className={`text-xs flex items-center ${service === svc.id.toString() ? 'text-primary/80' : 'text-gray-400'}`}>
                                <Clock className="h-3 w-3 mr-1" /> {svc.duration} min
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Passo 2: Escolha do barbeiro */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {isLoadingBarbers ? (
                        <div className="flex justify-center items-center h-40">
                          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                        </div>
                      ) : isBarbersError ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2">
                          <p className="text-red-500">Não foi possível carregar os barbeiros</p>
                          <Button 
                            onClick={() => window.location.reload()}
                            variant="outline"
                            size="sm"
                          >
                            Tentar novamente
                          </Button>
                        </div>
                      ) : barbers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2">
                          <p className="text-amber-600">Não há barbeiros disponíveis no momento</p>
                          <p className="text-sm text-gray-500">Por favor, tente novamente mais tarde</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {barbers.map(b => (
                            <div 
                              key={b.id} 
                              onClick={() => setBarber(b.id.toString())} 
                              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${barber === b.id.toString() ? 'border-primary ring-2 ring-primary' : 'hover:border-gray-400'}`}
                            >
                              <div className="p-4 flex items-center space-x-4">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                                  {b.profileImage ? (
                                    <img 
                                      src={b.profileImage} 
                                      alt={b.user.fullName} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary text-white">
                                      {b.user.fullName.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-lg">{b.user.fullName}</h3>
                                  <p className="text-sm text-gray-500">
                                    Especialista em cortes modernos e tradicionais
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Passo 3: Escolha da data e hora */}
                  {step === 3 && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4" /> 
                          Selecione a data
                        </h3>
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          locale={ptBR}
                          disabled={(date) => {
                            // Desabilita dias anteriores e domingos
                            return date < new Date() || date.getDay() === 0;
                          }}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          <Clock className="mr-2 h-4 w-4" /> 
                          Selecione o horário
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setTime(slot)}
                              className={`py-2 px-3 rounded-md text-sm ${
                                time === slot 
                                  ? 'bg-primary text-white' 
                                  : 'bg-background border hover:border-primary/50'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Passo 4: Confirmação */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 divide-y space-y-3">
                        <div className="pb-3">
                          <h3 className="font-medium text-lg mb-4">Resumo do agendamento</h3>
                          
                          <div className="grid grid-cols-2 gap-y-2">
                            <div className="text-gray-500">Serviço:</div>
                            <div className="font-medium">{selectedService?.name}</div>
                            
                            <div className="text-gray-500">Barbeiro:</div>
                            <div className="font-medium flex items-center gap-2">
                              {selectedBarber?.profileImage && (
                                <div className="w-6 h-6 rounded-full overflow-hidden">
                                  <img src={selectedBarber.profileImage} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              {selectedBarber?.user.fullName}
                            </div>
                            
                            <div className="text-gray-500">Data:</div>
                            <div className="font-medium">{formatDate(date)}</div>
                            
                            <div className="text-gray-500">Horário:</div>
                            <div className="font-medium">{time}</div>
                            
                            <div className="text-gray-500">Duração:</div>
                            <div className="font-medium">{selectedService?.duration} min</div>
                            
                            <div className="text-gray-500">Preço:</div>
                            <div className="font-medium text-primary">{selectedService?.price}</div>
                          </div>
                        </div>
                        
                        {!user && (
                          <div className="pt-3 space-y-4">
                            <h3 className="font-medium text-lg">Seus dados</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium block mb-1">Nome completo *</label>
                                <input 
                                  type="text" 
                                  value={guestName}
                                  onChange={(e) => setGuestName(e.target.value)}
                                  className={`w-full p-2 border rounded-md ${formErrors.guestName ? 'border-red-500' : ''}`}
                                  placeholder="Digite seu nome completo"
                                  required
                                />
                                {formErrors.guestName && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.guestName}</p>
                                )}
                              </div>
                              <div>
                                <label className="text-sm font-medium block mb-1">Telefone / Whatsapp *</label>
                                <input 
                                  type="tel" 
                                  value={guestPhone}
                                  onChange={(e) => setGuestPhone(e.target.value)}
                                  className={`w-full p-2 border rounded-md ${formErrors.guestPhone ? 'border-red-500' : ''}`}
                                  placeholder="+351 912 345 678"
                                  required
                                />
                                {formErrors.guestPhone ? (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.guestPhone}</p>
                                ) : (
                                  <p className="text-xs text-gray-500 mt-1">Formato: +351 seguido do número</p>
                                )}
                              </div>
                              <div>
                                <label className="text-sm font-medium block mb-1">Email (opcional)</label>
                                <input 
                                  type="email" 
                                  value={guestEmail}
                                  onChange={(e) => setGuestEmail(e.target.value)}
                                  className={`w-full p-2 border rounded-md ${formErrors.guestEmail ? 'border-red-500' : ''}`}
                                  placeholder="seu.email@exemplo.com"
                                />
                                {formErrors.guestEmail && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.guestEmail}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {formErrors.general && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Erro</AlertTitle>
                          <AlertDescription>
                            {formErrors.general}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  {step > 1 ? (
                    <Button variant="outline" onClick={prevStep}>
                      Voltar
                    </Button>
                  ) : (
                    step === 1 ? (
                      <Button variant="outline" onClick={() => setStep(0)}>
                        Voltar para o início
                      </Button>
                    ) : (
                      <div></div> // Espaçador para manter o layout
                    )
                  )}
                  
                  {step < 4 ? (
                    <Button 
                      onClick={nextStep} 
                      disabled={!canProceed()}
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCreateAppointment}
                      disabled={!canProceed()}
                    >
                      Confirmar agendamento
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}