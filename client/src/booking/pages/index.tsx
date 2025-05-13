import { useState } from "react";
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
  Scissors, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronDown,
  LogOut,
  Settings,
  CalendarDays
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import "../styles/booking.css";
import { useAuth } from "@/hooks/useAuth";

// Serviços da Vossa Barbearia
const services = [
  {
    id: 1,
    name: "Corte pente único",
    description: "Corte realizado em um único pente a escolha do cliente (raspado).",
    price: "€10",
    duration: 30
  },
  {
    id: 2,
    name: "Corte cabelo",
    description: "Qualquer tipo e estilo de corte masculino.",
    price: "€14",
    duration: 45
  },
  {
    id: 3,
    name: "Barba Completa",
    description: "Barba feita com ou sem toalha quente, a escolha do cliente.",
    price: "€12",
    duration: 30
  },
  {
    id: 4,
    name: "Barba só com máquina",
    description: "Sem a utilização de lâmina.",
    price: "€8",
    duration: 20
  },
  {
    id: 5,
    name: "Corte e barba",
    description: "Serviço completo com desconto de 11,5%.",
    price: "€23",
    duration: 60
  },
  {
    id: 6,
    name: "Sombracelha",
    description: "Feito com lâmina.",
    price: "€5",
    duration: 15
  },
  {
    id: 7,
    name: "Combo1: Corte + sobrancelhas",
    description: "Corte de cabelo e sobrancelhas com desconto.",
    price: "€16.99",
    duration: 45
  },
  {
    id: 8,
    name: "Combo2: Corte + barba + sobrancelha",
    description: "Serviço completo com desconto.",
    price: "€24.99",
    duration: 75
  },
  {
    id: 9,
    name: "Limpeza facial",
    description: "Limpeza profunda da pele do rosto.",
    price: "€9.99",
    duration: 30
  },
  {
    id: 10,
    name: "Corte + descoloração",
    description: "Descolorir ou madeixas (luzes).",
    price: "€35",
    duration: 90
  }
];

// Barbeiros fictícios para demonstração
const barbers = [
  { id: 1, name: "João Silva" },
  { id: 2, name: "Pedro Souza" },
  { id: 3, name: "Carlos Oliveira" }
];

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
  const [step, setStep] = useState(1);
  const [isBooked, setIsBooked] = useState(false);
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const timeSlots = generateTimeSlots();
  
  // Obter o serviço selecionado
  const selectedService = services.find(s => s.id.toString() === service);
  
  // Ir para o próximo passo
  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };
  
  // Voltar para o passo anterior
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };
  
  // Lidar com a confirmação do agendamento
  const handleBookingConfirmation = async () => {
    if (!user) {
      alert("Por favor, faça login para continuar");
      navigate("/login");
      return;
    }

    try {
      const selectedBarber = barbers.find(b => b.id.toString() === barber);
      const appointmentDate = new Date(date!);
      const [hours, minutes] = time.split(':').map(Number);
      appointmentDate.setHours(hours, minutes);

      // Preparar os dados para enviar à API
      const appointmentData = {
        clientId: user.id,
        barberId: parseInt(barber),
        serviceId: parseInt(service),
        date: appointmentDate.toISOString(),
        status: "pending",
        notes: `Agendamento feito pelo cliente: ${selectedService?.name} com ${selectedBarber?.name}`
      };

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
        navigate("/thank-you");
      } else {
        // Tratamento de erro
        const errorData = await response.json();
        alert(`Erro ao criar agendamento: ${errorData.message || 'Ocorreu um erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert("Ocorreu um erro ao criar o agendamento. Por favor, tente novamente.");
    }
  };
  
  // Verificar se pode avançar para o próximo passo
  const canProceed = () => {
    switch(step) {
      case 1: return !!service;
      case 2: return !!barber;
      case 3: return !!date && !!time;
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
      {/* Header */}
      <header className="p-4 border-b bg-primary bg-opacity-10">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-primary bg-opacity-20 p-2 rounded-full">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Vossa Barbearia</h1>
            </div>
            
            {/* Login/Registro ou Menu de usuário dependendo do estado de autenticação */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.displayName || "Minha Conta"}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/appointments")}>
                    <CalendarDays className="h-4 w-4" />
                    Meus Agendamentos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/profile")}>
                    <Settings className="h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2 text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline">
                  Login / Registro
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      {/* Passos do agendamento */}
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
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
                  <div className="grid gap-4 md:grid-cols-2">
                    {services.map(svc => (
                      <div 
                        key={svc.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${service === svc.id.toString() ? 'border-primary bg-primary' : 'hover:border-gray-400'}`}
                        onClick={() => setService(svc.id.toString())}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-medium ${service === svc.id.toString() ? 'text-white' : ''}`}>{svc.name}</h3>
                          <span className={`font-bold ${service === svc.id.toString() ? 'text-white' : ''}`}>{svc.price}</span>
                        </div>
                        <p className={`text-sm mb-2 ${service === svc.id.toString() ? 'text-white text-opacity-90' : 'text-gray-500'}`}>{svc.description}</p>
                        <div className={`text-xs flex items-center ${service === svc.id.toString() ? 'text-white text-opacity-80' : 'text-gray-400'}`}>
                          <Clock className="h-3 w-3 mr-1" /> {svc.duration} min
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Passo 2: Escolha do barbeiro */}
                {step === 2 && (
                  <div className="space-y-4">
                    <Select value={barber} onValueChange={setBarber}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbers.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {barber && (
                      <div className="mt-6 border p-4 rounded-lg bg-background">
                        <h3 className="font-medium text-lg mb-2">
                          {barbers.find(b => b.id.toString() === barber)?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Especialista em cortes modernos e tradicionais.
                        </p>
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
                          <Button
                            key={slot}
                            variant={time === slot ? "default" : "outline"}
                            className="text-sm"
                            onClick={() => setTime(slot)}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Passo 4: Confirmação */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted p-4">
                        <h3 className="font-medium text-lg">Resumo do Agendamento</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-60">Serviço</span>
                          <span className="font-bold text-lg">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-60">Preço</span>
                          <span className="font-bold text-lg">{selectedService?.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-60">Duração</span>
                          <span className="font-bold">{selectedService?.duration} min</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-60">Barbeiro</span>
                          <span className="font-bold">{barbers.find(b => b.id.toString() === barber)?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-60">Data</span>
                          <span className="font-bold">{date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-60">Horário</span>
                          <span className="font-bold">{time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-primary bg-opacity-10 p-4 rounded-lg">
                      <p className="text-sm">Ao confirmar este agendamento, você concorda com nossos termos de serviço e política de cancelamento.</p>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                {step > 1 ? (
                  <Button variant="outline" onClick={prevStep}>
                    Anterior
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {step < 4 ? (
                  <Button onClick={nextStep} disabled={!canProceed()}>
                    Próximo
                  </Button>
                ) : (
                  <Button onClick={handleBookingConfirmation}>
                    Confirmar Agendamento
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}