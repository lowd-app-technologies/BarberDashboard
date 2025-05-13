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
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200 cursor-pointer",
                    isActive("/") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <BarChart className="w-5 h-5" />
                  <span className="ml-3">Dashboard</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/services">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200 cursor-pointer",
                    isActive("/services") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Scissors className="w-5 h-5" />
                  <span className="ml-3">Serviços</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/barbers">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200 cursor-pointer",
                    isActive("/barbers") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <UserRound className="w-5 h-5" />
                  <span className="ml-3">Barbeiros</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/appointments">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200 cursor-pointer",
                    isActive("/appointments") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="ml-3">Agendamentos</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/payments">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200 cursor-pointer",
                    isActive("/payments") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <BanknoteIcon className="w-5 h-5" />
                  <span className="ml-3">Pagamentos</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/clients">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200 cursor-pointer",
                    isActive("/clients") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Users className="w-5 h-5" />
                  <span className="ml-3">Clientes</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/reports">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200 cursor-pointer",
                    isActive("/reports") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="ml-3">Relatórios</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/settings">
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded transition duration-200 cursor-pointer",
                    isActive("/settings") 
                      ? "bg-primary bg-opacity-20 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Settings className="w-5 h-5" />
                  <span className="ml-3">Configurações</span>
                </div>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-border">
        <div 
          onClick={() => logout()} 
          className="flex items-center text-muted-foreground hover:text-secondary transition duration-200 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-3">Sair</span>
        </div>
      </div>
    </aside>
  );
}
