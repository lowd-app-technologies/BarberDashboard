import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Trash, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Layout } from "@/components/layout/Layout";

// Schema para formulário de venda de produto
const productSaleSchema = z.object({
  productId: z.number(),
  barberId: z.number(),
  clientName: z.string().min(2, { message: 'Nome do cliente é obrigatório' }),
  clientId: z.number().nullable().optional(),
  date: z.string().transform(val => new Date(val)),
  quantity: z.string().transform(val => parseInt(val)),
  unitPrice: z.string().min(1, { message: 'Preço unitário é obrigatório' }),
});

// Tipo para o formulário
type ProductSaleFormValues = z.infer<typeof productSaleSchema>;

// Tipo para produto da API
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  costPrice: string;
  category: string;
  sku: string;
  stockQuantity: number;
  active: boolean;
  imageUrl: string | null;
  createdAt: string;
  commission?: ProductCommission;
}

// Tipo para comissão de produto da API
interface ProductCommission {
  id: number;
  barberId: number;
  productId: number;
  percentage: string;
  createdAt: string;
}

// Tipo para barbeiro com usuário
interface BarberWithUser {
  id: number;
  userId: number;
  nif: string;
  iban: string;
  paymentPeriod: string;
  active: boolean;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
  };
}

// Tipo para venda de produto da API
interface ProductSale {
  id: number;
  barberId: number;
  productId: number;
  clientId: number | null;
  clientName: string;
  quantity: number;
  unitPrice: string;
  date: string;
  validatedByAdmin: boolean;
  createdAt: string;
  product: Product;
  barber: BarberWithUser;
}

// Tipo para cliente com perfil
interface ClientWithProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  profile: {
    userId: number;
    id: number;
    birthdate: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    notes: string | null;
    referralSource: string | null;
    lastVisit: string | null;
  };
}

