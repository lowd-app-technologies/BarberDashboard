import { useState, useEffect } from 'react';
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
  productIds: z.array(z.number()).min(1, { message: 'Selecione pelo menos um produto' }),
  barberId: z.number(),
  clientName: z.string().min(2, { message: 'Nome do cliente é obrigatório' }),
  clientId: z.number().nullable().optional(),
  date: z.string(),
  totalAmount: z.string().min(1, { message: 'Total é obrigatório' }),
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
  const pageTitle = "Vendas de Produtos";

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
  interface ProductSelection {
    productId: number;
    quantity: number;
  }
  
  const [productSelections, setProductSelections] = useState<ProductSelection[]>([]);
  const [totalAmount, setTotalAmount] = useState<string>("0.00");
  
  const form = useForm<ProductSaleFormValues>({
    resolver: zodResolver(productSaleSchema),
    defaultValues: {
      productIds: [],
      barberId: isBarber && barber?.id ? barber.id : 0,
      clientName: '',
      clientId: null,
      date: new Date().toISOString().substring(0, 10),
      totalAmount: '0.00',
    },
  });

    // Efeito para atualizar o nome do cliente quando um cliente for selecionado
  const watchClientId = form.watch('clientId');
  const selectedClient = Array.isArray(clients) 
    ? clients.find(c => c.id === Number(watchClientId))
    : null;
  
  // Funções para gerenciar os produtos selecionados
  const addProductSelection = (productId: number) => {
    // Previne adicionar o mesmo produto mais de uma vez
    if (productSelections.some(item => item.productId === productId)) {
      return;
    }
    
    const newSelections = [...productSelections, { productId, quantity: 1 }];
    setProductSelections(newSelections);
    updateProductIds(newSelections);
    calculateTotal(newSelections);
  };
  
  const removeProductSelection = (index: number) => {
    const newSelections = [...productSelections];
    newSelections.splice(index, 1);
    setProductSelections(newSelections);
    updateProductIds(newSelections);
    calculateTotal(newSelections);
  };
  
  const updateProductQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    const newSelections = [...productSelections];
    newSelections[index].quantity = quantity;
    setProductSelections(newSelections);
    calculateTotal(newSelections);
  };
  
  const updateProductIds = (selections: ProductSelection[]) => {
    const ids = selections.map(item => item.productId);
    form.setValue('productIds', ids);
  };
  
  const calculateTotal = (selections: ProductSelection[] = productSelections) => {
    if (!products) return;
    
    const total = selections.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return sum + (parseFloat(product.price) * item.quantity);
      }
      return sum;
    }, 0);
    
    const formattedTotal = total.toFixed(2);
    setTotalAmount(formattedTotal);
    form.setValue('totalAmount', formattedTotal);
  };
  
  // Usando useEffect para atualizar os valores do formulário
  useEffect(() => {
    if (selectedClient && !form.getValues('clientName')) {
      form.setValue('clientName', selectedClient.fullName);
    }
  }, [selectedClient, form]);

  // Mutação para criar venda
  const createSaleMutation = useMutation({
    mutationFn: (data: ProductSaleFormValues) => apiRequest('POST', '/api/product-sales', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-sales'] });
      queryClient.invalidateQueries({ queryKey: [`/api/product-sales/barber/${barber?.id}`] });
      setIsAddDialogOpen(false);
      setProductSelections([]);
      setTotalAmount("0.00");
      form.reset({
        productIds: [],
        barberId: isBarber && barber?.id ? barber.id : 0,
        clientName: '',
        clientId: null,
        date: new Date().toISOString().substring(0, 10),
        totalAmount: '0.00',
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
    // Verifica se há produtos selecionados
    if (productSelections.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um produto',
        variant: 'destructive',
      });
      return;
    }
    
    // Se clientId for "none", defina como null
    if (data.clientId && data.clientId.toString() === "none") {
      data.clientId = null;
    }
    
    // Adiciona os IDs dos produtos selecionados aos dados do formulário
    const finalData = {
      ...data,
      productIds: productSelections.map(item => item.productId),
      totalAmount: totalAmount
    };
    
    createSaleMutation.mutate(finalData);
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
      <Layout pageTitle={pageTitle}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle={pageTitle}>
      <div className="flex justify-between items-center mb-6">
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
            <Dialog 
              open={isAddDialogOpen} 
              onOpenChange={(open) => {
                if (!open) {
                  // Limpa as seleções quando o diálogo é fechado
                  setProductSelections([]);
                  setTotalAmount("0.00");
                  form.reset({
                    productIds: [],
                    barberId: isBarber && barber?.id ? barber.id : 0,
                    clientName: '',
                    clientId: null,
                    date: new Date().toISOString().substring(0, 10),
                    totalAmount: '0.00',
                  });
                }
                setIsAddDialogOpen(open);
              }}
            >
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-xl">Registrar Venda de Produto</DialogTitle>
                  <DialogDescription>
                    Adicione produtos à venda e preencha os detalhes abaixo.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitAddSale)} className="space-y-5 overflow-y-auto pr-1" style={{maxHeight: "calc(80vh - 200px)"}}>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          Adicionar Produto
                          <span className="text-xs font-normal text-muted-foreground">
                            (Selecione os produtos da venda)
                          </span>
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Select 
                            onValueChange={(value) => {
                              const productId = parseInt(value);
                              addProductSelection(productId);
                            }}
                            value=""
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingProducts ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                products?.filter(product => 
                                  !productSelections.some(selection => selection.productId === product.id)
                                ).map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - R$ {parseFloat(product.price).toFixed(2)}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium">Produtos Selecionados</Label>
                        <div className="mt-2 border rounded-md p-2 bg-card min-h-[100px] max-h-[200px] overflow-y-auto">
                          {productSelections.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                              Nenhum produto selecionado ainda
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {productSelections.map((item, index) => {
                                const product = products?.find(p => p.id === item.productId);
                                return (
                                  <div key={index} className="flex items-center justify-between p-2 rounded-md bg-accent">
                                    <div className="flex-1">
                                      <div className="font-medium">{product?.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        Preço unitário: R$ {parseFloat(product?.price || "0").toFixed(2)}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2 w-24">
                                        <Label htmlFor={`qty-${index}`} className="text-xs whitespace-nowrap">Qtd:</Label>
                                        <Input 
                                          id={`qty-${index}`}
                                          type="number" 
                                          min="1" 
                                          value={item.quantity} 
                                          onChange={(e) => updateProductQuantity(index, parseInt(e.target.value))}
                                          className="h-8 w-16"
                                        />
                                      </div>
                                      <div className="text-sm font-medium w-20 text-right">
                                        R$ {(parseFloat(product?.price || "0") * item.quantity).toFixed(2)}
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-full hover:bg-destructive/10" 
                                        onClick={() => removeProductSelection(index)}
                                        type="button"
                                      >
                                        <Trash className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {productSelections.length > 0 && (
                          <div className="flex justify-end mt-2 font-medium">
                            Total: R$ {totalAmount}
                          </div>
                        )}
                      </div>
                    </div>
                    
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
                              <SelectItem value="none">Sem cliente registrado</SelectItem>
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
                    
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              value={`R$ ${totalAmount}`}
                              readOnly 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
    </Layout>
  );
}