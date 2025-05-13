import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Phone, MapPin } from "lucide-react";

export default function BookingServiceSelection() {
  const [, setLocation] = useLocation();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Fetch services
  const { data: services, isLoading } = useQuery({
    queryKey: ['/api/services/active'],
  });

  // Handle service selection
  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  // Go to next step
  const handleNextStep = () => {
    if (selectedServiceId) {
      localStorage.setItem('booking_service_id', selectedServiceId);
      setLocation('/booking/barber');
    }
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
            <p className="text-muted-foreground">O melhor da barbearia tradicional com toques modernos</p>
          </div>
        </div>
      </div>

      {/* Booking Process */}
      <div className="container mx-auto p-6">
        {/* Steps */}
        <div className="flex justify-between mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">1</div>
            <span className="text-xs text-primary mt-2">Serviço</span>
          </div>
          <div className="relative flex items-center flex-1 mx-4">
            <div className="flex-1 h-0.5 bg-border"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">2</div>
            <span className="text-xs text-muted-foreground mt-2">Barbeiro</span>
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

        {/* Service Selection */}
        <h2 className="text-xl font-semibold mb-6">Escolha o Serviço</h2>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Carregando serviços...</p>
          </div>
        ) : !services || services.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Não há serviços disponíveis no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {services.map((service: any) => (
              <Card 
                key={service.id}
                className={`${selectedServiceId === service.id.toString() ? 'border-2 border-primary' : 'hover:border-2 hover:border-primary'} cursor-pointer transition-all duration-200`}
                onClick={() => handleSelectService(service.id.toString())}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{service.description || "Sem descrição"}</p>
                      <p className="text-sm text-muted-foreground mt-1">Duração: <span className="text-foreground">{service.duration} min</span></p>
                    </div>
                    <p className="text-primary text-lg">{formatCurrency(service.price)}</p>
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
            onClick={() => window.history.back()}
            className="px-6 py-3 border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNextStep}
            disabled={!selectedServiceId || isLoading}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Próximo Passo
          </Button>
        </div>
      </div>
    </div>
  );
}
