import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  FileText, 
  DownloadIcon,
  Calendar as CalendarIcon,
  UserRound,
  DollarSign,
  CalendarRange,
  FilterIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form schema for creating/editing payments
const paymentFormSchema = z.object({
  barberId: z.string({
    required_error: "Selecione um barbeiro",
  }),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "O valor deve ser um número positivo" }
  ),
  periodStart: z.date({
    required_error: "Selecione a data de início do período",
  }),
  periodEnd: z.date({
    required_error: "Selecione a data de fim do período",
  }),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function Payments() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [barberFilter, setBarberFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  
  const { toast } = useToast();
  
  // Fetch payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/payments'],
  });
  
  // Fetch barbers for dropdown
  const { data: barbers } = useQuery({
    queryKey: ['/api/barbers'],
  });
  
  // Mark payment as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      await apiRequest("PATCH", `/api/payments/${paymentId}/pay`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: "Pagamento realizado",
        description: "O pagamento foi marcado como pago com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message || "Ocorreu um erro ao atualizar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Pagamento criado",
        description: "O pagamento foi criado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar pagamento",
        description: error.message || "Ocorreu um erro ao criar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  });
  
  // Filter payments
  const filteredPayments = payments 
    ? payments.filter((payment: any) => {
        // Status filter
        const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
        
        // Barber filter
        const matchesBarber = barberFilter === "all" || 
          payment.barber.id.toString() === barberFilter;
        
        // Date filter (checks if the payment period overlaps with the selected date)
        const matchesDate = !dateFilter || 
          (new Date(payment.periodStart) <= dateFilter && 
           new Date(payment.periodEnd) >= dateFilter);
        
        return matchesStatus && matchesBarber && matchesDate;
      })
    : [];
  
  // Mark payment as paid
  const handleMarkAsPaid = (paymentId: number) => {
    markAsPaidMutation.mutate(paymentId);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setBarberFilter("all");
    setDateFilter(undefined);
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-[hsl(var(--success))]">Pago</Badge>;
      default:
        return <Badge variant="outline" className="border-[hsl(var(--warning))] text-[hsl(var(--warning))]">Pendente</Badge>;
    }
  };
  
  // PaymentForm component
  function PaymentForm({ onCancel }: { onCancel: () => void }) {
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    
    const form = useForm<PaymentFormValues>({
      resolver: zodResolver(paymentFormSchema),
      defaultValues: {
        barberId: "",
        amount: "",
        notes: "",
      },
    });
    
    const onSubmit = (data: PaymentFormValues) => {
      createPaymentMutation.mutate({
        barberId: parseInt(data.barberId),
        amount: parseFloat(data.amount),
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        notes: data.notes,
        status: "pending"
      });
    };
    
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="barberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barbeiro</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um barbeiro" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {barbers && barbers.map((barber: any) => (
                      <SelectItem 
                        key={barber.id} 
                        value={barber.id.toString()}
                      >
                        {barber.user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (€)</FormLabel>
                <FormControl>
                  <Input placeholder="1000.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="periodStart"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Início</FormLabel>
                  <DatePicker 
                    date={field.value} 
                    setDate={(date) => {
                      setStartDate(date);
                      field.onChange(date);
                    }} 
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="periodEnd"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Fim</FormLabel>
                  <DatePicker 
                    date={field.value} 
                    setDate={(date) => {
                      setEndDate(date);
                      field.onChange(date);
                    }}
                    disabled={!startDate}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Adicione quaisquer observações relevantes" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={createPaymentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? "Criando..." : "Criar Pagamento"}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Sidebar />
      
      {/* Mobile Header */}
      <header className="bg-card p-4 flex justify-between items-center md:hidden">
        <h1 className="text-primary text-xl font-bold">BarberPro</h1>
        <button className="text-foreground">
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
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Pagamentos</h1>
          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="md:ml-auto flex">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Filtros
                  {(statusFilter !== "all" || dateFilter || barberFilter !== "all") && (
                    <Badge className="ml-2 bg-primary">!</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrar Pagamentos</h4>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Barbeiro</label>
                    <Select
                      value={barberFilter}
                      onValueChange={setBarberFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {barbers && barbers.map((barber: any) => (
                          <SelectItem 
                            key={barber.id} 
                            value={barber.id.toString()}
                          >
                            {barber.user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data no Período</label>
                    <DatePicker 
                      date={dateFilter} 
                      setDate={setDateFilter} 
                      className="w-full" 
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearFilters} 
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Pagamento</DialogTitle>
                  <DialogDescription>
                    Crie um novo registro de pagamento para um barbeiro.
                  </DialogDescription>
                </DialogHeader>
                <PaymentForm onCancel={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <PaymentList 
              payments={filteredPayments.filter((p: any) => p.status === 'pending')}
              isLoading={isLoadingPayments}
              onMarkAsPaid={handleMarkAsPaid}
              emptyMessage="Não há pagamentos pendentes."
            />
          </TabsContent>
          
          <TabsContent value="paid">
            <PaymentList 
              payments={filteredPayments.filter((p: any) => p.status === 'paid')}
              isLoading={isLoadingPayments}
              onMarkAsPaid={handleMarkAsPaid}
              emptyMessage="Não há pagamentos concluídos."
            />
          </TabsContent>
          
          <TabsContent value="all">
            <PaymentList 
              payments={filteredPayments}
              isLoading={isLoadingPayments}
              onMarkAsPaid={handleMarkAsPaid}
              emptyMessage="Não há pagamentos registrados."
            />
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNavigation />
    </div>
  );
}

// PaymentList component
interface PaymentListProps {
  payments: any[];
  isLoading: boolean;
  onMarkAsPaid: (paymentId: number) => void;
  emptyMessage?: string;
}

function PaymentList({ 
  payments, 
  isLoading, 
  onMarkAsPaid,
  emptyMessage = "Não há pagamentos."
}: PaymentListProps) {
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-[hsl(var(--success))]">Pago</Badge>;
      default:
        return <Badge variant="outline" className="border-[hsl(var(--warning))] text-[hsl(var(--warning))]">Pendente</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Pagamentos</CardTitle>
        <CardDescription>
          Gerencie os pagamentos aos barbeiros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando pagamentos...</div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barbeiro</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-muted-foreground bg-opacity-20 text-foreground">
                          {payment.barber.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{payment.barber.user.fullName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm">{formatDate(payment.periodStart)}</div>
                        <div className="text-sm text-muted-foreground">até {formatDate(payment.periodEnd)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell>
                    {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === 'pending' ? (
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkAsPaid(payment.id)}
                          className="text-[hsl(var(--success))] hover:text-[hsl(var(--success))] hover:bg-[hsl(var(--success))/10]"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Marcar como Pago</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Detalhes</span>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        <span className="sr-only">Exportar</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
