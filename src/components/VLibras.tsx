import { useEffect } from 'react';

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => void;
    };
  }
}

export const VLibras = () => {
  useEffect(() => {
    // Verifica se já existe o script
    const existingScript = document.querySelector('script[src*="vlibras"]');
    if (existingScript) return;

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

    // Depois carrega o script
    const script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    
    script.onload = () => {
      if (window.VLibras) {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      }
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const scriptEl = document.querySelector('script[src*="vlibras"]');
      if (scriptEl) scriptEl.remove();
      
      const widgetEl = document.querySelector('[vw]');
      if (widgetEl) widgetEl.remove();
    };
  }, []);

  return null;
};
