import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTime } from "@/lib/utils";
import { Link } from "wouter";
import { AppointmentWithDetails } from "@shared/schema";

interface AppointmentsListProps {
  appointments: AppointmentWithDetails[];
  title?: string;
  showAllLink?: string;
  emptyMessage?: string;
  maxItems?: number;
}

export function AppointmentsList({
  appointments,
  title = "Próximos Agendamentos",
  showAllLink,
  emptyMessage = "Não há agendamentos",
  maxItems = 3
}: AppointmentsListProps) {
  // Determine if appointment is today or tomorrow
  const getRelativeDay = (date: string | Date) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Reset time part for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    if (appointmentDate.getTime() === today.getTime()) {
      return "Hoje";
    } else if (appointmentDate.getTime() === tomorrow.getTime()) {
      return "Amanhã";
    } else {
      return new Intl.DateTimeFormat('pt-PT', { 
        day: '2-digit', 
        month: '2-digit' 
      }).format(appointmentDate);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {showAllLink && (
          <Link href={showAllLink} className="text-primary text-sm hover:underline">
            Ver todos
          </Link>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {appointments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.slice(0, maxItems).map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex items-center p-3 bg-accent bg-opacity-40 rounded-lg"
              >
                <Avatar className="w-12 h-12 mr-3">
                  <AvatarImage src="" alt={appointment.client.fullName} />
                  <AvatarFallback className="bg-muted-foreground bg-opacity-20 text-foreground">
                    {appointment.client.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground subheading">
                    {appointment.client.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.service.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary">{formatTime(appointment.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getRelativeDay(appointment.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
