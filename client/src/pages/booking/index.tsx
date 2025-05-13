import { useState } from "react";
import { Link } from "wouter";
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
import { Scissors, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import "./booking.css";

export default function Booking() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [barber, setBarber] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [step, setStep] = useState(1);
  
  // Mock data
  const barbers = [
    { id: "1", name: "João Silva" },
    { id: "2", name: "Maria Oliveira" },
    { id: "3", name: "Pedro Santos" },
  ];
  
  const services = [
    { id: "1", name: "Corte de Cabelo", price: "R$ 50,00", duration: 30 },
    { id: "2", name: "Barba", price: "R$ 35,00", duration: 20 },
    { id: "3", name: "Corte + Barba", price: "R$ 75,00", duration: 45 },
    { id: "4", name: "Coloração", price: "R$ 90,00", duration: 60 },
  ];
  
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];
  
  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="bg-primary bg-opacity-20 p-3 rounded-full mr-3">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">BarberPro</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
            <Link href="/register" className="text-primary hover:underline">
              Cadastro
            </Link>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Agendamento</CardTitle>
                <CardDescription>
                  Agende seu horário em poucos passos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between mb-4">
                    <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                      <div className="step-circle">1</div>
                      <div className="step-title">Data</div>
                    </div>
                    <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                      <div className="step-circle">2</div>
                      <div className="step-title">Barbeiro</div>
                    </div>
                    <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                      <div className="step-circle">3</div>
                      <div className="step-title">Serviço</div>
                    </div>
                    <div className={`step-item ${step >= 4 ? 'active' : ''}`}>
                      <div className="step-circle">4</div>
                      <div className="step-title">Horário</div>
                    </div>
                  </div>
                </div>
                
                {step === 1 && (
                  <div className="date-step">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Escolha uma data
                    </h3>
                    <div className="border rounded-md p-3">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={ptBR}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                      />
                    </div>
                    {date && (
                      <p className="mt-4 text-center text-muted-foreground">
                        Data selecionada: {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}
                
                {step === 2 && (
                  <div className="barber-step">
                    <h3 className="text-lg font-medium mb-4">Escolha um barbeiro</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {barbers.map((b) => (
                        <div 
                          key={b.id}
                          className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${
                            barber === b.id ? 'border-primary bg-primary/10' : ''
                          }`}
                          onClick={() => setBarber(b.id)}
                        >
                          <h4 className="font-medium">{b.name}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {step === 3 && (
                  <div className="service-step">
                    <h3 className="text-lg font-medium mb-4">Escolha um serviço</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {services.map((s) => (
                        <div 
                          key={s.id}
                          className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${
                            service === s.id ? 'border-primary bg-primary/10' : ''
                          }`}
                          onClick={() => setService(s.id)}
                        >
                          <div className="flex justify-between">
                            <h4 className="font-medium">{s.name}</h4>
                            <span>{s.price}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4 inline-block mr-1" />
                            {s.duration} minutos
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {step === 4 && (
                  <div className="time-step">
                    <h3 className="text-lg font-medium mb-4">Escolha um horário</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {timeSlots.map((time) => (
                        <div 
                          key={time}
                          className={`border rounded-md p-3 text-center cursor-pointer hover:border-primary transition-colors ${
                            timeSlot === time ? 'border-primary bg-primary/10' : ''
                          }`}
                          onClick={() => setTimeSlot(time)}
                        >
                          {time}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                {step > 1 ? (
                  <Button variant="outline" onClick={prevStep}>
                    Voltar
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {step < 4 ? (
                  <Button 
                    onClick={nextStep}
                    disabled={(step === 1 && !date) || 
                             (step === 2 && !barber) || 
                             (step === 3 && !service)}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button 
                    disabled={!timeSlot}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Confirmar Agendamento
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {date && (
                  <div>
                    <div className="text-sm text-muted-foreground">Data</div>
                    <div className="font-medium">{format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                  </div>
                )}
                
                {barber && (
                  <div>
                    <div className="text-sm text-muted-foreground">Barbeiro</div>
                    <div className="font-medium">{barbers.find(b => b.id === barber)?.name}</div>
                  </div>
                )}
                
                {service && (
                  <div>
                    <div className="text-sm text-muted-foreground">Serviço</div>
                    <div className="font-medium">{services.find(s => s.id === service)?.name}</div>
                    <div className="text-sm">{services.find(s => s.id === service)?.price}</div>
                  </div>
                )}
                
                {timeSlot && (
                  <div>
                    <div className="text-sm text-muted-foreground">Horário</div>
                    <div className="font-medium">{timeSlot}</div>
                  </div>
                )}
                
                {(service && timeSlot) && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between font-medium">
                      <div>Total</div>
                      <div>{services.find(s => s.id === service)?.price}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}