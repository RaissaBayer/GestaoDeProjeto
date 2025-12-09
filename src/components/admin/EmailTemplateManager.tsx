import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
  subject: string;
  body: string;
  signature: string;
}

const EmailTemplateManager = () => {
  const [template, setTemplate] = useState<EmailTemplate>({
    subject: 'Lembrete: {TITULO_AULAO} - {DATA}',
    body: `Olá!

Esperamos você no aulão "{TITULO_AULAO}" que acontecerá:

📅 Data: {DATA}
⏰ Horário: {HORARIO_INICIO} às {HORARIO_FIM}
📍 Local: {LOCAL}
📚 Matéria: {MATERIA}
👨‍🏫 Ministrante: {MINISTRANTE}

🎯 Tópicos que serão abordados:
{TOPICOS}

📋 Materiais necessários:
{MATERIAIS}

Não se esqueça de trazer sua doação conforme combinado na inscrição.

Nos vemos lá!`,
    signature: `Equipe Aulão Solidário
Educação que transforma vidas! 💙`
  });
  const [isSaving, setIsSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar template do banco de dados na inicialização
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setTemplate({
            subject: data.subject,
            body: data.body,
            signature: data.signature
          });
          setTemplateId(data.id);
        }
      } catch (error) {
        console.error('Erro ao carregar template:', error);
        toast({
          title: "Aviso",
          description: "Usando template padrão.",
          variant: "default",
        });
      }
    };

    loadTemplate();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (templateId) {
        // Atualizar template existente
        const { error } = await supabase
          .from('email_templates')
          .update({
            subject: template.subject,
            body: template.body,
            signature: template.signature
          })
          .eq('id', templateId);

        if (error) throw error;
      } else {
        // Criar novo template
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            subject: template.subject,
            body: template.body,
            signature: template.signature
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setTemplateId(data.id);
      }

      toast({
        title: "Sucesso",
        description: "Template de e-mail salvo com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o template.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const variables = [
    '{TITULO_AULAO}',
    '{DATA}',
    '{HORARIO_INICIO}',
    '{HORARIO_FIM}',
    '{LOCAL}',
    '{MATERIA}',
    '{MINISTRANTE}',
    '{TOPICOS}',
    '{MATERIAIS}'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personalizar E-mails</h2>
          <p className="text-muted-foreground">Configure o template de e-mail enviado aos participantes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Template */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Template do E-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto do E-mail</Label>
                <Input
                  id="subject"
                  value={template.subject}
                  onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                  placeholder="Digite o assunto do e-mail..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Corpo do E-mail</Label>
                <Textarea
                  id="body"
                  value={template.body}
                  onChange={(e) => setTemplate({ ...template, body: e.target.value })}
                  placeholder="Digite o conteúdo do e-mail..."
                  rows={12}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">Assinatura</Label>
                <Textarea
                  id="signature"
                  value={template.signature}
                  onChange={(e) => setTemplate({ ...template, signature: e.target.value })}
                  placeholder="Digite a assinatura..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ajuda e Variáveis */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Variáveis Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Use estas variáveis no seu template para inserir automaticamente as informações do aulão:
              </p>
              <div className="space-y-2">
                {variables.map((variable) => (
                  <Badge key={variable} variant="outline" className="text-xs">
                    {variable}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Assunto:</p>
                  <p className="bg-muted/50 p-2 rounded text-xs break-words">
                    {template.subject}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Corpo:</p>
                  <div className="bg-muted/50 p-2 rounded text-xs max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {template.body}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Assinatura:</p>
                  <p className="bg-muted/50 p-2 rounded text-xs whitespace-pre-wrap">
                    {template.signature}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateManager;