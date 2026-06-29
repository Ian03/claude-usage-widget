(function () {
  const LOCALES = {
    en: {
      // Widget static
      'pill.tooltip': 'Drag to move · click chevron to expand',
      'widget.title': 'Claude usage',
      'widget.expand': 'Expand',
      'widget.refresh': 'Refresh',
      'widget.settings': 'Settings',
      'widget.minimize': 'Minimize to pill',
      'widget.hide': 'Hide to tray (click the tray icon to bring it back)',
      'graph.title.default': '7-day history',
      'graph.collecting': 'Collecting data…',
      'graph.stale': 'syncing',
      'mascot.title': "Claw'd",

      // Dynamic widget strings
      'time.resetting': 'resetting…',
      'time.resets.days': 'resets in {d}d {h}h',
      'time.resets.hours': 'resets in {h}h {m}m',
      'time.resets.minutes': 'resets in {m}m',
      'time.just_now': 'just now',
      'time.seconds_ago': '{sec}s ago',
      'time.minutes_ago': '{m}m ago',
      'time.hours_ago': '{h}h ago',
      'widget.last_updated': 'Updated {age}',

      // Money
      'money.used': '{used} of {limit} used',
      'money.used_plain': '{used} of {limit} {code} used',

      // Pill short labels
      'pill.label.week': 'week',
      'pill.label.5h': '5h',
      'pill.label.extra': 'extra',

      // Graph
      'graph.title.with_label': '{label} · 7-day history',
      'graph.sub': '{pct}% now',

      // Update link
      'update.available': '↑ v{version}',
      'update.tooltip': 'New release available — click to open the GitHub release page for v{version}.',

      // Empty states
      'error.no_creds.title': 'No Claude Code login found',
      'error.no_creds.body': 'Run <code>claude</code> in a terminal and sign in. The widget will pick up your usage automatically.',
      'error.auth_expired.title': 'Sign-in expired',
      'error.auth_expired.body': 'Run <code>claude</code> in a terminal once to refresh your token.',
      'error.generic.title': "Can't reach Anthropic right now",
      'error.loading': 'Waiting for first fetch…',

      // Error badges
      'badge.no_creds': 'sign in',
      'badge.no_creds.tooltip': 'No Claude Code login found. Run `claude` in a terminal and sign in — the widget will pick up your usage on the next poll.',
      'badge.auth': 'auth',
      'badge.auth.tooltip': 'OAuth token expired. Run `claude` in a terminal once to refresh; the widget will pick up the new token on the next poll.',
      'badge.paused': 'paused',
      'badge.paused.tooltip': 'Pausing briefly — Anthropic asked us to wait. The widget will pick back up on its own.',
      'badge.server': 'server',
      'badge.server.tooltip': 'Server returned an unexpected status.',
      'badge.offline': 'offline',
      'badge.offline.tooltip': 'Network error — the widget will retry.',

      // Refresh debounce
      'refresh.debounced': 'Just refreshed — try again in {sec}s',

      // Grumpy lines (array)
      'mascot.grumpy': ['5 more minutes…', 'I was sleeping!', 'Hmph.', "Don't.", 'Zzz… wha—', 'Go away.', 'Sleeping here.', 'Rude.'],

      // Limit labels
      'limit.five_hour': 'Current session',
      'limit.seven_day': 'Weekly · all models',
      'limit.seven_day_sonnet': 'Weekly · Sonnet',
      'limit.seven_day_opus': 'Weekly · Opus',
      'limit.seven_day_cowork': 'Weekly · Cowork',
      'limit.cowork': 'Cowork',
      'limit.routines': 'Daily routines',
      'limit.extra_usage': 'Extra usage',

      // Settings
      'settings.title': 'Claude Usage Widget',
      'settings.subtitle': 'Cosmetic and behavior options. Changes apply live.',

      'settings.section.language': 'Language',
      'settings.language.label': 'Language',
      'settings.language.en': 'English',
      'settings.language.pt-BR': 'Português (Brasil)',

      'settings.section.layout': 'Layout',
      'settings.layout.density': 'Density',
      'settings.layout.expanded': 'Expanded (header + countdowns)',
      'settings.layout.compact': 'Compact (header only)',
      'settings.layout.essential': 'Essential (bars only)',
      'settings.layout.minimal': 'Minimal (pill — worst limit only)',
      'settings.layout.alwaysOnTop': 'Always on top',
      'settings.layout.clickThrough': 'Click-through',
      'settings.layout.showHeader': 'Show header',
      'settings.layout.showResetCountdown': 'Show reset countdown',
      'settings.layout.showPaceMarker': 'Show pace marker',
      'settings.layout.showStaleIndicator': 'Show stale-data badge',
      'settings.layout.showMascot': "Show Claw'd (the crab mascot)",

      'settings.section.look': 'Look',
      'settings.look.theme': 'Theme',
      'settings.look.theme.system': 'Follow system',
      'settings.look.theme.dark': 'Dark',
      'settings.look.theme.light': 'Light',
      'settings.look.accent': 'Accent',
      'settings.look.opacity': 'Opacity',
      'settings.look.cornerRadius': 'Corner radius',
      'settings.look.fontSize': 'Font size',
      'settings.look.fontFamily': 'Font family',
      'settings.look.fontFamily.system': 'System default',
      'settings.look.blur': 'Background blur',

      'settings.section.tray': 'Tray icon',
      'settings.tray.style': 'Style',
      'settings.tray.bars': 'Bars (decoration only)',
      'settings.tray.battery': 'Battery (fills with worst limit)',
      'settings.tray.gauge': 'Gauge (fills with worst limit)',
      'settings.tray.minimal': 'Minimal dot (tinted by severity)',
      'settings.tray.dynamic': 'Dynamic gauge (fills + tints by worst limit)',

      'settings.section.history': 'History graph',
      'settings.history.show': 'Show 7-day graph',
      'settings.history.series': 'Series',
      'settings.history.seven_day': 'Weekly · all models',
      'settings.history.seven_day_sonnet': 'Weekly · Sonnet',
      'settings.history.seven_day_opus': 'Weekly · Opus',
      'settings.history.five_hour': 'Current session',
      'settings.history.extra_usage': 'Extra usage',

      'settings.section.thresholds': 'Thresholds',
      'settings.thresholds.warn': 'Warn at %',
      'settings.thresholds.critical': 'Critical at %',
      'settings.thresholds.okColor': 'OK color',
      'settings.thresholds.warnColor': 'Warn color',
      'settings.thresholds.criticalColor': 'Critical color',

      'settings.section.notifications': 'Notifications',
      'settings.notifications.warn': 'Notify at warn threshold',
      'settings.notifications.critical': 'Notify at critical threshold',

      'settings.section.hooks': 'Reset hooks',
      'settings.hooks.description.html': 'Shell commands run when a quota resets. Env vars set: <code>CLAUDE_RESET_ID</code>, <code>CLAUDE_RESET_LABEL</code>, <code>CLAUDE_RESET_AT</code>.',
      'settings.hooks.five_hour': '5-hour session',
      'settings.hooks.seven_day': 'Weekly all-models',
      'settings.hooks.seven_day_sonnet': 'Weekly Sonnet',
      'settings.hooks.seven_day_opus': 'Weekly Opus',
      'settings.hooks.placeholder': "e.g. powershell -c \"New-BurntToastNotification -Text 'Session reset'\"",

      'settings.section.startup': 'Startup',
      'settings.startup.openAtLogin': 'Start with Windows',
      'settings.startup.openMinimized': 'Open hidden (tray only)',

      'settings.section.updates': 'Updates',
      'settings.updates.checkGitHub': 'Check GitHub for new releases (once a day)',
      'settings.updates.checkNow': 'Check now',
      'settings.updates.never': 'Never checked yet.',
      'settings.updates.available': 'v{version} is available — see the header link to download.',
      'settings.updates.latest': "You're on the latest version (v{version}).",
      'settings.updates.checking': 'Checking…',

      'settings.section.about': 'About',
      'settings.about.description.html': 'Reads OAuth token from <code>~/.claude/.credentials.json</code>. Token refresh is picked up automatically on the next poll.',
      'settings.about.openCreds': 'Open credentials file',
      'settings.about.quit': 'Quit widget',
    },

    'pt-BR': {
      // Widget static
      'pill.tooltip': 'Arraste para mover · clique na seta para expandir',
      'widget.title': 'Uso do Claude',
      'widget.expand': 'Expandir',
      'widget.refresh': 'Atualizar',
      'widget.settings': 'Configurações',
      'widget.minimize': 'Minimizar para pílula',
      'widget.hide': 'Ocultar para bandeja (clique no ícone da bandeja para exibir)',
      'graph.title.default': 'Histórico de 7 dias',
      'graph.collecting': 'Coletando dados…',
      'graph.stale': 'sincronizando',
      'mascot.title': "Claw'd",

      // Dynamic widget strings
      'time.resetting': 'reiniciando…',
      'time.resets.days': 'reinicia em {d}d {h}h',
      'time.resets.hours': 'reinicia em {h}h {m}m',
      'time.resets.minutes': 'reinicia em {m}m',
      'time.just_now': 'agora mesmo',
      'time.seconds_ago': 'há {sec}s',
      'time.minutes_ago': 'há {m}m',
      'time.hours_ago': 'há {h}h',
      'widget.last_updated': 'Atualizado {age}',

      // Money
      'money.used': '{used} de {limit} usados',
      'money.used_plain': '{used} de {limit} {code} usados',

      // Pill short labels
      'pill.label.week': 'semana',
      'pill.label.5h': '5h',
      'pill.label.extra': 'extra',

      // Graph
      'graph.title.with_label': '{label} · histórico de 7 dias',
      'graph.sub': '{pct}% agora',

      // Update link
      'update.available': '↑ v{version}',
      'update.tooltip': 'Nova versão disponível — clique para abrir a página de lançamento v{version} no GitHub.',

      // Empty states
      'error.no_creds.title': 'Login do Claude Code não encontrado',
      'error.no_creds.body': 'Execute <code>claude</code> em um terminal e faça login. O widget detectará seu uso automaticamente.',
      'error.auth_expired.title': 'Login expirado',
      'error.auth_expired.body': 'Execute <code>claude</code> em um terminal uma vez para renovar seu token.',
      'error.generic.title': 'Não foi possível conectar à Anthropic',
      'error.loading': 'Aguardando primeira busca…',

      // Error badges
      'badge.no_creds': 'entrar',
      'badge.no_creds.tooltip': 'Login do Claude Code não encontrado. Execute `claude` em um terminal e faça login — o widget atualizará na próxima consulta.',
      'badge.auth': 'auth',
      'badge.auth.tooltip': 'Token OAuth expirado. Execute `claude` em um terminal uma vez para renovar; o widget detectará o novo token na próxima consulta.',
      'badge.paused': 'pausado',
      'badge.paused.tooltip': 'Pausando brevemente — a Anthropic pediu para aguardar. O widget retomará automaticamente.',
      'badge.server': 'servidor',
      'badge.server.tooltip': 'O servidor retornou um status inesperado.',
      'badge.offline': 'offline',
      'badge.offline.tooltip': 'Erro de rede — o widget tentará novamente.',

      // Refresh debounce
      'refresh.debounced': 'Atualizado recentemente — tente novamente em {sec}s',

      // Grumpy lines (array)
      'mascot.grumpy': ['Mais 5 minutos…', 'Eu estava dormindo!', 'Humph.', 'Não.', 'Zzz… o quê—', 'Vai embora.', 'Dormindo aqui.', 'Grosseria.'],

      // Limit labels
      'limit.five_hour': 'Sessão atual',
      'limit.seven_day': 'Semanal · todos os modelos',
      'limit.seven_day_sonnet': 'Semanal · Sonnet',
      'limit.seven_day_opus': 'Semanal · Opus',
      'limit.seven_day_cowork': 'Semanal · Cowork',
      'limit.cowork': 'Cowork',
      'limit.routines': 'Rotinas diárias',
      'limit.extra_usage': 'Uso extra',

      // Settings
      'settings.title': 'Claude Usage Widget',
      'settings.subtitle': 'Opções de aparência e comportamento. As alterações são aplicadas em tempo real.',

      'settings.section.language': 'Idioma',
      'settings.language.label': 'Idioma',
      'settings.language.en': 'English',
      'settings.language.pt-BR': 'Português (Brasil)',

      'settings.section.layout': 'Layout',
      'settings.layout.density': 'Densidade',
      'settings.layout.expanded': 'Expandido (cabeçalho + contagens)',
      'settings.layout.compact': 'Compacto (apenas cabeçalho)',
      'settings.layout.essential': 'Essencial (apenas barras)',
      'settings.layout.minimal': 'Mínimo (pílula — pior limite)',
      'settings.layout.alwaysOnTop': 'Sempre visível',
      'settings.layout.clickThrough': 'Clique transparente',
      'settings.layout.showHeader': 'Exibir cabeçalho',
      'settings.layout.showResetCountdown': 'Exibir contagem regressiva',
      'settings.layout.showPaceMarker': 'Exibir marcador de ritmo',
      'settings.layout.showStaleIndicator': 'Exibir badge de dados desatualizados',
      'settings.layout.showMascot': "Exibir o Claw'd (o mascote caranguejo)",

      'settings.section.look': 'Aparência',
      'settings.look.theme': 'Tema',
      'settings.look.theme.system': 'Seguir sistema',
      'settings.look.theme.dark': 'Escuro',
      'settings.look.theme.light': 'Claro',
      'settings.look.accent': 'Destaque',
      'settings.look.opacity': 'Opacidade',
      'settings.look.cornerRadius': 'Arredondamento',
      'settings.look.fontSize': 'Tamanho da fonte',
      'settings.look.fontFamily': 'Família da fonte',
      'settings.look.fontFamily.system': 'Padrão do sistema',
      'settings.look.blur': 'Desfoque de fundo',

      'settings.section.tray': 'Ícone da bandeja',
      'settings.tray.style': 'Estilo',
      'settings.tray.bars': 'Barras (decoração)',
      'settings.tray.battery': 'Bateria (preenche com pior limite)',
      'settings.tray.gauge': 'Medidor (preenche com pior limite)',
      'settings.tray.minimal': 'Ponto mínimo (colorido por severidade)',
      'settings.tray.dynamic': 'Medidor dinâmico (preenche + colore pelo pior limite)',

      'settings.section.history': 'Gráfico de histórico',
      'settings.history.show': 'Exibir gráfico de 7 dias',
      'settings.history.series': 'Série',
      'settings.history.seven_day': 'Semanal · todos os modelos',
      'settings.history.seven_day_sonnet': 'Semanal · Sonnet',
      'settings.history.seven_day_opus': 'Semanal · Opus',
      'settings.history.five_hour': 'Sessão atual',
      'settings.history.extra_usage': 'Uso extra',

      'settings.section.thresholds': 'Limiares',
      'settings.thresholds.warn': 'Avisar em %',
      'settings.thresholds.critical': 'Crítico em %',
      'settings.thresholds.okColor': 'Cor OK',
      'settings.thresholds.warnColor': 'Cor de aviso',
      'settings.thresholds.criticalColor': 'Cor crítica',

      'settings.section.notifications': 'Notificações',
      'settings.notifications.warn': 'Notificar no limiar de aviso',
      'settings.notifications.critical': 'Notificar no limiar crítico',

      'settings.section.hooks': 'Hooks de reset',
      'settings.hooks.description.html': 'Comandos shell executados quando uma cota é reiniciada. Variáveis de ambiente: <code>CLAUDE_RESET_ID</code>, <code>CLAUDE_RESET_LABEL</code>, <code>CLAUDE_RESET_AT</code>.',
      'settings.hooks.five_hour': 'Sessão de 5 horas',
      'settings.hooks.seven_day': 'Semanal todos os modelos',
      'settings.hooks.seven_day_sonnet': 'Semanal Sonnet',
      'settings.hooks.seven_day_opus': 'Semanal Opus',
      'settings.hooks.placeholder': "ex.: powershell -c \"New-BurntToastNotification -Text 'Sessão reiniciada'\"",

      'settings.section.startup': 'Inicialização',
      'settings.startup.openAtLogin': 'Iniciar com o Windows',
      'settings.startup.openMinimized': 'Abrir oculto (apenas bandeja)',

      'settings.section.updates': 'Atualizações',
      'settings.updates.checkGitHub': 'Verificar novas versões no GitHub (uma vez por dia)',
      'settings.updates.checkNow': 'Verificar agora',
      'settings.updates.never': 'Nunca verificado.',
      'settings.updates.available': 'v{version} está disponível — veja o link no cabeçalho para baixar.',
      'settings.updates.latest': 'Você está na versão mais recente (v{version}).',
      'settings.updates.checking': 'Verificando…',

      'settings.section.about': 'Sobre',
      'settings.about.description.html': 'Lê o token OAuth de <code>~/.claude/.credentials.json</code>. A renovação do token é detectada automaticamente na próxima consulta.',
      'settings.about.openCreds': 'Abrir arquivo de credenciais',
      'settings.about.quit': 'Fechar widget',
    },
  };

  let _strings = LOCALES.en;

  function t(key, vars) {
    const str = _strings[key] !== undefined ? _strings[key] : (LOCALES.en[key] !== undefined ? LOCALES.en[key] : key);
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
  }

  function initI18n(lang) {
    _strings = LOCALES[lang] || LOCALES.en;
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = t(el.dataset.i18n);
      if (typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const val = t(el.dataset.i18nHtml);
      if (typeof val === 'string') el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const val = t(el.dataset.i18nTitle);
      if (typeof val === 'string') el.title = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const val = t(el.dataset.i18nPlaceholder);
      if (typeof val === 'string') el.placeholder = val;
    });
  }

  window.i18n = { t, initI18n, applyI18n, LOCALES };
})();
