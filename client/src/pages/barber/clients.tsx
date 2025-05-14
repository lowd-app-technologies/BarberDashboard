import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  User,
  Search,
  Filter,
  Heart,
  CalendarClock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function BarberClients() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Buscar clientes
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['/api/barber/clients'],
  });

  // Buscar clientes favoritos
  const { data: favoriteClients = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['/api/barber/clients/favorites'],
  });

  // Filtragem de clientes pelo termo de busca
  const filteredClients = Array.isArray(clients) 
    ? clients.filter(client => 
        client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      )
    : [];

  // Filtragem de clientes favoritos pelo termo de busca
  const filteredFavorites = Array.isArray(favoriteClients) 
    ? favoriteClients.filter(client => 
        client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      )
    : [];

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gerencie suas relações com clientes</p>
          </div>
        </div>

        {/* Pesquisa */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full mb-6 grid grid-cols-2">
            <TabsTrigger value="all">Todos os Clientes</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>
                  Todos os clientes que você atendeu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClients ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando clientes...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="py-8 text-center">
                    <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum cliente encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Tente outros termos de busca" : "Você ainda não atendeu nenhum cliente"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Último Atendimento</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="font-medium">{client.fullName}</div>
                          </TableCell>
                          <TableCell>
                            {client.phone || "Não informado"}
                          </TableCell>
                          <TableCell>
                            {client.lastVisit ? formatDate(client.lastVisit) : "Nunca atendido"}
                          </TableCell>
                          <TableCell>
                            {client.isFavorite ? (
                              <Badge className="bg-[hsl(var(--success))]">Favorito</Badge>
                            ) : (
                              <Badge variant="outline">Regular</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Favoritos</CardTitle>
                <CardDescription>
                  Clientes que você marcou como favoritos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFavorites ? (
                  <div className="py-8 text-center text-muted-foreground">Carregando favoritos...</div>
                ) : filteredFavorites.length === 0 ? (
                  <div className="py-8 text-center">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum cliente favorito</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Nenhum favorito corresponde à sua busca" : "Marque clientes como favoritos para vê-los aqui"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFavorites.map((client) => (
                      <Card key={client.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-semibold">{client.fullName}</h4>
                              <div className="text-sm text-muted-foreground">{client.phone || "Sem telefone"}</div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <CalendarClock className="h-3 w-3 mr-1" />
                                <span>
                                  {client.lastVisit ? 
                                    `Último atendimento: ${formatDate(client.lastVisit)}` : 
                                    "Nunca atendido"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}