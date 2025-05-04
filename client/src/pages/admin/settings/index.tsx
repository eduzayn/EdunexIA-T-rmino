import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/layout/app-shell";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Loader2, Save, Settings as SettingsIcon, Bell, PaintBucket, Globe, Clock, Moon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Esquema para validação do formulário de configurações
const settingsFormSchema = z.object({
  maintenanceMode: z.boolean().optional().default(false),
  maintenanceMessage: z.string().nullable().optional(),
  theme: z.string().optional().default("light"),
  defaultDateFormat: z.string().optional().default("DD/MM/YYYY"),
  defaultTimeFormat: z.string().optional().default("HH:mm"),
  timezone: z.string().optional().default("America/Sao_Paulo"),
  notificationsEnabled: z.boolean().optional().default(true),
  emailNotificationsEnabled: z.boolean().optional().default(true),
  smsNotificationsEnabled: z.boolean().optional().default(true),
  customCss: z.string().nullable().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");

  // Buscar configurações atuais
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["/api/settings"],
    retry: 1
  });

  // Configurar formulário
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      maintenanceMode: false,
      maintenanceMessage: "",
      theme: "light",
      defaultDateFormat: "DD/MM/YYYY",
      defaultTimeFormat: "HH:mm",
      timezone: "America/Sao_Paulo",
      notificationsEnabled: true,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: true,
      customCss: "",
    },
  });

  // Atualizar formulário quando dados forem carregados
  React.useEffect(() => {
    if (settings) {
      form.reset({
        maintenanceMode: settings.maintenanceMode || false,
        maintenanceMessage: settings.maintenanceMessage || "",
        theme: settings.theme || "light",
        defaultDateFormat: settings.defaultDateFormat || "DD/MM/YYYY",
        defaultTimeFormat: settings.defaultTimeFormat || "HH:mm",
        timezone: settings.timezone || "America/Sao_Paulo",
        notificationsEnabled: settings.notificationsEnabled || true,
        emailNotificationsEnabled: settings.emailNotificationsEnabled || true,
        smsNotificationsEnabled: settings.smsNotificationsEnabled || true,
        customCss: settings.customCss || "",
      });
    }
  }, [settings, form]);

  // Mutação para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      return apiRequest("/api/settings", {
        method: "PUT",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
        variant: "default",
      });
      // Invalidar cache das configurações
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao atualizar as configurações do sistema.",
        variant: "destructive",
      });
    },
  });

  // Função para enviar o formulário
  const onSubmit = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie todas as configurações do sistema educacional
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Ocorreu um erro ao carregar as configurações do sistema. Por favor, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Geral
                </TabsTrigger>
                <TabsTrigger value="appearance">
                  <PaintBucket className="mr-2 h-4 w-4" />
                  Aparência
                </TabsTrigger>
                <TabsTrigger value="localization">
                  <Globe className="mr-2 h-4 w-4" />
                  Localização
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notificações
                </TabsTrigger>
              </TabsList>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                  <TabsContent value="general">
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações Gerais</CardTitle>
                        <CardDescription>
                          Configure as opções gerais do sistema, incluindo modo de manutenção.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="maintenanceMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Modo de Manutenção
                                </FormLabel>
                                <FormDescription>
                                  Ativar modo de manutenção tornará o sistema indisponível para usuários não-administradores.
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
                        
                        {form.watch("maintenanceMode") && (
                          <FormField
                            control={form.control}
                            name="maintenanceMessage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mensagem de Manutenção</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Sistema em manutenção. Voltaremos em breve."
                                    className="resize-none"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Esta mensagem será exibida para usuários durante o período de manutenção.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="appearance">
                    <Card>
                      <CardHeader>
                        <CardTitle>Aparência</CardTitle>
                        <CardDescription>
                          Personalize a aparência do sistema.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tema</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um tema" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="light">
                                    <div className="flex items-center">
                                      <div className="w-4 h-4 rounded-full bg-background border mr-2"></div>
                                      Claro
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="dark">
                                    <div className="flex items-center">
                                      <div className="w-4 h-4 rounded-full bg-slate-800 mr-2"></div>
                                      Escuro
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="system">
                                    <div className="flex items-center">
                                      <Moon className="w-4 h-4 mr-2" />
                                      Sistema
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define o tema padrão para todos os usuários.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="customCss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CSS Personalizado</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder=".my-class { color: #ff0000; }"
                                  className="font-mono h-32"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                CSS personalizado para personalizar a aparência do sistema.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="localization">
                    <Card>
                      <CardHeader>
                        <CardTitle>Localização</CardTitle>
                        <CardDescription>
                          Configure o formato de data, hora e fuso horário do sistema.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="defaultDateFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formato de Data</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um formato de data" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</SelectItem>
                                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</SelectItem>
                                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define o formato padrão para exibição de datas no sistema.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="defaultTimeFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formato de Hora</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um formato de hora" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="HH:mm">24 horas (14:30)</SelectItem>
                                  <SelectItem value="hh:mm A">12 horas (02:30 PM)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define o formato padrão para exibição de horários no sistema.
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
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um fuso horário" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                                  <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                                  <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                                  <SelectItem value="America/Noronha">Fernando de Noronha (GMT-2)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define o fuso horário padrão do sistema.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="notifications">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notificações</CardTitle>
                        <CardDescription>
                          Configure as opções de notificação do sistema.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="notificationsEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Notificações
                                </FormLabel>
                                <FormDescription>
                                  Ativar ou desativar todas as notificações do sistema.
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

                        {form.watch("notificationsEnabled") && (
                          <>
                            <FormField
                              control={form.control}
                              name="emailNotificationsEnabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Notificações por E-mail
                                    </FormLabel>
                                    <FormDescription>
                                      Enviar notificações por e-mail para usuários.
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
                              name="smsNotificationsEnabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Notificações por SMS
                                    </FormLabel>
                                    <FormDescription>
                                      Enviar notificações por SMS para usuários.
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
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="w-[200px]"
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </Tabs>
          </div>
        )}
      </div>
    </AppShell>
  );
}