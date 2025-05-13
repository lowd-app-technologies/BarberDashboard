import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart, Scissors, UserRound, BanknoteIcon, Calendar, BarChart3, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function MobileNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Determina o papel do usuário
  const userRole = user?.role || 'client';
  const isAdmin = userRole === 'admin';
  const isBarber = userRole === 'barber';

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40">
      <ul className="flex justify-around items-center p-3">
        {/* Dashboard - disponível para todos */}
        <li className="text-center">
          <Link href="/">
            <div className="flex flex-col items-center">
              <BarChart className={cn(
                "text-xl",
                isActive("/") ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs mt-1",
                isActive("/") ? "text-primary" : "text-muted-foreground"
              )}>
                Dashboard
              </span>
            </div>
          </Link>
        </li>
        
        {/* Menu de Administrador */}
        {isAdmin && (
          <>
            <li className="text-center">
              <Link href="/appointments">
                <div className="flex flex-col items-center">
                  <Calendar className={cn(
                    "text-xl",
                    isActive("/appointments") ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs mt-1",
                    isActive("/appointments") ? "text-primary" : "text-muted-foreground"
                  )}>
                    Agenda
                  </span>
                </div>
              </Link>
            </li>
            <li className="text-center">
              <Link href="/clients">
                <div className="flex flex-col items-center">
                  <Users className={cn(
                    "text-xl",
                    isActive("/clients") ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs mt-1",
                    isActive("/clients") ? "text-primary" : "text-muted-foreground"
                  )}>
                    Clientes
                  </span>
                </div>
              </Link>
            </li>
            <li className="text-center">
              <Link href="/services">
                <div className="flex flex-col items-center">
                  <Scissors className={cn(
                    "text-xl",
                    isActive("/services") ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs mt-1",
                    isActive("/services") ? "text-primary" : "text-muted-foreground"
                  )}>
                    Serviços
                  </span>
                </div>
              </Link>
            </li>
            <li className="text-center">
              <Link href="/payments">
                <div className="flex flex-col items-center">
                  <BanknoteIcon className={cn(
                    "text-xl",
                    isActive("/payments") ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs mt-1",
                    isActive("/payments") ? "text-primary" : "text-muted-foreground"
                  )}>
                    Pagtos
                  </span>
                </div>
              </Link>
            </li>
          </>
        )}
        
        {/* Menu de Barbeiro */}
        {isBarber && (
          <>
            <li className="text-center">
              <Link href="/reports">
                <div className="flex flex-col items-center">
                  <BarChart3 className={cn(
                    "text-xl",
                    isActive("/reports") ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs mt-1",
                    isActive("/reports") ? "text-primary" : "text-muted-foreground"
                  )}>
                    Relatórios
                  </span>
                </div>
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
