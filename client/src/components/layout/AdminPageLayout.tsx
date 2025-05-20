import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Users,
  Scissors,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  Settings,
  CheckSquare,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminPageLayoutProps {
  children: ReactNode;
}

export function AdminPageLayout({ children }: AdminPageLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Menu items
  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      name: "Agenda",
      path: "/admin/appointments",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: "Barbeiros",
      path: "/admin/barbers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Clientes",
      path: "/admin/clients",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Serviços",
      path: "/admin/services",
      icon: <Scissors className="h-5 w-5" />,
    },
    {
      name: "Serviços Realizados",
      path: "/admin/completed-services",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      name: "Produtos",
      path: "/admin/products",
      icon: <Package className="h-5 w-5" />,
    },
    {
      name: "Vendas de Produtos",
      path: "/admin/product-sales",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      name: "Pagamentos",
      path: "/admin/payments",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: "Convidar Barbeiro",
      path: "/admin/invite-barber",
      icon: <UserPlus className="h-5 w-5" />,
    },
    {
      name: "Configurações",
      path: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-background">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-5">
              <h1 className="text-xl font-bold text-primary">BarberPRO</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    location === item.path || 
                    (item.path !== "/admin" && location.startsWith(item.path))
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-border p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src="/user-avatar.png" alt={user?.fullName || 'Usuário'} />
                  <AvatarFallback>{user?.fullName?.substring(0, 2) || 'AD'}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    {user?.fullName || user?.displayName || 'Administrador'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || 'admin@barberpro.com'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}