import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart4, 
  Calendar, 
  Home, 
  Menu, 
  Users, 
  Scissors, 
  FileText, 
  LogOut,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNavigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  const getNavigationItems = () => {
    // Items comuns a todos os usuários
    const commonItems = [
      {
        title: "Dashboard",
        icon: <Home className="h-5 w-5" />,
        path: user?.role === "admin" ? "/admin" : (user?.role === "barber" ? "/barber" : "/"),
        show: true
      }
    ];

    // Items específicos para admin
    const adminItems = [
      {
        title: "Serviços",
        icon: <Scissors className="h-5 w-5" />,
        path: "/admin/services",
        show: user?.role === "admin"
      },
      {
        title: "Barbeiros",
        icon: <Users className="h-5 w-5" />,
        path: "/admin/barbers",
        show: user?.role === "admin"
      },
      {
        title: "Agendamentos",
        icon: <Calendar className="h-5 w-5" />,
        path: "/admin/appointments",
        show: user?.role === "admin"
      },
      {
        title: "Pagamentos",
        icon: <DollarSign className="h-5 w-5" />,
        path: "/admin/payments",
        show: user?.role === "admin"
      },
      {
        title: "Clientes",
        icon: <Users className="h-5 w-5" />,
        path: "/admin/clients",
        show: user?.role === "admin"
      },
      {
        title: "Convidar Barbeiro",
        icon: <Users className="h-5 w-5" />,
        path: "/barber/invite",
        show: user?.role === "admin"
      }
    ];

    // Items específicos para barbeiro
    const barberItems = [
      {
        title: "Relatórios",
        icon: <FileText className="h-5 w-5" />,
        path: "/barber/reports",
        show: user?.role === "barber"
      }
    ];

    // Combina todos os itens
    return [...commonItems, ...adminItems, ...barberItems].filter(item => item.show);
  };

  const items = getNavigationItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-background border-t md:hidden">
      <div className="flex justify-between items-center p-2">
        <div className="flex-1 flex items-center justify-center">
          <Button variant="ghost" size="icon" onClick={() => setLocation(user?.role === "admin" ? "/admin" : (user?.role === "barber" ? "/barber" : "/"))}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
        
        {user?.role === "barber" && (
          <div className="flex-1 flex items-center justify-center">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/barber/reports")}>
              <BarChart4 className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        {user?.role === "admin" && (
          <div className="flex-1 flex items-center justify-center">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/appointments")}>
              <Calendar className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        <div className="flex-1 flex items-center justify-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <nav className="flex flex-col gap-2">
                  {items.map((item, index) => (
                    <Button
                      key={index}
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => setLocation(item.path)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                    </Button>
                  ))}
                  
                  <Button variant="ghost" className="justify-start text-destructive" onClick={logout}>
                    <LogOut className="h-5 w-5 mr-2" />
                    Sair
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}