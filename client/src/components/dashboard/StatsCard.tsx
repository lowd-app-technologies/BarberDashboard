import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBackground?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconBackground = "bg-primary bg-opacity-20",
}: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-2xl mt-1 font-bold">{value}</p>
          {trend && (
            <p 
              className={cn(
                "text-sm mt-1 flex items-center",
                trend.isPositive ? "barber-pro-success" : "barber-pro-error"
              )}
            >
              {trend.isPositive ? (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M12 7a1 1 0 01-1 1H9v2h2a1 1 0 110 2H9v2h2a1 1 0 110 2H7a1 1 0 01-1-1v-2a1 1 0 011-1h2V9H7a1 1 0 01-1-1V6a1 1 0 011-1h4a1 1 0 011 1z" 
                    clipRule="evenodd" 
                  />
                </svg>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M12 13a1 1 0 01-1 1H9v2h2a1 1 0 110 2H7a1 1 0 01-1-1v-2a1 1 0 011-1h2v-2H7a1 1 0 01-1-1v-2a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H9v2h2a1 1 0 011 1z" 
                    clipRule="evenodd" 
                  />
                </svg>
              )}
              {trend.value}%
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-full", iconBackground)}>
          <Icon className={cn(
            iconBackground.includes("primary") ? "text-primary" : 
            iconBackground.includes("secondary") ? "text-secondary" : 
            "text-accent-foreground"
          )} />
        </div>
      </div>
    </div>
  );
}
