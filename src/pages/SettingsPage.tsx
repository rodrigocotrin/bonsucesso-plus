import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
} from '../components/ui';
import { AccessibilityToolbar } from '../components/shared/AccessibilityToolbar';
import { useAccessibility, useTheme } from '../contexts/AccessibilityContext';
import { useToast } from '../contexts/ToastContext';
import { SPRINGS } from '../lib/motion';
import { ThemeMode } from '../types';
import { cn } from '../utils/formatters';

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Papel quente (#FAF9F6)',
    icon: <Sun className="h-4 w-4" aria-hidden="true" />,
  },
  {
    value: 'dark',
    label: 'Escuro',
    description: 'Quadro-Negro Suíço (#0C0D10)',
    icon: <Moon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Segue o dispositivo',
    icon: <Monitor className="h-4 w-4" aria-hidden="true" />,
  },
];

export const SettingsPage: React.FC = () => {
  const { fontScale, setFontScale } = useAccessibility();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [notifySimulados, setNotifySimulados] = useState(true);
  const [notifyAttendanceAlerts, setNotifyAttendanceAlerts] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);

  const handleSelectTheme = (nextTheme: ThemeMode) => {
    if (nextTheme === theme) return;
    setTheme(nextTheme);
    const option = THEME_OPTIONS.find((opt) => opt.value === nextTheme);
    showToast({
      variant: 'info',
      title: `Aparência: ${option?.label ?? nextTheme}`,
    });
  };

  const handleRestoreDefaults = () => {
    setTheme('system');
    setFontScale('normal');
    setNotifySimulados(true);
    setNotifyAttendanceAlerts(true);
    setNotifyEvents(true);
    showToast({
      variant: 'success',
      title: 'Configurações restauradas',
      description: 'Aparência do Sistema e escala padrão (100%) aplicadas.',
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1>Configurações</h1>

      {/* 1. Aparência (Segmented Control com layoutId: Claro | Escuro | Sistema) */}
      <Card
        as="section"
        title="Aparência"
        headerAction={
          <Badge variant={resolvedTheme === 'dark' ? 'academic' : 'neutral'}>
            {resolvedTheme === 'dark' ? 'Escuro ativo' : 'Claro ativo'}
          </Badge>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-ink">Tema da Interface</p>
            <p className="text-xs text-ink-muted">
              Alterne entre Papel Quente, Quadro-Negro Suíço ou sincronize com o sistema.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Tema da interface"
            className="inline-flex items-center gap-1 rounded-md bg-track p-1"
          >
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectTheme(opt.value)}
                  title={opt.description}
                  className={cn(
                    'relative inline-flex h-9 items-center gap-2 rounded px-3.5 text-xs transition-colors duration-150 active:scale-[0.98]',
                    isSelected
                      ? 'font-semibold text-ink'
                      : 'font-medium text-ink-muted hover:text-ink'
                  )}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="settings-appearance-theme-pill"
                      transition={SPRINGS.indicator}
                      className="absolute inset-0 rounded bg-surface shadow-xs"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 2. Tamanho do Texto (Acessibilidade Tipográfica) */}
      <Card
        as="section"
        title="Tamanho do Texto"
        headerAction={
          <Badge variant="neutral">
            {fontScale === 'normal'
              ? '100%'
              : fontScale === 'large'
              ? '112%'
              : '125%'}
          </Badge>
        }
      >
        <div className="space-y-4">
          <AccessibilityToolbar />

          <div className="rounded-md bg-subtle p-4 text-sm text-ink">
            <strong>Exemplo de leitura:</strong> &ldquo;O Cursinho Comunitário Bonsucesso acredita
            que a educação transforma vidas.&rdquo;
          </div>
        </div>
      </Card>

      {/* 3. Preferências de Notificações e Avisos (Lista horizontal limpa sem box-ception) */}
      <Card as="section" title="Avisos e Lembretes">
        <div className="divide-y divide-line">
          {[
            {
              id: 'notif-simulados',
              title: 'Simulados ENEM e Abertura de Notas',
              description: 'Destacar prazos de simulados e publicação de resultados.',
              checked: notifySimulados,
              onToggle: () => setNotifySimulados((v) => !v),
            },
            {
              id: 'notif-attendance',
              title: 'Alertas Preventivos de Frequência (< 75%)',
              description: 'Exibir aviso preventivo quando a presença se aproximar do limite.',
              checked: notifyAttendanceAlerts,
              onToggle: () => setNotifyAttendanceAlerts((v) => !v),
            },
            {
              id: 'notif-events',
              title: 'Reuniões, Aulões e Calendário',
              description: 'Destacar eventos presenciais e comunicados da coordenação.',
              checked: notifyEvents,
              onToggle: () => setNotifyEvents((v) => !v),
            },
          ].map((pref) => (
            <label
              key={pref.id}
              htmlFor={pref.id}
              className="flex cursor-pointer items-center justify-between gap-4 py-3.5 transition-colors duration-150 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <Bell
                  className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted"
                  aria-hidden="true"
                />
                <div>
                  <span className="block text-sm font-medium text-ink">
                    {pref.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {pref.description}
                  </span>
                </div>
              </div>

              <input
                id={pref.id}
                type="checkbox"
                checked={pref.checked}
                onChange={() => {
                  pref.onToggle();
                  showToast({
                    variant: 'info',
                    title: 'Preferência atualizada',
                  });
                }}
                className="h-4 w-4 shrink-0 cursor-pointer rounded accent-academic"
              />
            </label>
          ))}
        </div>
      </Card>

      {/* 4. Restaurar Padrões */}
      <Card as="section" title="Padrões do Sistema">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-ink-muted">
            Restaura o tema para Sistema e a escala de texto para 100% (16px).
          </p>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={handleRestoreDefaults}
          >
            Restaurar Padrões
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-progress" aria-hidden="true" />
        <span>Preferências salvas automaticamente neste navegador.</span>
      </div>
    </div>
  );
};
