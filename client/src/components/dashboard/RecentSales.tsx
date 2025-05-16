import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { CalendarIcon, UserCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Sale = {
  id: number;
  date: string;
  barber: string;
  client: string;
  product: string;
  quantity: number;
  total: number;
};

interface RecentSalesProps {
  sales: Sale[];
  title?: string;
  showAllLink?: string;
  emptyMessage?: string;
  className?: string;
}

export function RecentSales({
  sales = [],
  title = "Vendas Recentes",
  showAllLink,
  emptyMessage = "Não há vendas recentes",
  className = "",
}: RecentSalesProps) {
  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          {showAllLink && (
            <a 
              href={showAllLink} 
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {sales.map((sale) => (
                <div 
                  key={sale.id} 
                  className="flex flex-col space-y-2 rounded-md border p-3 transition-all hover:bg-muted/50"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{sale.product}</div>
                    <div className="font-bold">{formatCurrency(sale.total)}</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-y-1 gap-x-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                      {format(new Date(sale.date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </div>
                    
                    <div className="flex items-center">
                      <UserCircle className="mr-1 h-3.5 w-3.5" />
                      {sale.client}
                    </div>
                    
                    <div className="flex items-center">
                      <Package className="mr-1 h-3.5 w-3.5" />
                      Qtd: {sale.quantity}
                    </div>
                    
                    <div className="w-full flex items-center mt-1">
                      <span className="mr-1 text-xs uppercase font-semibold">Barbeiro:</span> {sale.barber}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}