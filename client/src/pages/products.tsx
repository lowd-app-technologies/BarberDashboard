import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Trash, Edit, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Schema para formulário de produto
const productSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres' }),
  description: z.string().optional(),
  price: z.string().min(1, { message: 'Preço é obrigatório' }),
  costPrice: z.string().min(1, { message: 'Preço de custo é obrigatório' }),
  category: z.enum(['shampoo', 'conditioner', 'styling', 'beard', 'skincare', 'equipment', 'other']),
  sku: z.string().min(2, { message: 'SKU deve ter no mínimo 2 caracteres' }),
  stockQuantity: z.string().transform(val => parseInt(val)),
  active: z.boolean().default(true),
  imageUrl: z.string().optional(),
});

// Schema para formulário de comissão de produto
const productCommissionSchema = z.object({
  barberId: z.number(),
  productId: z.number(),
  percentage: z.string().min(1, { message: 'Percentual é obrigatório' }),
});

// Tipo para o formulário de produto
type ProductFormValues = z.infer<typeof productSchema>;

// Tipo para o formulário de comissão
type ProductCommissionFormValues = z.infer<typeof productCommissionSchema>;

// Tipo para produto da API
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  costPrice: string;
  category: 'shampoo' | 'conditioner' | 'styling' | 'beard' | 'skincare' | 'equipment' | 'other';
  sku: string;
  stockQuantity: number;
  active: boolean;
  imageUrl: string | null;
  createdAt: string;
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

// Componente principal
export default function Products() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  // Query para buscar produtos
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest<Product[]>('GET', '/api/products'),
    select: (data) => data.sort((a, b) => a.name.localeCompare(b.name)),
  });

  // Query para buscar barbeiros (apenas admin)
  const { data: barbers, isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['/api/barbers'],
    queryFn: () => apiRequest<BarberWithUser[]>('GET', '/api/barbers'),
    enabled: isAdmin,
  });

  // Formulário para adicionar/editar produto
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      costPrice: '',
      category: 'other',
      sku: '',
      stockQuantity: '0',
      active: true,
      imageUrl: '',
    },
  });

  // Formulário para adicionar comissão
  const commissionForm = useForm<ProductCommissionFormValues>({
    resolver: zodResolver(productCommissionSchema),
    defaultValues: {
      barberId: 0,
      productId: 0,
      percentage: '',
    },
  });

  // Mutação para criar produto
  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormValues) => apiRequest('POST', '/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: 'Produto criado',
        description: 'Produto foi adicionado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao criar produto: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutação para atualizar produto
  const updateProductMutation = useMutation({
    mutationFn: (data: { id: number; product: ProductFormValues }) => 
      apiRequest('PUT', `/api/products/${data.id}`, data.product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Produto atualizado',
        description: 'Produto foi atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao atualizar produto: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutação para excluir produto
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Produto excluído',
        description: 'Produto foi excluído com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao excluir produto: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutação para criar comissão
  const createCommissionMutation = useMutation({
    mutationFn: (data: ProductCommissionFormValues) => 
      apiRequest('POST', '/api/product-commissions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-commissions'] });
      setIsCommissionDialogOpen(false);
      commissionForm.reset();
      toast({
        title: 'Comissão adicionada',
        description: 'Comissão foi adicionada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Erro ao adicionar comissão: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const onSubmitAddProduct = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };

  const onSubmitEditProduct = (data: ProductFormValues) => {
    if (selectedProduct) {
      updateProductMutation.mutate({ id: selectedProduct.id, product: data });
    }
  };

  const onSubmitAddCommission = (data: ProductCommissionFormValues) => {
    createCommissionMutation.mutate(data);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    form.reset({
      name: product.name,
      description: product.description || '',
      price: product.price,
      costPrice: product.costPrice,
      category: product.category,
      sku: product.sku,
      stockQuantity: product.stockQuantity.toString(),
      active: product.active,
      imageUrl: product.imageUrl || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleAddCommission = (product: Product) => {
    setSelectedProduct(product);
    commissionForm.reset({
      barberId: 0,
      productId: product.id,
      percentage: '',
    });
    setIsCommissionDialogOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProductMutation.mutate(id);
    }
  };

  // Helper para traduzir categoria
  const translateCategory = (category: string) => {
    const categories: Record<string, string> = {
      'shampoo': 'Shampoo',
      'conditioner': 'Condicionador',
      'styling': 'Modelador',
      'beard': 'Barba',
      'skincare': 'Cuidados com a Pele',
      'equipment': 'Equipamento',
      'other': 'Outro'
    };
    return categories[category] || category;
  };

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Produtos</h1>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className={!product.active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{product.name}</CardTitle>
                <Badge variant={product.active ? 'default' : 'secondary'}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <CardDescription>{translateCategory(product.category)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Descrição:</p>
                <p>{product.description || 'Sem descrição'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Preço:</p>
                  <p className="font-medium">€{parseFloat(product.price).toFixed(2)}</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-sm text-muted-foreground">Custo:</p>
                    <p className="font-medium">€{parseFloat(product.costPrice).toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">SKU:</p>
                  <p className="font-mono text-sm">{product.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque:</p>
                  <p className="font-medium">{product.stockQuantity}</p>
                </div>
              </div>
            </CardContent>
            {isAdmin && (
              <CardFooter className="flex justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddCommission(product)}>
                  <Check className="mr-2 h-4 w-4" /> Comissão
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                  <Trash className="mr-2 h-4 w-4" /> Excluir
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>

      {/* Diálogo para adicionar produto */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do produto abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAddProduct)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (€)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo (€)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="shampoo">Shampoo</SelectItem>
                          <SelectItem value="conditioner">Condicionador</SelectItem>
                          <SelectItem value="styling">Modelador</SelectItem>
                          <SelectItem value="beard">Barba</SelectItem>
                          <SelectItem value="skincare">Cuidados com a Pele</SelectItem>
                          <SelectItem value="equipment">Equipamento</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade em Estoque</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>
                          Produto disponível para venda
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="accent-primary h-5 w-5"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      URL da imagem do produto (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar produto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize os detalhes do produto abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEditProduct)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (€)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo (€)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="shampoo">Shampoo</SelectItem>
                          <SelectItem value="conditioner">Condicionador</SelectItem>
                          <SelectItem value="styling">Modelador</SelectItem>
                          <SelectItem value="beard">Barba</SelectItem>
                          <SelectItem value="skincare">Cuidados com a Pele</SelectItem>
                          <SelectItem value="equipment">Equipamento</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade em Estoque</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>
                          Produto disponível para venda
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="accent-primary h-5 w-5"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      URL da imagem do produto (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Atualizar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para adicionar comissão */}
      <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comissão</DialogTitle>
            <DialogDescription>
              Defina a comissão para o barbeiro vender este produto.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...commissionForm}>
            <form onSubmit={commissionForm.handleSubmit(onSubmitAddCommission)} className="space-y-4">
              <FormField
                control={commissionForm.control}
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
              
              <FormField
                control={commissionForm.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentual de Comissão (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" max="100" />
                    </FormControl>
                    <FormDescription>
                      Informe o percentual que o barbeiro receberá por venda
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCommissionDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCommissionMutation.isPending}
                >
                  {createCommissionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}