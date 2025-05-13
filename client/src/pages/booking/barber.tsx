import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Phone, MapPin, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BookingBarberSelection() {
  const [, setLocation] = useLocation();
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState<string>("");

  // Load the service ID from localStorage
  useEffect(() => {
    const storedServiceId = localStorage.getItem('booking_service_id');
    if (!storedServiceId) {
      setLocation('/booking');
      return;
    }
    setServiceId(storedServiceId);
  }, [setLocation]);

  // Fetch service details
  const { data: service } = useQuery({
    queryKey: ['/api/services', serviceId],
    enabled: !!serviceId,
  });

  // Set service name when data is loaded
  useEffect(() => {
    if (service) {
      setServiceName(service.name);
    }
  }, [service]);

  // Fetch barbers
  const { data: barbers, isLoading } = useQuery({
    queryKey: ['/api/barbers/active'],
    enabled: !!serviceId,
  });

  // Handle barber selection
  const handleSelectBarber = (barberId: string) => {
    setSelectedBarberId(barberId);
  };

  // Go to previous step
  const handlePreviousStep = () => {
    setLocation('/booking');
  };

  // Go to next step
  const handleNextStep = () => {
    if (selectedBarberId) {
      localStorage.setItem('booking_barber_id', selectedBarberId);
      setLocation('/booking/date');
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
            <p className="text-muted-foreground">Serviço selecionado: {serviceName || "Carregando..."}</p>
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
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">2</div>
            <span className="text-xs text-primary mt-2">Barbeiro</span>
          </div>
          <div className="relative flex items-center flex-1 mx-4">
            <div className="flex-1 h-0.5 bg-border"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">3</div>
            <span className="text-xs text-muted-foreground mt-2">Data</span>
          </div>
          <div className="relative flex items-center flex-1 mx-4">
            <div className="flex-1 h-0.5 bg-border"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">4</div>
            <span className="text-xs text-muted-foreground mt-2">Confirmação</span>
          </div>
        </div>

        {/* Barber Selection */}
        <h2 className="text-xl font-semibold mb-6">Escolha o Barbeiro</h2>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Carregando barbeiros...</p>
          </div>
        ) : !barbers || barbers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Não há barbeiros disponíveis no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {barbers.map((barber: any) => (
              <Card 
                key={barber.id}
                className={`${selectedBarberId === barber.id.toString() ? 'border-2 border-primary' : 'hover:border-2 hover:border-primary'} cursor-pointer transition-all duration-200`}
                onClick={() => handleSelectBarber(barber.id.toString())}
              >
                <CardContent className="p-5 flex flex-col items-center justify-center">
                  <Avatar className="w-24 h-24 mb-3">
                    <AvatarImage src="" alt={barber.user.fullName} />
                    <AvatarFallback className="bg-muted text-xl">
                      {getInitials(barber.user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold text-foreground text-center">{barber.user.fullName}</h3>
                  <div className="flex mt-3 space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star} 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 text-primary" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
            disabled={!selectedBarberId || isLoading}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Próximo Passo
          </Button>
        </div>
      </div>
    </div>
  );
}
