import { useState, useEffect } from "react";
import { Bell, X, Calendar, User, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Fetch appointments for the barber
  const { data: appointments } = useQuery({
    queryKey: ['/api/appointments'],
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!appointments) return;

    // Filter appointments for this barber that are pending (these are new notifications)
    const barberId = user?.id; // Assuming user.id contains the barberId for barbers
    if (!barberId) return;

    const pendingAppointments = appointments.filter((appointment: any) => 
      appointment.barberId === barberId && 
      appointment.status === "pending"
    );

    // Set notifications
    setNotifications(pendingAppointments);
    setUnreadCount(pendingAppointments.length);
  }, [appointments, user?.id]);

  // Mark all as read
  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 z-50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {unreadCount > 0
                ? `Você tem ${unreadCount} ${
                    unreadCount === 1 ? "notificação" : "notificações"
                  } não ${unreadCount === 1 ? "lida" : "lidas"}`
                : "Não há notificações novas"}
            </CardDescription>
          </CardHeader>

          <CardContent className="max-h-80 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Não há notificações
              </div>
            ) : (
              notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className="p-3 bg-accent rounded-md"
                >
                  <div className="font-medium mb-1">
                    Novo agendamento: {notification.service.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{notification.client.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(notification.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(notification.date)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          {notifications.length > 0 && (
            <CardFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}