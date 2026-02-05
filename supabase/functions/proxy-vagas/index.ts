import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BACKEND_URL = "https://25382ca97f25.ngrok-free.app";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Aceita /proxy-vagas?sensor=A01 ou /proxy-vagas/A01
    const sensorFromQuery = url.searchParams.get('sensor');
    const pathParts = url.pathname.split('/').filter(Boolean);
    const sensorFromPath = pathParts[pathParts.length - 1];

    const sensor = sensorFromQuery || (sensorFromPath?.match(/^A\d{2}$/) ? sensorFromPath : null);

    if (!sensor) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro sensor é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const backendUrl = `${BACKEND_URL}/vaga${sensor}.json`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
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
    
    // Backend retorna { dados: [...] }, extraímos apenas o array
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
