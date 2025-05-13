import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MoreVertical, User } from "lucide-react";
import { NotificationsPanel } from "@/components/barber/NotificationsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout } = useAuth();
  
  const getInitials = (name: string) => {
    return name.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isBarber = user?.role === "barber";

  return (
    <header className="bg-card p-4 flex justify-between items-center shadow-md md:ml-64">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold mr-3">
          {user?.fullName 
            ? getInitials(user.fullName)
            : "BP"}
        </div>
        <div>
          <h1 className="text-primary text-lg font-bold">
            {user?.fullName || "Usuário"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {user?.role === "admin" 
              ? "Administrador" 
              : user?.role === "barber" 
                ? "Barbeiro" 
                : "Cliente"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Apenas mostra o painel de notificações para barbeiros */}
        {isBarber && <NotificationsPanel />}
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="text-muted-foreground hover:text-foreground transition-colors duration-200">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => logout()}
            >
              Sair
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => window.location.href = "/settings"}
            >
              Configurações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}