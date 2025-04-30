import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { insertUserSchema, User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

// Estender o schema para validação do formulário
const teacherFormSchema = z.object({
  username: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  fullName: z.string().min(3, { message: "Nome completo deve ter pelo menos 3 caracteres" }),
  isActive: z.boolean().default(true),
  avatarUrl: z.string().nullable().optional(),
  password: z.string().min(8, {
    message: "A senha deve ter pelo menos 8 caracteres",
  }).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Se o password estiver presente, confirmPassword também deve estar e serem iguais
  if (data.password && !data.confirmPassword) return false;
  if (!data.password && data.confirmPassword) return false;
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) return false;
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

type TeacherFormProps = {
  initialData?: Partial<User>;
  onSubmit: (data: TeacherFormData) => Promise<void>;
  isLoading: boolean;
};

export default function TeacherForm({ initialData, onSubmit, isLoading }: TeacherFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const isEditMode = !!initialData?.id;

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      username: initialData?.username || "",
      email: initialData?.email || "",
      fullName: initialData?.fullName || "",
      password: "",
      confirmPassword: "",
      isActive: initialData?.isActive ?? true,
      avatarUrl: initialData?.avatarUrl || null,
    },
  });

  const handleSubmit = async (data: TeacherFormData) => {
    // Remove confirmPassword antes de enviar para o backend
    const { confirmPassword, ...formData } = data;
    
    // Se não houver senha, remova o campo password
    const submissionData = formData.password ? formData : { ...formData, password: undefined };
    
    await onSubmit(submissionData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/teachers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Link>
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome de usuário" {...field} />
                    </FormControl>
                    <FormDescription>
                      Usado para login no sistema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Foto de Perfil</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com/foto.jpg" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      Link para a foto de perfil (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos de senha - apenas mostrar se for criação ou se o usuário quiser trocar a senha */}
              {(!isEditMode || showPassword) && (
                <>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isEditMode ? "Nova Senha" : "Senha"}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite a senha" {...field} />
                        </FormControl>
                        {isEditMode && (
                          <FormDescription>
                            Deixe em branco para manter a senha atual
                          </FormDescription>
                        )}
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
                          <Input type="password" placeholder="Confirme a senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {isEditMode && (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Cancelar Alteração de Senha" : "Alterar Senha"}
                    </Button>
                  </div>
                </FormItem>
              )}
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Professor Ativo
                    </FormLabel>
                    <FormDescription>
                      Professores inativos não podem acessar o sistema
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Atualizando..." : "Criando..."}
                </>
              ) : (
                isEditMode ? "Atualizar Professor" : "Criar Professor"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}