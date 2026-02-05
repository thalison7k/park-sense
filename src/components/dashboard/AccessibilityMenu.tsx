// src/components/dashboard/AccessibilityMenu.tsx
// Menu de opções de acessibilidade

import { useState } from 'react';
import { Accessibility, Eye, Type, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccessibility } from '@/hooks/useAccessibility';

export const AccessibilityMenu = () => {
  const [open, setOpen] = useState(false);
  const {
    settings,
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    resetSettings,
  } = useAccessibility();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full shadow-lg border-primary/50 bg-background/95 backdrop-blur-sm hover:bg-primary/10 hover:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Abrir menu de acessibilidade"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <Accessibility className="w-6 h-6 text-primary" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-4"
        side="top"
        align="start"
        role="dialog"
        aria-label="Configurações de acessibilidade"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Acessibilidade</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              aria-label="Restaurar configurações padrão"
            >
              <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
              Restaurar
            </Button>
          </div>

          <div className="space-y-3">
            {/* Alto Contraste */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Label 
                  htmlFor="high-contrast" 
                  className="text-sm cursor-pointer"
                >
                  Alto Contraste
                </Label>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={toggleHighContrast}
                aria-describedby="high-contrast-desc"
              />
            </div>
            <p id="high-contrast-desc" className="text-xs text-muted-foreground -mt-1 ml-6">
              Aumenta o contraste das cores
            </p>

            {/* Texto Grande */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Label 
                  htmlFor="large-text" 
                  className="text-sm cursor-pointer"
                >
                  Texto Grande
                </Label>
              </div>
              <Switch
                id="large-text"
                checked={settings.largeText}
                onCheckedChange={toggleLargeText}
                aria-describedby="large-text-desc"
              />
            </div>
            <p id="large-text-desc" className="text-xs text-muted-foreground -mt-1 ml-6">
              Aumenta o tamanho da fonte
            </p>

            {/* Reduzir Movimento */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Label 
                  htmlFor="reduce-motion" 
                  className="text-sm cursor-pointer"
                >
                  Reduzir Movimento
                </Label>
              </div>
              <Switch
                id="reduce-motion"
                checked={settings.reduceMotion}
                onCheckedChange={toggleReduceMotion}
                aria-describedby="reduce-motion-desc"
              />
            </div>
            <p id="reduce-motion-desc" className="text-xs text-muted-foreground -mt-1 ml-6">
              Desativa animações
            </p>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">
            Use Tab para navegar, Enter para ativar, Esc para fechar.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
