import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BACKEND_URL = "https://filipealmeida.pythonanywhere.com";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    // Se for /proxy-vagas/all - busca todas as vagas em uma única requisição
    if (lastPart === 'all') {
      const vagaIds = Array.from({ length: 40 }, (_, i) =>
        `A${String(i + 1).padStart(2, "0")}`
      );

      const results: Record<string, unknown[]> = {};
      
      // Busca todas em paralelo
      await Promise.all(
        vagaIds.map(async (id) => {
          try {
            const response = await fetch(`${BACKEND_URL}/vaga${id}.json`, {
              method: 'GET',
              headers: {
                'User-Agent': 'ParkSense-Proxy/1.0',
                'Accept': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              results[id] = Array.isArray(data) ? data : (data.dados || []);
            } else {
              results[id] = [];
            }
          } catch {
            results[id] = [];
          }
        })
      );

      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Busca individual: /proxy-vagas/A01 ou /proxy-vagas?sensor=A01
    const sensorFromQuery = url.searchParams.get('sensor');
    const sensorFromPath = lastPart?.match(/^A\d{2}$/) ? lastPart : null;
    const sensor = sensorFromQuery || sensorFromPath;

    if (!sensor) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro sensor é obrigatório. Use /proxy-vagas/A01 ou /proxy-vagas/all' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const backendUrl = `${BACKEND_URL}/vaga${sensor}.json`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ParkSense-Proxy/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Backend retornou ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const historico = Array.isArray(data) ? data : (data.dados || data);

    return new Response(
      JSON.stringify(historico),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro no proxy:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao conectar com backend', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
