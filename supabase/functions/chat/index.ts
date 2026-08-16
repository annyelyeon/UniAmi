import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ reply: "Please provide a question or topic." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("AI_API_KEY") || Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          reply: "Configuration Error: AI_API_KEY is not set in Supabase Secrets. Please add your Groq/OpenRouter key.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Groq / OpenAI-compatible endpoint
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are Ami, an authentic, clever, and insightful campus AI tutor on the UniAmi student platform. Answer student queries directly, clearly, and concisely with bold highlights and structured bullet points.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || JSON.stringify(data);
      return new Response(
        JSON.stringify({ reply: `AI API Error (${response.status}): ${errorMessage}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response returned from the model.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ reply: `Edge Function Exception: ${err.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});