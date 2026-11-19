import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Eye,
  RotateCcw,
  Settings,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
} from '../components/ui';
import { AccessibilityToolbar } from '../components/shared/AccessibilityToolbar';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useToast } from '../contexts/ToastContext';

/**
 * Página compartilhada "Configurações" para todos os perfis.
 * Concentra preferências de Acessibilidade (Tamanho da Letra e Modo Claro/Escuro)
 * e preferências gerais de notificações/avisos.
 */
export const SettingsPage: React.FC = () => {
  const { theme, fontScale, setTheme, setFontScale } = useAccessibility();
  const { showToast } = useToast();

  const [notifySimulados, setNotifySimulados] = useState(true);
  const [notifyAttendanceAlerts, setNotifyAttendanceAlerts] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);

  const handleRestoreDefaults = () => {
    setTheme('light');
    setFontScale('normal');
    setNotifySimulados(true);
    setNotifyAttendanceAlerts(true);
    setNotifyEvents(true);
    showToast({
      variant: 'success',
      title: 'Configurações restauradas para o padrão',
      description: 'Tema Claro e Tamanho da Letra Normal (16px) aplicados.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <Badge variant="primary" icon={<Settings className="h-4 w-4" />}>
          Preferências Gerais do Portal
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Personalize o tamanho da letra, o contraste de cores e quais avisos você prefere receber.
          Todas as escolhas ficam salvas automaticamente neste aparelho.
        </p>
      </header>

      {/* 1. Aparência e Leitura (Acessibilidade) */}
      <Card
        as="section"
        title="Aparência, Contraste e Tamanho da Letra"
        subtitle="Escolha o tamanho de texto mais confortável para seus olhos e alterne entre Modo Claro ou Modo Escuro."
        headerAction={
          <Badge variant="neutral" icon={<Eye className="h-4 w-4" />}>
            {theme === 'light' ? 'Modo Claro' : 'Modo Escuro'} •{' '}
            {fontScale === 'normal'
              ? 'Letra Normal'
              : fontScale === 'large'
              ? 'Letra Grande'
              : 'Letra Extra Grande'}
          </Badge>
        }
      >
        <div className="space-y-5">
          <AccessibilityToolbar />

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
            <strong>Exemplo de leitura atual:</strong> "O Cursinho Comunitário Bonsucesso acredita
            que a educação transforma vidas. Você pode testar os botões acima e ver o texto crescer
            imediatamente em todo o site."
          </div>
        </div>
      </Card>

      {/* 2. Preferências de Notificações e Avisos */}
      <Card
        as="section"
        title="Preferências de Avisos e Lembretes"
        subtitle="Escolha quais tipos de comunicados você deseja destacar no portal."
      >
        <div className="space-y-3">
          {[
            {
              id: 'notif-simulados',
              title: 'Lembretes de Simulados ENEM e Abertura de Notas',
              description: 'Avisar quando um simulado estiver chegando ou quando o resultado sair.',
              checked: notifySimulados,
              onToggle: () => setNotifySimulados((v) => !v),
            },
            {
              id: 'notif-attendance',
              title: 'Alertas Preventivos de Frequência (abaixo de 75%)',
              description: 'Mostrar aviso acolhedor caso a presença nas aulas fique próxima do limite.',
              checked: notifyAttendanceAlerts,
              onToggle: () => setNotifyAttendanceAlerts((v) => !v),
            },
            {
              id: 'notif-events',
              title: 'Reuniões de Famílias, Aulões Especiais e Feriados',
              description: 'Destacar eventos presenciais e alterações no calendário do cursinho.',
              checked: notifyEvents,
              onToggle: () => setNotifyEvents((v) => !v),
            },
          ].map((pref) => (
            <label
              key={pref.id}
              htmlFor={pref.id}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4 hover:border-primary-500 dark:border-slate-800 dark:bg-slate-950/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Bell
                  className="h-5 w-5 text-primary-700 dark:text-primary-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <span className="block text-base font-bold text-slate-900 dark:text-white">
                    {pref.title}
                  </span>
                  <span className="block text-sm text-slate-600 dark:text-slate-300 mt-0.5">
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
                    title: 'Preferência de aviso atualizada',
                    description: 'Sua escolha foi salva com sucesso.',
                  });
                }}
                className="mt-1 h-6 w-6 shrink-0 rounded accent-primary-700 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </Card>

      {/* 3. Restaurar Padrões */}
      <Card
        as="section"
        title="Restaurar Padrões de Fábrica"
        subtitle="Volta o tamanho da letra para o padrão (16px) e o tema para Modo Claro."
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Se você alterou o tamanho da letra ou as cores e deseja voltar ao visual padrão do
            IntegraCurso, clique no botão ao lado.
          </p>
          <Button
            variant="ghost"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={handleRestoreDefaults}
          >
            Restaurar Configurações Padrão
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <CheckCircle2 className="h-4 w-4 text-primary-700 dark:text-primary-400 shrink-0" aria-hidden="true" />
        <span>Suas preferências são aplicadas instantaneamente em todas as telas do seu perfil.</span>
      </div>
    </div>
  );
};
