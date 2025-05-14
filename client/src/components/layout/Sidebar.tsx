import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart4, 
  Calendar, 
  Home, 
  Users, 
  Scissors, 
  FileText, 
  LogOut,
  DollarSign,
  UserPlus,
  ClipboardCheck,
  Package,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isActive = (path: string) => {
    // Para a rota raiz do dashboard, apenas correspondência exata
    if (path === "/admin" || path === "/barber") {
      return location === path;
    }
    // Para outras rotas, verificar se começa com o path
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
        title: "Produtos",
        icon: <Package className="h-5 w-5" />,
        path: "/admin/products",
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
        title: "Vendas de Produtos",
        icon: <FileText className="h-5 w-5" />,
        path: "/admin/product-sales",
        show: user?.role === "admin"
      },
      {
        title: "Convidar Barbeiro",
        icon: <UserPlus className="h-5 w-5" />,
        path: "/admin/invite-barber",
        show: user?.role === "admin"
      },
      {
        title: "Configurações",
        icon: <Settings className="h-5 w-5" />,
        path: "/admin/settings",
        show: user?.role === "admin"
      }
    ];

    // Items específicos para barbeiro
    const barberItems = [
      {
        title: "Agendamentos",
        icon: <Calendar className="h-5 w-5" />,
        path: "/barber/appointments",
        show: user?.role === "barber"
      },
      {
        title: "Registros de Serviços",
        icon: <ClipboardCheck className="h-5 w-5" />,
        path: "/barber/service-records",
        show: user?.role === "barber"
      },
      {
        title: "Visualizar Produtos",
        icon: <Package className="h-5 w-5" />,
        path: "/barber/products",
        show: false // Temporariamente desabilitado
      },
      {
        title: "Vendas de Produtos",
        icon: <FileText className="h-5 w-5" />,
        path: "/barber/product-sales",
        show: user?.role === "barber"
      },
      {
        title: "Clientes",
        icon: <Users className="h-5 w-5" />,
        path: "/barber/clients",
        show: user?.role === "barber"
      },
      {
        title: "Pagamentos",
        icon: <DollarSign className="h-5 w-5" />,
        path: "/barber/payments",
        show: user?.role === "barber"
      },
      {
        title: "Relatórios",
        icon: <BarChart4 className="h-5 w-5" />,
        path: "/barber/reports",
        show: user?.role === "barber"
      },
      {
        title: "Configurações",
        icon: <Settings className="h-5 w-5" />,
        path: "/barber/settings",
        show: user?.role === "barber"
      }
    ];

    // Combina todos os itens
    return [...commonItems, ...adminItems, ...barberItems].filter(item => item.show);
  };

  const items = getNavigationItems();

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <Scissors className="h-6 w-6" />
          <span className="text-lg font-bold">BarberPRO</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {items.map((item, index) => (
            <Button
              key={index}
              variant={isActive(item.path) ? "default" : "ghost"}
              className={cn("justify-start", isActive(item.path) && "bg-primary text-primary-foreground")}
              onClick={() => setLocation(item.path)}
            >
              {item.icon}
              <span className="ml-2">{item.title}</span>
            </Button>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        {user && (
          <div className="flex items-center gap-2 pb-4">
            <Avatar>
              <AvatarFallback>
                {user.fullName ? getInitials(user.fullName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-0.5">
              <div className="font-medium">{user.fullName}</div>
              <div className="text-xs text-muted-foreground">
                {user.role === "admin" ? "Administrador" : (user.role === "barber" ? "Barbeiro" : "Cliente")}
              </div>
            </div>
          </div>
        )}
        <Separator className="my-4" />
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}