import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";

// Admin Pages
import Dashboard from "@/pages/dashboard";
import Services from "@/pages/services";
import Barbers from "@/pages/barbers";
import Appointments from "@/pages/appointments";
import Payments from "@/pages/payments";
import Clients from "@/pages/clients";

// Auth Pages
import Login from "@/pages/login";
import Register from "@/pages/register";

// Booking App Pages (Cliente)
import BookingApp from "@/booking/pages";
import ThankYouPage from "@/booking/pages/thank-you";

// Other Pages
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  // For development purposes, hardcode role depending on path
  let role = 'client';
  
  if (location.startsWith("/admin")) {
    role = 'admin';
  } else if (location.startsWith("/barber")) {
    role = 'barber';
  }

  // Auth routes
  if (location === "/login" || location === "/register") {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
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
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Direct access routes - without role prefix (for backward compatibility)
  if (location === "/appointments" || 
      location === "/services" || 
      location === "/barbers" || 
      location === "/clients" || 
      location === "/payments") {
    return (
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/services" component={Services} />
        <Route path="/barbers" component={Barbers} />
        <Route path="/clients" component={Clients} />
        <Route path="/payments" component={Payments} />
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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