export default function ProductSales() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const isAdmin = user?.role === 'admin';
  const isBarber = user?.role === 'barber';

  // Query para barbeiro atual (se for um barbeiro)
  const { data: barber } = useQuery({
    queryKey: ['/api/user/barber'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/user/barber');
        const data = await response.json();
        return data && data.id ? { id: data.id } : null;
      } catch (error) {
        console.error('Erro ao buscar barbeiro:', error);
        return null;
      }
    },
    enabled: isBarber,
  });

  // Query para buscar vendas
  const { data: sales, isLoading: isLoadingSales } = useQuery({
    queryKey: [isAdmin ? '/api/product-sales' : `/api/product-sales/barber/${barber?.id}`],
    queryFn: async () => {
      const endpoint = isAdmin ? '/api/product-sales' : `/api/product-sales/barber/${barber?.id}`;
      try {
        const response = await apiRequest('GET', endpoint);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        return [];
      }
    },
    enabled: isAdmin || (isBarber && !!barber?.id),
  });

  // Query para buscar produtos
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: [isBarber && barber?.id ? `/api/barber/${barber.id}/products-with-commissions` : '/api/products/active'],
    queryFn: async () => {
      const endpoint = isBarber && barber?.id 
        ? `/api/barber/${barber.id}/products-with-commissions` 
        : '/api/products/active';
      
      try {
        const response = await apiRequest('GET', endpoint);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error(`Erro ao buscar produtos: ${error}`);
        return [];
      }
    },
    enabled: !isBarber || (isBarber && !!barber?.id),
  });

  // Query para buscar barbeiros (admin apenas)
  const { data: barbers, isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['/api/barbers'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/barbers');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error(`Erro ao buscar barbeiros: ${error}`);
        return [];
      }
    },
    enabled: isAdmin,
  });

  // Query para buscar clientes
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/clients');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error(`Erro ao buscar clientes: ${error}`);
        return [];
      }
    },
  });

  // Formulário para adicionar venda
  const form = useForm<ProductSaleFormValues>({
    resolver: zodResolver(productSaleSchema),
    defaultValues: {
      productId: 0,
      barberId: isBarber && barber?.id ? barber.id : 0,
      clientName: '',
      clientId: null,
      date: new Date().toISOString().substring(0, 10),
      quantity: '1',
      unitPrice: '',
    },
  });

  // Efeito para atualizar o preço unitário quando o produto for selecionado
  const watchProductId = form.watch('productId');
  const selectedProduct = Array.isArray(products) 
    ? products.find(p => p.id === watchProductId)
    : null;

  if (selectedProduct && !form.getValues('unitPrice')) {
    form.setValue('unitPrice', selectedProduct.price);
  }

  // Efeito para atualizar o nome do cliente quando um cliente for selecionado
  const watchClientId = form.watch('clientId');
  const selectedClient = Array.isArray(clients) 
    ? clients.find(c => c.id === watchClientId)
    : null;

  if (selectedClient && !form.getValues('clientName')) {
    form.setValue('clientName', selectedClient.fullName);
  }

  // Mutação para criar venda
  const createSaleMutation = useMutation({
    mutationFn: (data: ProductSaleFormValues) => apiRequest('POST', '/api/product-sales', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-sales'] });
      queryClient.invalidateQueries({ queryKey: [`/api/product-sales/barber/${barber?.id}`] });
      setIsAddDialogOpen(false);
      form.reset({
        productId: 0,
        barberId: isBarber && barber?.id ? barber.id : 0,
        clientName: '',
        clientId: null,
        date: new Date().toISOString().substring(0, 10),
        quantity: '1',
        unitPrice: '',
      });
      toast({
        title: 'Venda registrada',
        description: 'Venda de produto registrada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao registrar venda: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutação para validar venda (admin apenas)
  const validateSaleMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/product-sales/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-sales'] });
      toast({
        title: 'Venda validada',
        description: 'Venda de produto foi validada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao validar venda: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutação para excluir venda
  const deleteSaleMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/product-sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-sales'] });
      queryClient.invalidateQueries({ queryKey: [`/api/product-sales/barber/${barber?.id}`] });
      toast({
        title: 'Venda excluída',
        description: 'Venda de produto foi excluída com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao excluir venda: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const onSubmitAddSale = (data: ProductSaleFormValues) => {
    createSaleMutation.mutate(data);
  };

  const handleValidateSale = (id: number) => {
    validateSaleMutation.mutate(id);
  };

  const handleDeleteSale = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      deleteSaleMutation.mutate(id);
    }
  };

  // Helper para calcular comissão
  const calculateCommission = (sale: ProductSale) => {
    const product = sale.product;
    if (!product.commission) return 0;
    
    const percentage = parseFloat(product.commission.percentage);
    const totalPrice = parseFloat(sale.unitPrice) * sale.quantity;
    return (totalPrice * percentage) / 100;
  };

  if (isLoadingSales || (isBarber && !barber)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 md:ml-64">
          <MobileNavigation />
          <main className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Vendas de Produtos</h1>
              {(isAdmin || isBarber) && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Registrar Venda
                </Button>
              )}
            </div>

            {sales && sales.length > 0 ? (
              <div className="space-y-6">
                {/* Resumo total (apenas para admin) */}
                {isAdmin && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo Geral</CardTitle>
                      <CardDescription>Resumo de todas as vendas de produtos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Vendas:</p>
                          <p className="text-2xl font-bold">{sales.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Total:</p>
                          <p className="text-2xl font-bold">
                            €{sales.reduce((acc, sale) => acc + (parseFloat(sale.unitPrice) * sale.quantity), 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Validadas:</p>
                          <p className="text-2xl font-bold">
                            {sales.filter(s => s.validatedByAdmin).length} / {sales.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Lista de vendas */}
                <div className="rounded-md border">
                  <div className="grid grid-cols-8 gap-2 p-4 font-medium bg-muted/50">
                    <div>Produto</div>
                    <div>Barbeiro</div>
                    <div>Cliente</div>
                    <div>Data</div>
                    <div>Quant.</div>
                    <div>Preço Unit.</div>
                    <div>Total</div>
                    <div>Ações</div>
                  </div>
                  
                  {sales.map((sale) => (
                    <div key={sale.id} className="grid grid-cols-8 gap-2 p-4 border-t items-center">
                      <div className="font-medium">{sale.product.name}</div>
                      <div>{sale.barber.user.fullName}</div>
                      <div>{sale.clientName}</div>
                      <div>{format(new Date(sale.date), 'dd/MM/yyyy', {locale: ptBR})}</div>
                      <div>{sale.quantity}</div>
                      <div>€{parseFloat(sale.unitPrice).toFixed(2)}</div>
                      <div>€{(parseFloat(sale.unitPrice) * sale.quantity).toFixed(2)}</div>
                      <div className="flex items-center gap-2">
                        {isAdmin && !sale.validatedByAdmin && (
                          <Button variant="outline" size="sm" onClick={() => handleValidateSale(sale.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {(isAdmin || (isBarber && !sale.validatedByAdmin)) && (
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteSale(sale.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                        {sale.validatedByAdmin && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Validada
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {isBarber && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Comissões</CardTitle>
                      <CardDescription>Suas comissões de vendas de produtos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total em Comissões:</p>
                          <p className="text-2xl font-bold">
                            €{sales
                              .filter(s => s.validatedByAdmin)
                              .reduce((acc, sale) => acc + calculateCommission(sale), 0)
                              .toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="rounded-md border">
                          <div className="grid grid-cols-4 gap-2 p-4 font-medium bg-muted/50">
                            <div>Produto</div>
                            <div>Valor da Venda</div>
                            <div>Comissão (%)</div>
                            <div>Valor da Comissão</div>
                          </div>
                          
                          {sales.filter(s => s.validatedByAdmin && s.product.commission).map((sale) => (
                            <div key={sale.id} className="grid grid-cols-4 gap-2 p-4 border-t">
                              <div>{sale.product.name}</div>
                              <div>€{(parseFloat(sale.unitPrice) * sale.quantity).toFixed(2)}</div>
                              <div>{sale.product.commission ? `${sale.product.commission.percentage}%` : 'N/A'}</div>
                              <div>€{calculateCommission(sale).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma venda registrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Não há vendas de produtos registradas no sistema.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Registrar Venda
                </Button>
              </div>
            )}

            {/* Diálogo para adicionar venda */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Venda de Produto</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes da venda abaixo.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitAddSale)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produto</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingProducts ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                products?.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - €{parseFloat(product.price).toFixed(2)}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {isAdmin && (
                      <FormField
                        control={form.control}
                        name="barberId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barbeiro</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um barbeiro" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingBarbers ? (
                                  <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  barbers?.map((barber) => (
                                    <SelectItem key={barber.id} value={barber.id.toString()}>
                                      {barber.user.fullName}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente (opcional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                            defaultValue={field.value?.toString() || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente (opcional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Sem cliente registrado</SelectItem>
                              {Array.isArray(clients) ? clients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.fullName}
                                </SelectItem>
                              )) : null}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selecione um cliente do sistema ou deixe em branco e preencha o nome abaixo
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Unitário (€)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={createSaleMutation.isPending}>
                        {createSaleMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Registrar Venda
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </div>
  );
}