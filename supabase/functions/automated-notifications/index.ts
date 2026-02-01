import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY"); // User needs to set this

Deno.serve(async (req) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 1. Fetch All Users
        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("email");

        if (profileError) throw profileError;
        const emails = profiles.map((p) => p.email);

        // 2. Fetch Pending Documents for this week
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const { data: documents, error: docError } = await supabase
            .from("documents")
            .select("filename, area, target_date")
            .neq("status", "released")
            .neq("status", "intranet")
            .gte("target_date", today.toISOString().split("T")[0])
            .lte("target_date", nextWeek.toISOString().split("T")[0]);

        if (docError) throw docError;

        // 3. Construct Email Content
        const docList = documents.map(d => `<li><b>${d.filename}</b> (${d.area}) - Vence: ${d.target_date}</li>`).join("");

        const emailHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #1a237e;">
        <h2>Seguimiento a la documentacion semanal</h2>
        <p>Buen dia, Colaboradores.</p>
        <p>Soy <b>EDORA</b>, recuerda darle seguimiento a los siguientes documentos ya que los planeaste para esta semana, para demostrar tu productividad no debes dejerlos de lado, buscalos y cordinalos para liberarlos. Tu puedes!! te menciono los siguientes documentos:</p>
        <ul>
          ${docList || "<li>No hay documentos pendientes con vencimiento esta semana. ✨</li>"}
        </ul>
        <p>Puedes acceder a la aplicación aquí: <a href="https://hmfbgynbkeskpvushgka.supabase.co">Acceder a EDORA</a></p>
        <p style="font-size: 0.8rem; color: #64748b;">Este es un mensaje automático enviado por el sistema EDORA.</p>
      </div>
    `;

        // 4. Send Email via Resend (Example)
        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({ message: "Resend API Key not set. Email generated but not sent.", html: emailHtml }), { status: 200 });
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "EDORA <notifications@resend.dev>",
                to: emails,
                subject: "Seguimiento a la documentacion semanal",
                html: emailHtml,
            }),
        });

        const resData = await res.json();
        return new Response(JSON.stringify(resData), { status: 200 });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
