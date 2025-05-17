import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "../hooks/use-theme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MoonIcon, SunIcon, Globe, Bell, Lock, User, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { theme, setTheme, toggleTheme, isSaving: isSavingTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [language, setLanguage] = useState("pt");
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);

  // Carregar preferências do usuário (tema e idioma) do servidor
  useEffect(() => {
    // Quando existe um usuário logado, carregamos as preferências dele
    if (user?.id) {
      const loadUserPreferences = async () => {
        try {
          const response = await fetch('/api/user/preferences', {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.preferences) {
              // Se o usuário tem preferência de tema definida, aplicá-la
              if (data.preferences.theme) {
                setTheme(data.preferences.theme);
              }
              
              // Aplicar idioma se disponível
              if (data.preferences.language) {
                setLanguage(data.preferences.language);
              }
              
              // Podemos também carregar outras preferências no futuro
            }
          }
        } catch (error) {
          console.error("Erro ao carregar preferências:", error);
        }
      };
      
      loadUserPreferences();
    }
  }, [user?.id, setTheme]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/user/profile", data),
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas configurações foram salvas com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar suas configurações.",
        variant: "destructive"
      });
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/user/preferences", data),
    onSuccess: () => {
      toast({
        title: "Preferências atualizadas",
        description: "Suas preferências foram salvas com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar suas preferências.",
        variant: "destructive"
      });
    }
  });

  const saveSettings = async () => {
    try {
      // Salvar notificações e preferências para todos os usuários
      await updateProfileMutation.mutateAsync({
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          sms: smsNotifications,
          appointmentReminders: appointmentReminders,
          marketing: marketingEmails
        }
      });
      
      // Salvar preferências de tema e idioma
      await updatePreferencesMutation.mutateAsync({
        language,
        theme
      });
      
      // Se o usuário for um barbeiro, atualizar o perfil completo usando a nova rota
      if (user?.role === 'barber') {
        try {
          // Mostrar indicador de carregamento
          toast({
            title: "Atualizando perfil...",
            description: "Salvando suas informações de perfil",
          });
          
          // Preparar os dados do perfil do barbeiro
          const profileData: any = {
            fullName: user.fullName || "",
            username: user.username || "",
            email: user.email || "",
            phone: user.phone || "",
            nif: user.barber?.nif || "",
            iban: user.barber?.iban || "",
            paymentPeriod: user.barber?.paymentPeriod || "monthly"
          };
          
          // Adicionar a nova imagem de perfil se existir
          if (newProfileImage) {
            profileData.profileImage = newProfileImage;
          }
          
          // Enviar para o servidor usando a nova rota de perfil completo
          const response = await fetch('/api/barber/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            toast({
              title: "Perfil atualizado",
              description: "Suas informações de perfil foram atualizadas com sucesso.",
              variant: "default"
            });
            
            // Limpar a imagem temporária
            setNewProfileImage(null);
            
            // Forçar um refresh da página para garantir que os dados apareçam corretamente
            toast({
              title: "Recarregando...",
              description: "Atualizando a interface com suas novas informações",
            });
            
            // Aguardar um momento para o usuário ver a mensagem de sucesso
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            const error = await response.json();
            throw new Error(error.message || "Erro ao atualizar perfil");
          }
        } catch (error: any) {
          console.error("Erro ao atualizar perfil do barbeiro:", error);
          toast({
            title: "Erro no perfil",
            description: error.message || "Não foi possível atualizar seu perfil.",
            variant: "destructive"
          });
        }
      } else {
        // Para usuários não-barbeiros, apenas exibir confirmação
        toast({
          title: "Configurações salvas",
          description: "Todas as suas configurações foram aplicadas com sucesso.",
          variant: "default"
        });
      }
    } catch (error) {
      // Se ocorrer erro em qualquer uma das operações, já será capturado aqui
      console.error("Erro ao salvar configurações:", error);
      
      // O feedback de erro já é mostrado pelos próprios mutations nas funções onError
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
          </div>
          <Button 
            onClick={saveSettings} 
            disabled={updateProfileMutation.isPending || updatePreferencesMutation.isPending} 
            className="mt-4 md:mt-0"
          >
            {updateProfileMutation.isPending || updatePreferencesMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : "Salvar Alterações"}
          </Button>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <Card className="mb-8">
              <CardHeader className="px-6 py-5">
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Personalize a aparência e o idioma do aplicativo</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="theme-toggle" className="font-medium">Tema</Label>
                      <span className="text-sm text-muted-foreground">
                        Escolha entre o tema claro e escuro
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <SunIcon className={`h-4 w-4 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="relative">
                        <Switch 
                          id="theme-toggle"
                          checked={theme === 'dark'}
                          onCheckedChange={() => toggleTheme()}
                        />
                        {isSavingTheme && (
                          <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <MoonIcon className={`h-4 w-4 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <select 
                      id="language"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="pt">Português</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="mb-8">
              <CardHeader className="px-6 py-5">
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Configure como deseja receber as notificações</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">Receba updates importantes por email</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">Notificações instantâneas no seu dispositivo</p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={pushNotifications} 
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">Notificações por SMS</Label>
                      <p className="text-sm text-muted-foreground">Receba notificações por mensagem de texto</p>
                    </div>
                    <Switch 
                      id="sms-notifications" 
                      checked={smsNotifications} 
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="appointment-reminders">Lembretes de Agendamento</Label>
                      <p className="text-sm text-muted-foreground">Lembretes para seus próximos agendamentos</p>
                    </div>
                    <Switch 
                      id="appointment-reminders" 
                      checked={appointmentReminders} 
                      onCheckedChange={setAppointmentReminders}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing-emails">Emails de Marketing</Label>
                      <p className="text-sm text-muted-foreground">Promoções, novidades e ofertas especiais</p>
                    </div>
                    <Switch 
                      id="marketing-emails" 
                      checked={marketingEmails} 
                      onCheckedChange={setMarketingEmails}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="mb-8">
              <CardHeader className="px-6 py-5">
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Gerencie suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-6">
                {user?.role === 'barber' && (
                  <div className="mb-6">
                    <Label htmlFor="profile-image" className="block mb-2">Foto de Perfil</Label>
                    <div className="flex items-start space-x-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border">
                        {user?.barber?.profileImage ? (
                          <img 
                            src={user.barber.profileImage} 
                            alt="Foto de perfil" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <User className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="space-y-4">
                          <Input 
                            id="profile-image" 
                            type="file" 
                            accept="image/*"
                            className="max-w-xs"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Verificar tamanho do arquivo (máximo 2MB)
                                if (file.size > 2 * 1024 * 1024) {
                                  toast({
                                    title: "Arquivo muito grande",
                                    description: "O tamanho máximo permitido é 2MB.",
                                    variant: "destructive"
                                  });
                                  return;
                                }

                                // Converter a imagem para uma URL base64
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    // Armazenar temporariamente a imagem no estado
                                    setNewProfileImage(event.target.result as string);
                                    
                                    // Mostrar mensagem de preview
                                    toast({
                                      title: "Imagem selecionada",
                                      description: "Clique em Salvar Alterações para atualizar sua foto de perfil.",
                                      variant: "default"
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          
                          {newProfileImage && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                              <div className="relative w-24 h-24 rounded-full overflow-hidden border border-primary">
                                <img 
                                  src={newProfileImage} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              
                              <Button 
                                variant="outline"
                                className="mt-3"
                                onClick={() => setNewProfileImage(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Adicione uma foto de perfil que será mostrada aos clientes durante o agendamento.
                          Formatos aceitos: JPG, PNG. Máximo 2MB.
                        </p>
                      </div>
                    </div>
                    <Separator className="my-6" />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Nome Completo</Label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input id="full-name" defaultValue={user?.fullName || ""} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input id="username" defaultValue={user?.username || ""} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" defaultValue={user?.email || ""} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        placeholder="+351 000000000" 
                        defaultValue={user?.phone || ""}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="mb-8">
              <CardHeader className="px-6 py-5">
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Gerencie suas configurações de segurança</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Input id="current-password" type="password" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Input id="new-password" type="password" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  
                  <Button className="mt-4">Alterar Senha</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}