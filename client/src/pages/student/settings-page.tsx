import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { SaveIcon, KeyIcon, UserIcon, BellIcon, MoonIcon, SunIcon, MonitorIcon, GlobeIcon, AlertTriangleIcon, SmartphoneIcon } from "lucide-react";

// Definição da interface para as configurações do usuário
interface UserSettings {
  id: number;
  userId: number;
  theme: "light" | "dark" | "system";
  language: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  timezone: string;
  dateFormat?: string;
  timeFormat?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar configurações do usuário
  const { data: settings, isLoading, isError } = useQuery<UserSettings>({
    queryKey: ['/api/student/settings'],
  });

  // Definir o schema de validação
  const settingsSchema = z.object({
    theme: z.enum(["light", "dark", "system"]),
    language: z.string().min(1, "Selecione um idioma"),
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    timezone: z.string().min(1, "Selecione um fuso horário"),
    dateFormat: z.string().optional(),
    timeFormat: z.string().optional(),
    twoFactorEnabled: z.boolean().default(false)
  });

  // Inicializar o formulário com valores padrão
  const form = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: "system",
      language: "pt-BR",
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      timezone: "America/Sao_Paulo",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "HH:mm",
      twoFactorEnabled: false
    }
  });
  
  // Definir o tipo para os dados do formulário
  type FormValues = z.infer<typeof settingsSchema>;

  // Atualizar o formulário quando os dados forem carregados
  const resetForm = () => {
    if (settings) {
      form.reset({
        theme: settings.theme || "system",
        language: settings.language || "pt-BR",
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        pushNotifications: settings.pushNotifications,
        timezone: settings.timezone || "America/Sao_Paulo",
        dateFormat: settings.dateFormat || "DD/MM/YYYY",
        timeFormat: settings.timeFormat || "HH:mm"
      });
    }
  };

  // Atualizar o formulário quando as configurações forem carregadas
  if (settings && !form.formState.isDirty) {
    resetForm();
  }

  // Definir o tipo para os dados do formulário
  type FormValues = z.infer<typeof settingsSchema>;

  // Mutação para salvar as configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest('/api/student/settings', {
        method: 'PUT', 
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "Suas preferências foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/settings'] });
      form.reset(form.getValues());
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível atualizar suas preferências. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro ao salvar configurações:", error);
    },
  });

  // Enviar o formulário
  const onSubmit = (formData: FormValues) => {
    updateSettingsMutation.mutate(formData);
  };

  return (
    <AppShell>
      <Helmet>
        <title>Configurações | Edunéxia</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Perfil e Conta
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" /> Notificações
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <SunIcon className="h-4 w-4" /> Aparência
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <KeyIcon className="h-4 w-4" /> Segurança
            </TabsTrigger>
          </TabsList>

          {/* Perfil e Conta */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Visualize e atualize suas informações pessoais. Alguns dados só podem ser alterados pela secretaria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : isError ? (
                  <div className="bg-destructive/10 p-4 rounded-md text-center">
                    <AlertTriangleIcon className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="text-destructive font-semibold">Erro ao carregar suas configurações.</p>
                    <p className="text-sm text-destructive/80 mt-1">Tente novamente mais tarde.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <FormLabel>Nome Completo</FormLabel>
                        <Input value={user?.fullName || ""} readOnly disabled className="bg-muted/50" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Para alterar seu nome, entre em contato com a secretaria.
                        </p>
                      </div>
                      <div>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <Input value={user?.username || ""} readOnly disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <FormLabel>E-mail</FormLabel>
                        <Input value={user?.email || ""} readOnly disabled className="bg-muted/50" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Para alterar seu e-mail, entre em contato com a secretaria.
                        </p>
                      </div>
                      <div>
                        <FormLabel>Matrícula</FormLabel>
                        <Input value={user?.id?.toString() || ""} readOnly disabled className="bg-muted/50" />
                      </div>
                    </div>
                    
                    {/* Seleção de Idioma e Fuso Horário */}
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Idioma</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um idioma" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                    <SelectItem value="en-US">English (US)</SelectItem>
                                    <SelectItem value="es">Español</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Idioma utilizado na interface do sistema.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="timezone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fuso Horário</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um fuso horário" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                                    <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                                    <SelectItem value="America/Rio_Branco">Rio Branco (UTC-5)</SelectItem>
                                    <SelectItem value="America/Noronha">Fernando de Noronha (UTC-2)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Fuso horário para exibição de datas e horários.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={!form.formState.isDirty || updateSettingsMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <SaveIcon className="h-4 w-4" />
                            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Gerencie como e quando você deseja receber notificações da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-6 w-12" />
                      </div>
                    ))}
                  </div>
                ) : isError ? (
                  <div className="bg-destructive/10 p-4 rounded-md text-center">
                    <AlertTriangleIcon className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="text-destructive font-semibold">Erro ao carregar suas configurações.</p>
                    <p className="text-sm text-destructive/80 mt-1">Tente novamente mais tarde.</p>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Notificações por E-mail</FormLabel>
                                <FormDescription>
                                  Receba atualizações importantes por e-mail.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="smsNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Notificações por SMS</FormLabel>
                                <FormDescription>
                                  Receba alertas importantes via mensagem de texto.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Notificações Push</FormLabel>
                                <FormDescription>
                                  Receba notificações em tempo real no navegador.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={!form.formState.isDirty || updateSettingsMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <SaveIcon className="h-4 w-4" />
                          {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aparência */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Aparência</CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema de acordo com suas preferências.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : isError ? (
                  <div className="bg-destructive/10 p-4 rounded-md text-center">
                    <AlertTriangleIcon className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="text-destructive font-semibold">Erro ao carregar suas configurações.</p>
                    <p className="text-sm text-destructive/80 mt-1">Tente novamente mais tarde.</p>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tema</FormLabel>
                            <div className="grid grid-cols-3 gap-4">
                              <div 
                                className={`flex flex-col items-center gap-2 p-4 border rounded-md cursor-pointer transition-all ${field.value === 'light' ? 'border-primary ring-2 ring-primary/20' : ''}`}
                                onClick={() => form.setValue('theme', 'light', { shouldDirty: true })}
                              >
                                <div className="h-16 w-full bg-background border rounded-md flex items-center justify-center">
                                  <SunIcon className="h-8 w-8 text-primary" />
                                </div>
                                <div className="font-medium">Claro</div>
                              </div>
                              <div 
                                className={`flex flex-col items-center gap-2 p-4 border rounded-md cursor-pointer transition-all ${field.value === 'dark' ? 'border-primary ring-2 ring-primary/20' : ''}`}
                                onClick={() => form.setValue('theme', 'dark', { shouldDirty: true })}
                              >
                                <div className="h-16 w-full bg-slate-800 border rounded-md flex items-center justify-center">
                                  <MoonIcon className="h-8 w-8 text-slate-400" />
                                </div>
                                <div className="font-medium">Escuro</div>
                              </div>
                              <div 
                                className={`flex flex-col items-center gap-2 p-4 border rounded-md cursor-pointer transition-all ${field.value === 'system' ? 'border-primary ring-2 ring-primary/20' : ''}`}
                                onClick={() => form.setValue('theme', 'system', { shouldDirty: true })}
                              >
                                <div className="h-16 w-full bg-gradient-to-r from-background to-slate-800 border rounded-md flex items-center justify-center">
                                  <MonitorIcon className="h-8 w-8 text-slate-600" />
                                </div>
                                <div className="font-medium">Sistema</div>
                              </div>
                            </div>
                            <FormDescription>
                              Escolha entre tema claro, escuro ou siga as configurações do seu sistema.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="dateFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formato de Data</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um formato" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</SelectItem>
                                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</SelectItem>
                                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="timeFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formato de Hora</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um formato" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="HH:mm">24 horas (14:30)</SelectItem>
                                  <SelectItem value="hh:mm A">12 horas (02:30 PM)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={!form.formState.isDirty || updateSettingsMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <SaveIcon className="h-4 w-4" />
                          {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>
                  Gerencie sua senha e configurações de segurança.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Alterar Senha</h3>
                  <p className="text-sm text-muted-foreground">
                    Mantenha sua conta segura alterando regularmente sua senha.
                  </p>
                  <Button variant="outline" className="flex items-center gap-2">
                    <KeyIcon className="h-4 w-4" /> Alterar Senha
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Autenticação de Dois Fatores</h3>
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativar Autenticação de Dois Fatores</FormLabel>
                      <FormDescription>
                        Adicione uma camada extra de segurança à sua conta.
                      </FormDescription>
                    </div>
                    <FormField
                      control={form.control}
                      name="twoFactorEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // Abrir modal para configuração de 2FA
                                  toast({
                                    title: "Recurso em desenvolvimento",
                                    description: "A autenticação de dois fatores estará disponível em breve.",
                                  });
                                  return;
                                }
                                field.onChange(checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sessões Ativas</h3>
                  <p className="text-sm text-muted-foreground">
                    Dispositivos onde sua conta está atualmente conectada.
                  </p>
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <MonitorIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Este Dispositivo</p>
                          <p className="text-xs text-muted-foreground">Navegador em Windows • São Paulo, BR</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">Ativo Agora</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted p-2 rounded-full">
                          <SmartphoneIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Dispositivo Móvel</p>
                          <p className="text-xs text-muted-foreground">iPhone • São Paulo, BR • 2 dias atrás</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Encerrar</Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" className="text-destructive">Encerrar Todas as Sessões</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Exportar Dados</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    toast({
                      title: "Ação não permitida",
                      description: "A desativação de conta deve ser solicitada junto à secretaria acadêmica.",
                      variant: "destructive",
                    });
                  }}
                >
                  Solicitar Exclusão de Conta
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}