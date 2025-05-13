import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Scissors } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha")
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function BarberRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"loading" | "valid" | "invalid" | "expired">("loading");
  const [barberId, setBarberId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [inviteError, setInviteError] = useState<string>("");
  
  // Extract token from URL (nova implementação sem o ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setInviteStatus("invalid");
      setInviteError("Link de convite inválido. Verifique se você está usando o link correto.");
      return;
    }
    
    setToken(tokenParam);
    
    // Validate the token
    validateToken(tokenParam);
  }, []);
  
  const validateToken = async (token: string) => {
    try {
      const response = await apiRequest("GET", `/api/invites/validate/${token}`);
      const data = await response.json();
      
      if (data.valid) {
        setInviteStatus("valid");
        // Atualizar o barberId com o valor recebido do servidor
        if (data.barberId) {
          setBarberId(data.barberId);
        }
        
        // Pré-preencher o campo de email se estiver disponível
        if (data.email) {
          form.setValue("email", data.email);
        }
      } else {
        setInviteStatus("invalid");
        setInviteError(data.message || "O link de convite é inválido.");
      }
    } catch (error) {
      setInviteStatus("invalid");
      setInviteError("Erro ao validar o convite. Tente novamente mais tarde.");
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/invites/use", {
        token,
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        password: values.password
      });
      
      if (response.ok) {
        toast({
          title: "Registro concluído com sucesso!",
          description: "Você foi registrado como barbeiro. Agora você pode fazer login."
        });

        // Redirect to login page after successful registration
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      } else {
        const data = await response.json();
        toast({
          title: "Erro no registro",
          description: data.message || "Ocorreu um erro durante o registro.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no registro",
        description: "Ocorreu um erro durante o registro. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (inviteStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Scissors className="h-12 w-12 mx-auto mb-4" />
            <CardTitle>Verificando Convite</CardTitle>
            <CardDescription>Verificando a validade do seu convite...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteStatus === "invalid" || inviteStatus === "expired") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Scissors className="h-12 w-12 mx-auto mb-4" />
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>O link de convite não é válido.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => setLocation("/login")}>
              Ir para Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Scissors className="h-12 w-12 mx-auto mb-4" />
          <CardTitle>Registrar-se como Barbeiro</CardTitle>
          <CardDescription>Complete seu registro para se juntar à equipe</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Convite Válido</AlertTitle>
            <AlertDescription>
              Você foi convidado para se juntar como barbeiro.
              Complete seu registro abaixo.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="nome.sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome Completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu.email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => setLocation("/login")}>
            Já tem uma conta? Faça login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}