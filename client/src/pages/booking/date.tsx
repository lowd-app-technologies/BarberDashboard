import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Phone, MapPin, ArrowLeft, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BookingDateSelection() {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState<string>("");
  const [barberName, setBarberName] = useState<string>("");

  // Load data from localStorage
  useEffect(() => {
    const storedServiceId = localStorage.getItem('booking_service_id');
    const storedBarberId = localStorage.getItem('booking_barber_id');
    
    if (!storedServiceId || !storedBarberId) {
      setLocation('/booking');
      return;
    }
    
    setServiceId(storedServiceId);
    setBarberId(storedBarberId);
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

  // Set names when data is loaded
  useEffect(() => {
    if (service) {
      setServiceName(service.name);
    }
    if (barber) {
      setBarberName(barber.user.fullName);
    }
  }, [service, barber]);

  // Fetch available time slots for the selected date
  const { data: timeSlots, isLoading: isLoadingTimeSlots } = useQuery({
    queryKey: ['/api/appointments/available-slots', barberId, selectedDate?.toISOString().split('T')[0]],
    enabled: !!barberId && !!selectedDate,
  });

  // Handle date selection
  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time selection when date changes
  };

  // Handle time selection
  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
  };

  // Go to previous step
  const handlePreviousStep = () => {
    setLocation('/booking/barber');
  };

  // Go to next step
  const handleNextStep = () => {
    if (selectedDate && selectedTime) {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      dateTime.setHours(hours, minutes, 0, 0);
      
      localStorage.setItem('booking_date_time', dateTime.toISOString());
      setLocation('/booking/confirmation');
    }
  };

  // Generate time slots
  const generateTimeSlots = () => {
    if (!timeSlots) return [];
    return timeSlots;
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
              {serviceName ? `${serviceName} com ${barberName}` : "Carregando..."}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Process */}
      <div className="container mx-auto p-6">
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
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">3</div>
            <span className="text-xs text-primary mt-2">Data</span>
          </div>
          <div className="relative flex items-center flex-1 mx-4">
            <div className="flex-1 h-0.5 bg-border"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">4</div>
            <span className="text-xs text-muted-foreground mt-2">Confirmação</span>
          </div>
        </div>

        {/* Date Selection */}
        <h2 className="text-xl font-semibold mb-6">Escolha a Data e Horário</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center space-x-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Selecione uma data</h3>
              </div>
              
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                className="rounded-md border"
                locale={ptBR}
                fromDate={new Date()}
                disabled={(date) => {
                  // Disable weekends or other specific dates if needed
                  return false;
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center space-x-2 mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-primary" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <h3 className="text-lg font-semibold">Selecione um horário</h3>
              </div>

              {!selectedDate ? (
                <div className="flex items-center justify-center h-52 border rounded-md border-dashed border-border">
                  <p className="text-muted-foreground">Selecione uma data primeiro</p>
                </div>
              ) : isLoadingTimeSlots ? (
                <div className="flex items-center justify-center h-52">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : !timeSlots || timeSlots.length === 0 ? (
                <div className="flex items-center justify-center h-52 border rounded-md border-dashed border-border">
                  <p className="text-muted-foreground">Não há horários disponíveis para esta data</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {generateTimeSlots().map((time: string) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className={selectedTime === time ? "bg-primary text-primary-foreground" : ""}
                      onClick={() => handleSelectTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            className="px-6 py-3 border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={handleNextStep}
            disabled={!selectedDate || !selectedTime}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Próximo Passo
          </Button>
        </div>
      </div>
    </div>
  );
}
