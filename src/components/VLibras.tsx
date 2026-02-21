import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => void;
    };
  }
}

export const VLibras = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Verifica se já existe o widget no DOM
    const existingWidget = document.querySelector('[vw]');
    if (existingWidget) return;

    // Adiciona o elemento do widget primeiro
    const widgetDiv = document.createElement('div');
    widgetDiv.setAttribute('vw', '');
    widgetDiv.className = 'enabled';
    widgetDiv.innerHTML = `
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>
    `;
    document.body.appendChild(widgetDiv);

    // Verifica se o script já foi carregado
    const existingScript = document.querySelector('script[src*="vlibras"]');
    if (existingScript) {
      // Script já existe, apenas inicializa o widget
      if (window.VLibras) {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      }
      return;
    }

    // Carrega o script
    const script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    
    script.onload = () => {
      // Aguarda um pouco para o script inicializar internamente
      setTimeout(() => {
        if (window.VLibras) {
          new window.VLibras.Widget('https://vlibras.gov.br/app');
        }
      }, 300);
    };

    script.onerror = () => {
      console.warn('[VLibras] Falha ao carregar o plugin. Tentando novamente...');
      // Retry após 3 segundos
      setTimeout(() => {
        const retryScript = document.createElement('script');
        retryScript.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        retryScript.async = true;
        retryScript.onload = () => {
          setTimeout(() => {
            if (window.VLibras) {
              new window.VLibras.Widget('https://vlibras.gov.br/app');
            }
          }, 300);
        };
        document.body.appendChild(retryScript);
      }, 3000);
    };
    
    document.body.appendChild(script);

    // Sem cleanup - o VLibras não deve ser removido durante a navegação SPA
  }, []);

  return null;
};
