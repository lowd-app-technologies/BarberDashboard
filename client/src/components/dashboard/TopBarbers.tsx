import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarberWithUser } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

interface TopBarberData extends BarberWithUser {
  earnings: number;
  percentage: number;
  rank: number;
}

interface TopBarbersProps {
  barbers: TopBarberData[];
  title?: string;
  className?: string;
}

export function TopBarbers({
  barbers,
  title = "Top Barbeiros",
  className
}: TopBarbersProps) {
  const [sortedBarbers, setSortedBarbers] = useState<TopBarberData[]>([]);
  
  // Sort barbers by earnings and calculate percentages
  useEffect(() => {
    if (barbers && barbers.length > 0) {
      const sorted = [...barbers]
        .sort((a, b) => b.earnings - a.earnings)
        .map((barber, index) => ({
          ...barber,
          rank: index + 1,
          percentage: calculatePercentage(barber.earnings, barbers)
        }));
      setSortedBarbers(sorted);
    }
  }, [barbers]);
  
  // Calculate percentage of total earnings
  const calculatePercentage = (earnings: number, allBarbers: TopBarberData[]) => {
    const maxEarnings = Math.max(...allBarbers.map(b => b.earnings));
    return maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0;
  };
  
  // Get appropriate badge color based on rank
  const getBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-primary";
    if (rank <= 3) return "bg-muted-foreground";
    return "bg-muted-foreground bg-opacity-50";
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
        <div className="space-y-4">
          {sortedBarbers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Não há dados de barbeiros disponíveis
            </div>
          ) : (
            sortedBarbers.slice(0, 3).map((barber) => (
              <div key={barber.id} className="flex items-center">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="" alt={barber.user.fullName} />
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {barber.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -top-1 -right-1 w-5 h-5 ${getBadgeColor(barber.rank)} rounded-full flex items-center justify-center text-xs text-primary-foreground font-bold`}>
                    {barber.rank}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <p className="subheading text-foreground">{barber.user.fullName}</p>
                    <p className="text-primary">{formatCurrency(barber.earnings)}</p>
                  </div>
                  <div className="w-full bg-accent h-2 rounded-full mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${barber.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
