import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart, Scissors, UserRound, BanknoteIcon } from "lucide-react";

export function MobileNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40">
      <ul className="flex justify-around items-center p-3">
        <li className="text-center">
          <Link href="/">
            <a className="flex flex-col items-center">
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
            </a>
          </Link>
        </li>
        <li className="text-center">
          <Link href="/services">
            <a className="flex flex-col items-center">
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
            </a>
          </Link>
        </li>
        <li className="text-center">
          <Link href="/barbers">
            <a className="flex flex-col items-center">
              <UserRound className={cn(
                "text-xl",
                isActive("/barbers") ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs mt-1",
                isActive("/barbers") ? "text-primary" : "text-muted-foreground"
              )}>
                Barbeiros
              </span>
            </a>
          </Link>
        </li>
        <li className="text-center">
          <Link href="/payments">
            <a className="flex flex-col items-center">
              <BanknoteIcon className={cn(
                "text-xl",
                isActive("/payments") ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs mt-1",
                isActive("/payments") ? "text-primary" : "text-muted-foreground"
              )}>
                Pagamentos
              </span>
            </a>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
