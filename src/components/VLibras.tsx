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
    // Adiciona o script do VLibras
    const script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    
    script.onload = () => {
      if (window.VLibras) {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      }
    };
    
    document.body.appendChild(script);

    // Adiciona o elemento do widget
    const widget = document.createElement('div');
    widget.setAttribute('vw', '');
    widget.className = 'enabled';
    widget.innerHTML = `
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>
    `;
    document.body.appendChild(widget);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src*="vlibras"]');
      if (existingScript) existingScript.remove();
      
      const existingWidget = document.querySelector('[vw]');
      if (existingWidget) existingWidget.remove();
    };
  }, []);

  return null;
};
