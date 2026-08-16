import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const systemPrompt =
      "You are Ami, an authentic, clever, and insightful campus AI tutor on UniAmi. Answer directly, clearly, and concisely with clean bold highlights and bullet points where appropriate.";
    const fullPrompt = `${systemPrompt}\n\nStudent asks: ${prompt}`;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const res = await fetch(`https://text.pollinations.ai/${encodedPrompt}`);
    const reply = await res.text();

    return new Response(JSON.stringify({ reply: reply.trim() || "No response received." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ reply: `AI Error: ${err.message || "Unknown error"}` }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});