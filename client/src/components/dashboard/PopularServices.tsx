import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Service } from "@shared/schema";

interface PopularServiceData extends Service {
  count: number;
  trend: number;
  iconColor?: string;
}

interface PopularServicesProps {
  services: PopularServiceData[];
  title?: string;
  className?: string;
}

export function PopularServices({
  services,
  title = "Serviços Populares",
  className
}: PopularServicesProps) {
  const getIconBackgroundColor = (index: number) => {
    const colors = [
      "bg-primary bg-opacity-20",
      "bg-secondary bg-opacity-20",
      "bg-[hsl(var(--warning))] bg-opacity-20"
    ];
    
    return index < colors.length ? colors[index] : "bg-accent bg-opacity-20";
  };
  
  const getIconColor = (index: number) => {
    const colors = [
      "text-primary",
      "text-secondary",
      "text-[hsl(var(--warning))]"
    ];
    
    return index < colors.length ? colors[index] : "text-accent-foreground";
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <button className="text-muted-foreground hover:text-foreground">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground pb-3">Serviço</th>
                <th className="text-right text-xs text-muted-foreground pb-3">Valor</th>
                <th className="text-right text-xs text-muted-foreground pb-3">Vendidos</th>
                <th className="text-right text-xs text-muted-foreground pb-3">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted-foreground">
                    Não há dados de serviços disponíveis
                  </td>
                </tr>
              ) : (
                services.map((service, index) => (
                  <tr key={service.id} className="border-b border-border">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                          getIconBackgroundColor(index)
                        )}>
                          <Scissors className={cn("text-xs", getIconColor(index))} />
                        </div>
                        <span className="text-foreground">{service.name}</span>
                      </div>
                    </td>
                    <td className="text-right text-foreground py-3">
                      {formatCurrency(service.price)}
                    </td>
                    <td className="text-right text-foreground py-3">{service.count}</td>
                    <td className="text-right py-3">
                      <span className={cn(
                        "inline-flex items-center text-sm",
                        !service.trend || isNaN(service.trend) ? "text-muted-foreground" : (service.trend > 0 ? "barber-pro-success" : "barber-pro-error")
                      )}>
                        {!service.trend || isNaN(service.trend) ? null : service.trend > 0 ? (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 mr-1 text-xs" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        ) : (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 mr-1 text-xs" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        )}
                        {Number.isNaN(service.trend) || service.trend === null ? '-' : `${Math.abs(service.trend)}%`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
