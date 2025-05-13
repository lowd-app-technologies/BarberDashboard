import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Link2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function InviteBarber() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [barberId, setBarberId] = useState<string>("");

  // Verifica se o usuário atual é um administrador
  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </Layout>
    );
  }

  const generateInviteLink = async () => {
    if (!barberId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe um ID para o barbeiro",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Gera um token único para o convite
      const response = await apiRequest("POST", "/api/invites/generate", { barberId });
      const data = await response.json();
      
      // Cria o link de convite com o token
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/barber/register?token=${data.token}&id=${barberId}`;
      setInviteLink(inviteUrl);

      toast({
        title: "Link gerado com sucesso",
        description: "O link de convite foi gerado e está pronto para ser compartilhado"
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível gerar o link de convite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência"
    });
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Convidar Barbeiro</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerar Link de Convite</CardTitle>
            <CardDescription>
              Crie um link exclusivo para convidar um novo barbeiro para sua barbearia.
              Este link permitirá que o barbeiro se registre com acesso limitado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ID do Barbeiro</label>
                <div className="flex gap-2">
                  <Input 
                    value={barberId}
                    onChange={(e) => setBarberId(e.target.value)}
                    placeholder="Informe um ID único para o barbeiro"
                  />
                  <Button 
                    onClick={generateInviteLink}
                    disabled={isLoading || !barberId.trim()}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Gerar Link
                  </Button>
                </div>
              </div>
              
              {inviteLink && (
                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium">Link de Convite</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-md break-all">
                      <div className="flex items-center">
                        <Link2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{inviteLink}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Compartilhe este link com o barbeiro. O link é válido por 48 horas.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}