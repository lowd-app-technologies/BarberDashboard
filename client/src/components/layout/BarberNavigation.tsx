import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Calendar, PlusCircle, BanknoteIcon } from "lucide-react";

export function BarberNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <ul className="flex justify-around items-center p-3">
        <li className="text-center">
          <Link href="/">
            <a className="flex flex-col items-center">
              <Home className={cn(
                "text-xl",
                isActive("/") ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs mt-1",
                isActive("/") ? "text-primary" : "text-muted-foreground"
              )}>
                Início
              </span>
            </a>
          </Link>
        </li>
        <li className="text-center">
          <Link href="/appointments">
            <a className="flex flex-col items-center">
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
            </a>
          </Link>
        </li>
        <li className="text-center">
          <Link href="/add-service">
            <a className="flex flex-col items-center">
              <PlusCircle className={cn(
                "text-xl",
                isActive("/add-service") ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs mt-1",
                isActive("/add-service") ? "text-primary" : "text-muted-foreground"
              )}>
                Serviço
              </span>
            </a>
          </Link>
        </li>
        <li className="text-center">
          <Link href="/earnings">
            <a className="flex flex-col items-center">
              <BanknoteIcon className={cn(
                "text-xl",
                isActive("/earnings") ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs mt-1",
                isActive("/earnings") ? "text-primary" : "text-muted-foreground"
              )}>
                Ganhos
              </span>
            </a>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
