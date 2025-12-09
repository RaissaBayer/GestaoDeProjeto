import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface EmailRequest {
  classId: string;
}

const formatDateToLocale = (dateString: string, locale = "pt-BR") => {
  if (!dateString) return "";

  const [datePart] = dateString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);

  if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(locale);
  }

  const parsedDate = new Date(dateString);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : parsedDate.toLocaleDateString(locale);
};

const formatTimeToHoursMinutes = (timeString: string) => {
  if (!timeString) return "";

  const match = timeString.match(/(\d{1,2}):(\d{2})/);

  if (match) {
    const [, hour, minute] = match;
    return `${hour.padStart(2, "0")}:${minute}`;
  }

  return timeString;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { classId }: EmailRequest = await req.json();

    // Buscar template de e-mail
    const { data: templateData, error: templateError } = await supabase
      .from('email_templates')
      .select('subject, body, signature')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (templateError) {
      console.error('Erro ao buscar template:', templateError);
    }

    const template = templateData || {
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
    };

    // Buscar dados do aulão
    const { data: classData, error: classError } = await supabase
      .from('scheduled_classes')
      .select(`
        *,
        subject:subjects(name),
        teacher:volunteer_teachers(full_name)
      `)
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      throw new Error('Aulão não encontrado');
    }

    // Buscar inscrições do aulão
    const { data: registrations, error: registrationsError } = await supabase
      .from('class_registrations')
      .select('student_name, student_email')
      .eq('class_id', classId);

    if (registrationsError || !registrations) {
      throw new Error('Erro ao buscar inscrições');
    }

    if (registrations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma inscrição encontrada para este aulão' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Preparar variáveis para substituição no template
    const templateVariables = {
      '{TITULO_AULAO}': classData.title,
      '{DATA}': formatDateToLocale(classData.date),
      '{HORARIO_INICIO}': formatTimeToHoursMinutes(classData.start_time),
      '{HORARIO_FIM}': formatTimeToHoursMinutes(classData.end_time),
      '{LOCAL}': classData.location,
      '{MATERIA}': classData.subject?.name || 'Não informado',
      '{MINISTRANTE}': classData.teacher?.full_name || 'A definir',
      '{TOPICOS}': classData.topics?.join(', ') || 'Não informado',
      '{MATERIAIS}': classData.materials_needed || 'Não informado'
    };

    // Substituir variáveis no conteúdo
    let processedBody = template.body;
    let processedSubject = template.subject;
    
    Object.entries(templateVariables).forEach(([variable, value]) => {
      processedBody = processedBody.replace(new RegExp(variable, 'g'), value);
      processedSubject = processedSubject.replace(new RegExp(variable, 'g'), value);
    });

    // Adicionar link do arquivo se existir
    if (classData.file_url) {
      processedBody += `\n\n📎 Arquivo do aulão: ${classData.file_url}`;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">Aulão Solidário</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          ${processedBody.replace(/\n/g, '<br>')}
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #64748b;">
          ${template.signature.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;

    // Enviar e-mails para todos os inscritos
    const emailPromises = registrations.map(async (registration) => {
      return resend.emails.send({
        from: "Aulão Solidário <onboarding@resend.dev>",
        to: [registration.student_email],
        subject: processedSubject,
        html: htmlContent,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const errorCount = results.filter(result => result.status === 'rejected').length;

    console.log(`E-mails enviados: ${successCount} sucessos, ${errorCount} erros`);

    return new Response(
      JSON.stringify({ 
        message: `E-mails enviados com sucesso para ${successCount} participantes`,
        successCount,
        errorCount
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Erro ao enviar e-mails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);