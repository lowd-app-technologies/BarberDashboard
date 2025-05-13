import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";

// Admin Pages
import Dashboard from "@/pages/dashboard";
import Services from "@/pages/services";
import Barbers from "@/pages/barbers";
import Appointments from "@/pages/appointments";
import Payments from "@/pages/payments";

// Auth Pages
import Login from "@/pages/login";
import Register from "@/pages/register";

// Public Pages
import Booking from "@/pages/booking";

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
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Public routes - available to all users, including unauthenticated ones
  if (location === "/" || location === "/booking") {
    return (
      <Switch>
        <Route path="/" component={Booking} />
        <Route path="/booking" component={Booking} />
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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
