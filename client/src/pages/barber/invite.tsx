import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Link2, UserPlus, Mail, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Schema para o formulário de convite
const inviteSchema = z.object({
  email: z.string()
    .email("Por favor, informe um e-mail válido")
    .min(1, "O e-mail é obrigatório"),
  name: z.string().min(1, "O nome é obrigatório"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteBarber() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inviteSent, setInviteSent] = useState<boolean>(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

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

  const onSubmit = async (data: InviteFormValues) => {
    setIsLoading(true);
    try {
      // Gera um token único para o convite com base no email
      const response = await apiRequest("POST", "/api/invites/generate", { 
        email: data.email,
        name: data.name 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao gerar convite");
      }
      
      const responseData = await response.json();
      
      // Cria o link de convite com o token
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/barber/register?token=${responseData.token}`;
      setInviteLink(inviteUrl);
      setInviteSent(true);

      toast({
        title: "Convite enviado com sucesso",
        description: "Um link de convite foi gerado e pode ser compartilhado com o barbeiro"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar convite",
        description: error.message || "Ocorreu um erro ao tentar criar o convite",
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

  const resetForm = () => {
    form.reset();
    setInviteLink("");
    setInviteSent(false);
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Convidar Barbeiro</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerar Convite para Barbeiro</CardTitle>
            <CardDescription>
              Envie um convite para um novo barbeiro se juntar à sua barbearia.
              Informe o e-mail e nome do barbeiro para gerar um link de registro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!inviteSent ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do Barbeiro</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="email@exemplo.com" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Informe o e-mail do barbeiro que deseja convidar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Barbeiro</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormDescription>
                          O nome será usado para personalizar o convite
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Gerando convite...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Convidar Barbeiro
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                  <CheckCircle className="h-10 w-10 text-green-500 mr-4" />
                  <div>
                    <h3 className="font-medium">Convite gerado com sucesso!</h3>
                    <p className="text-sm text-muted-foreground">
                      Compartilhe o link abaixo com o barbeiro convidado
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
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
                    Este link é válido por 48 horas e pode ser usado apenas uma vez.
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={resetForm}
                >
                  Convidar Outro Barbeiro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}