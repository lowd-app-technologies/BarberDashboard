import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

// Admin Pages
import Dashboard from "@/pages/dashboard";
import Services from "@/pages/services";
import Barbers from "@/pages/barbers";
import Appointments from "@/pages/appointments";
import Payments from "@/pages/payments";
import Clients from "@/pages/clients";
import Products from "@/pages/products";
import ProductSales from "@/pages/product-sales";
import CompletedServicesAdmin from "@/pages/completed-services";
import InviteBarber from "@/pages/barber/invite";
import Settings from "@/pages/settings";

// Barber Pages
import BarberRegister from "@/pages/barber/register";
import ServiceRecords from "@/pages/barber/service-records";
import BarberClients from "@/pages/barber/clients";

// Auth Pages
import Login from "@/pages/login";
import Register from "@/pages/register";

// Booking App Pages (Cliente)
import BookingApp from "@/booking/pages";
import ThankYouPage from "@/booking/pages/thank-you";
import ClientLogin from "@/booking/pages/login";
import ClientRegister from "@/booking/pages/register";

// Other Pages
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isBookingDomain, setIsBookingDomain] = useState(false);
  
  // Usar a role do usuário autenticado, ou 'client' como padrão
  const role = user?.role || 'client';
  
  useEffect(() => {
    const hostname = window.location.hostname;
    const isBooking = hostname.includes('booking') || location.startsWith('/booking');
    setIsBookingDomain(isBooking);
  }, [location]);
  
  console.log("Current location:", location);
  console.log("User role:", role);

  // Auth routes and Barber Registration routes
  if (location === "/login" || location === "/register" || location === "/barber/register") {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/barber/register" component={BarberRegister} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Admin routes - acessível apenas para usuários com role 'admin'
  if (role === 'admin') {
    return (
      <Switch>
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/services" component={Services} />
        <Route path="/admin/barbers" component={Barbers} />
        <Route path="/admin/appointments" component={Appointments} />
        <Route path="/admin/payments" component={Payments} />
        <Route path="/admin/clients" component={Clients} />
        <Route path="/admin/products" component={Products} />
        <Route path="/admin/product-sales" component={ProductSales} />
        <Route path="/admin/completed-services" component={CompletedServicesAdmin} />
        <Route path="/admin/invite-barber" component={InviteBarber} />
        <Route path="/admin/settings" component={Settings} />
        <Route path="/barber/invite" component={InviteBarber} />
        
        {/* Rotas sem prefixo para admin */}
        <Route path="/appointments" component={Appointments} />
        <Route path="/services" component={Services} />
        <Route path="/barbers" component={Barbers} />
        <Route path="/clients" component={Clients} />
        <Route path="/payments" component={Payments} />
        <Route path="/products" component={Products} />
        <Route path="/product-sales" component={ProductSales} />
        <Route path="/completed-services" component={CompletedServicesAdmin} />
        <Route path="/settings" component={Settings} />
        
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Barber routes - acessível apenas para usuários com role 'barber'
  if (role === 'barber') {
    return (
      <Switch>
        <Route path="/barber" component={Dashboard} />
        <Route path="/barber/appointments" component={Appointments} />
        <Route path="/barber/clients" component={BarberClients} />
        <Route path="/barber/payments" component={Payments} />
        <Route path="/barber/service-records" component={ServiceRecords} />
        <Route path="/barber/product-sales" component={ProductSales} />
        <Route path="/barber/completed-services" component={CompletedServicesAdmin} />
        <Route path="/barber/settings" component={Settings} />
        
        {/* Rotas sem prefixo para barber */}
        <Route path="/appointments" component={Appointments} />
        <Route path="/clients" component={Clients} />
        <Route path="/payments" component={Payments} />
        <Route path="/service-records" component={ServiceRecords} />
        <Route path="/product-sales" component={ProductSales} />
        <Route path="/completed-services" component={CompletedServicesAdmin} />
        <Route path="/settings" component={Settings} />
        
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Cliente auth routes
  if (location === "/booking/login" || location === "/booking/register") {
    return (
      <Switch>
        <Route path="/booking/login" component={ClientLogin} />
        <Route path="/booking/register" component={ClientRegister} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Public routes - available to all users, including unauthenticated ones
  if (location === "/" || location === "/booking" || location === "/thank-you") {
    return (
      <Switch>
        <Route path="/" component={BookingApp} />
        <Route path="/booking" component={BookingApp} />
        <Route path="/thank-you" component={ThankYouPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Default - show login if nothing matches
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
