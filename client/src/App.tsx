import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
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
import CompletedServices from "@/pages/completed-services";

// Barber Pages
import InviteBarber from "@/pages/barber/invite";
import BarberRegister from "@/pages/barber/register";
import ServiceRecords from "@/pages/barber/service-records";

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
import Settings from "@/pages/settings";

function Router() {
  const [location] = useLocation();
  const [isBookingDomain, setIsBookingDomain] = useState(false);
  
  // Determinar o papel com base no caminho atual e no domínio
  let role = 'client';
  
  useEffect(() => {
    // Verificar se estamos no subdomínio de booking ou no domínio principal
    const hostname = window.location.hostname;
    // Lógica simplificada para verificar se estamos no contexto de agendamento
    const isBooking = hostname.includes('booking') || location.startsWith('/booking');
    setIsBookingDomain(isBooking);
  }, [location]);
  
  console.log("Current location:", location);
  
  if (location.startsWith("/admin")) {
    role = 'admin';
    console.log("Role set to admin based on path");
  } else if (location.startsWith("/barber")) {
    role = 'barber';
    console.log("Role set to barber based on path");
  } else if (location.startsWith("/booking") || isBookingDomain) {
    role = 'client';
    console.log("Role set to client based on path or domain");
  } else {
    console.log("Default role: client");
  }

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

  // Admin routes
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
        <Route path="/admin/completed-services" component={CompletedServices} />
        <Route path="/admin/invite-barber" component={InviteBarber} />
        <Route path="/admin/settings" component={Settings} />
        <Route path="/barber/invite" component={InviteBarber} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Barber routes
  if (role === 'barber') {
    return (
      <Switch>
        <Route path="/barber" component={Dashboard} />
        <Route path="/barber/appointments" component={Appointments} />
        <Route path="/barber/clients" component={Clients} />
        <Route path="/barber/payments" component={Payments} />
        <Route path="/barber/service-records" component={ServiceRecords} />
        <Route path="/barber/product-sales" component={ProductSales} />
        <Route path="/barber/completed-services" component={CompletedServices} />
        <Route path="/barber/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Direct access routes - without role prefix (for backward compatibility)
  if (location === "/appointments" || 
      location === "/services" || 
      location === "/barbers" || 
      location === "/clients" || 
      location === "/payments" ||
      location === "/products" ||
      location === "/settings" ||
      location === "/product-sales" ||
      location === "/completed-services") {
    return (
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/services" component={Services} />
        <Route path="/barbers" component={Barbers} />
        <Route path="/clients" component={Clients} />
        <Route path="/payments" component={Payments} />
        <Route path="/products" component={Products} />
        <Route path="/product-sales" component={ProductSales} />
        <Route path="/completed-services" component={CompletedServices} />
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
