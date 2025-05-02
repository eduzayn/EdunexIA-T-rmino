import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Send, AlertTriangle, RotateCw } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Schema para validação do formulário
const smsTestSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'O número de telefone precisa ter pelo menos 10 dígitos')
    .max(15, 'O número de telefone não pode exceder 15 dígitos'),
  name: z.string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
});

type SmsTestValues = z.infer<typeof smsTestSchema>;

export default function SmsTestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const { toast } = useToast();
  
  const form = useForm<SmsTestValues>({
    resolver: zodResolver(smsTestSchema),
    defaultValues: {
      phoneNumber: '',
      name: ''
    }
  });
  
  const onSubmit = async (values: SmsTestValues) => {
    setIsSubmitting(true);
    setResponseMessage(null);
    
    try {
      const response = await apiRequest('POST', '/api/admin/test-sms', {
        phoneNumber: values.phoneNumber,
        name: values.name
      });
      
      if (response.ok) {
        const data = await response.json();
        setResponseMessage({
          type: 'success',
          message: data.message || 'SMS enviado com sucesso!'
        });
        toast({
          title: 'SMS enviado',
          description: 'O SMS de teste foi enviado com sucesso.',
          variant: 'success',
        });
      } else {
        const errorData = await response.json();
        setResponseMessage({
          type: 'error',
          message: errorData.details || errorData.error || 'Falha ao enviar SMS.'
        });
        toast({
          title: 'Erro ao enviar SMS',
          description: errorData.details || errorData.error || 'Falha ao enviar SMS.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      setResponseMessage({
        type: 'error',
        message: 'Ocorreu um erro ao processar a requisição.'
      });
      toast({
        title: 'Erro de comunicação',
        description: 'Ocorreu um erro ao processar a requisição.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Teste de Envio de SMS</h1>
        
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Envio de Credenciais por SMS</CardTitle>
            <CardDescription>
              Envie um SMS de teste com credenciais de acesso fictícias para verificar a integração com o Twilio.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(99) 99999-9999" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Informe o número com DDD, com ou sem formatação. Ex: (99)99999-9999
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
                      <FormLabel>Nome do Destinatário</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome do aluno" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Nome que será usado na saudação do SMS
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar SMS de Teste
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            {responseMessage && (
              <Alert 
                className={`mt-4 ${responseMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}
              >
                {responseMessage.type === 'error' && (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                <AlertDescription>
                  {responseMessage.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col text-xs text-muted-foreground">
            <p>Este teste envia credenciais fictícias (aluno@exemplo.com / 12345678900) via SMS.</p>
            <p>Use esta ferramenta apenas para validar a integração com o Twilio.</p>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}