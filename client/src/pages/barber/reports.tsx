import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/layout/Layout";
import { Loader2 } from "lucide-react";

interface ServiceReportItem {
  name: string;
  count: number;
  revenue: number;
}

interface ProductReportItem {
  name: string;
  count: number;
  revenue: number;
}

interface EarningsReportItem {
  name: string;
  earnings: number;
}

interface ReportData {
  serviceId: number;
  serviceName: string;
  count: number;
  revenue: number;
  month: number;
  year: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function BarberReports() {
  const [timeRange, setTimeRange] = useState("month");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['/api/barber/reports/services', timeRange, year, month],
    queryFn: () => fetch(`/api/barber/reports/services?timeRange=${timeRange}&year=${year}&month=${month}`).then(res => res.json()),
    enabled: true,
  });

  const { data: earningsData, isLoading: isEarningsLoading } = useQuery({
    queryKey: ['/api/barber/reports/earnings', timeRange, year, month],
    queryFn: () => fetch(`/api/barber/reports/earnings?timeRange=${timeRange}&year=${year}&month=${month}`).then(res => res.json()),
    enabled: true,
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['/api/barber/reports/products', timeRange, year, month],
    queryFn: () => fetch(`/api/barber/reports/products?timeRange=${timeRange}&year=${year}&month=${month}`).then(res => res.json()),
    enabled: true,
  });

  // Dados de exemplo para desenvolvimento
  const mockServicesData: ServiceReportItem[] = [
    { name: 'Corte de Cabelo', count: 14, revenue: 350 },
    { name: 'Barba', count: 8, revenue: 160 },
    { name: 'Corte + Barba', count: 12, revenue: 480 },
    { name: 'Tratamento Capilar', count: 3, revenue: 195 },
    { name: 'Coloração', count: 5, revenue: 375 },
  ];

  const mockEarningsData: EarningsReportItem[] = [
    { name: 'Janeiro', earnings: 1200 },
    { name: 'Fevereiro', earnings: 1500 },
    { name: 'Março', earnings: 1300 },
    { name: 'Abril', earnings: 1800 },
    { name: 'Maio', earnings: 2000 },
    { name: 'Junho', earnings: 1700 },
  ];

  const mockProductsData: ProductReportItem[] = [
    { name: 'Pomada', count: 7, revenue: 210 },
    { name: 'Shampoo', count: 5, revenue: 175 },
    { name: 'Óleo para Barba', count: 6, revenue: 180 },
    { name: 'Pós-Barba', count: 4, revenue: 120 },
  ];

  // Usar dados do servidor quando disponíveis, caso contrário usar mock
  const displayServicesData: ServiceReportItem[] = servicesData as ServiceReportItem[] || mockServicesData;
  const displayEarningsData: EarningsReportItem[] = earningsData as EarningsReportItem[] || mockEarningsData;
  const displayProductsData: ProductReportItem[] = productsData as ProductReportItem[] || mockProductsData;

  const totalServices = displayServicesData.reduce((acc: number, curr: ServiceReportItem) => acc + curr.count, 0);
  const totalRevenue = displayServicesData.reduce((acc: number, curr: ServiceReportItem) => acc + curr.revenue, 0);
  const totalProductsSold = displayProductsData.reduce((acc: number, curr: ProductReportItem) => acc + curr.count, 0);
  const totalProductsRevenue = displayProductsData.reduce((acc: number, curr: ProductReportItem) => acc + curr.revenue, 0);

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Relatórios e Análises</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
            <Select defaultValue={timeRange} onValueChange={(value) => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="all">Todo o Período</SelectItem>
              </SelectContent>
            </Select>
            
            {timeRange === "month" && (
              <Select defaultValue={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Select defaultValue={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalServices}</div>
              <p className="text-xs text-muted-foreground">Serviços realizados no período</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Receita total com serviços</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProductsSold}</div>
              <p className="text-xs text-muted-foreground">Unidades vendidas no período</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalProductsRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Receita total com produtos</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="earnings">Ganhos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="services">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Serviços por Quantidade</CardTitle>
                  <CardDescription>Número de serviços realizados por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={displayServicesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name="Quantidade" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Serviços por Receita</CardTitle>
                  <CardDescription>Receita gerada por tipo de serviço</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={displayServicesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {displayServicesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `R$ ${value}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos por Quantidade</CardTitle>
                  <CardDescription>Número de produtos vendidos por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  {isProductsLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={displayProductsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#00C49F" name="Quantidade" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Produtos por Receita</CardTitle>
                  <CardDescription>Receita gerada por tipo de produto</CardDescription>
                </CardHeader>
                <CardContent>
                  {isProductsLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={displayProductsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {displayProductsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `R$ ${value}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Ganhos ao Longo do Tempo</CardTitle>
                <CardDescription>Evolução dos seus ganhos no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                {isEarningsLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={displayEarningsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R$ ${value}`} />
                      <Legend />
                      <Bar dataKey="earnings" fill="#FF8042" name="Ganhos (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}