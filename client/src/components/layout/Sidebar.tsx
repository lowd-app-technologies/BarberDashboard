import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart, 
  Scissors, 
  UserRound, 
  Calendar, 
  BanknoteIcon, 
  BarChart3, 
  Settings, 
  LogOut,
  Users
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => location === path;

  return (
    <aside className="fixed hidden md:flex flex-col w-64 h-screen bg-card border-r border-border">
      <div className="flex items-center justify-center h-20 border-b border-border">
        <h1 className="text-primary text-2xl font-bold">BarberPro</h1>
      </div>
      
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
            {user?.user_metadata?.full_name 
              ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              : 'US'}
          </div>
          <div className="ml-3">
            <p className="text-foreground font-semibold subheading">
              {user?.user_metadata?.full_name || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.user_metadata?.role === 'admin' ? 'Administrador' : 'Barbeiro'}
            </p>
          </div>
        </div>
        
        <nav className="mt-8">
          <ul className="space-y-2">
            <li>
              <Link href="/">
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200",
                    isActive("/") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <BarChart className="w-5 h-5" />
                  <span className="ml-3">Dashboard</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/services">
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200",
                    isActive("/services") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Scissors className="w-5 h-5" />
                  <span className="ml-3">Serviços</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/barbers">
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200",
                    isActive("/barbers") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <UserRound className="w-5 h-5" />
                  <span className="ml-3">Barbeiros</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/appointments">
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200",
                    isActive("/appointments") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="ml-3">Agendamentos</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/payments">
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200",
                    isActive("/payments") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <BanknoteIcon className="w-5 h-5" />
                  <span className="ml-3">Pagamentos</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/clients">
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200",
                    isActive("/clients") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Users className="w-5 h-5" />
                  <span className="ml-3">Clientes</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/reports">
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200",
                    isActive("/reports") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="ml-3">Relatórios</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/settings">
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200",
                    isActive("/settings") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Settings className="w-5 h-5" />
                  <span className="ml-3">Configurações</span>
                </a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-border">
        <button 
          onClick={() => logout()} 
          className="flex items-center text-muted-foreground hover:text-secondary transition duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-3">Sair</span>
        </button>
      </div>
    </aside>
  );
}
