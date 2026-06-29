const LOCALES = {
  en: {
    'tray.tooltip': 'Claude Usage Widget',
    'tray.show': 'Show widget',
    'tray.hide': 'Hide widget',
    'tray.refresh': 'Refresh now',
    'tray.settings': 'Settings…',
    'tray.iconStyle': 'Tray icon style',
    'tray.alwaysOnTop': 'Always on top',
    'tray.clickThrough': 'Click-through',
    'tray.startWithWindows': 'Start with Windows',
    'tray.getUpdate': 'Get v{latest} (you have v{current})',
    'tray.checkUpdate': 'Check for updates',
    'tray.autoCheck': 'Auto-check for updates',
    'tray.quit': 'Quit',
    'tray.style.bars': 'Bars',
    'tray.style.battery': 'Battery',
    'tray.style.gauge': 'Gauge',
    'tray.style.minimal': 'Minimal',
    'tray.style.dynamic': 'Dynamic',

    'dialog.clickThrough.title': 'Enable click-through?',
    'dialog.clickThrough.cancel': 'Cancel',
    'dialog.clickThrough.confirm': 'Enable click-through',
    'dialog.clickThrough.message': 'Click-through makes the widget invisible to mouse clicks.',
    'dialog.clickThrough.detail': "While it's on, you won't be able to drag the widget, click its buttons, or close it — clicks pass straight through to whatever is underneath.\n\nTo turn it back off, right-click the tray icon and uncheck Click-through.\n\nContinue?",

    'notify.limit': '{label} at {pct}%',
    'notify.critical': 'Critical threshold reached.',
    'notify.warn': 'Warning threshold reached.',
    'notify.upToDate': "You're up to date",
    'notify.upToDate.body': 'Running v{version} — the latest release.',
    'notify.updateFailed': 'Update check failed',
    'notify.updateFailed.body': 'Could not reach GitHub.',

    'limit.five_hour': 'Current session',
    'limit.seven_day': 'Weekly · all models',
    'limit.seven_day_sonnet': 'Weekly · Sonnet',
    'limit.seven_day_opus': 'Weekly · Opus',
    'limit.seven_day_cowork': 'Weekly · Cowork',
    'limit.cowork': 'Cowork',
    'limit.routines': 'Daily routines',
    'limit.extra_usage': 'Extra usage',
  },

  'pt-BR': {
    'tray.tooltip': 'Claude Usage Widget',
    'tray.show': 'Exibir widget',
    'tray.hide': 'Ocultar widget',
    'tray.refresh': 'Atualizar agora',
    'tray.settings': 'Configurações…',
    'tray.iconStyle': 'Estilo do ícone da bandeja',
    'tray.alwaysOnTop': 'Sempre visível',
    'tray.clickThrough': 'Clique transparente',
    'tray.startWithWindows': 'Iniciar com o Windows',
    'tray.getUpdate': 'Obter v{latest} (você tem v{current})',
    'tray.checkUpdate': 'Verificar atualizações',
    'tray.autoCheck': 'Verificar atualizações automaticamente',
    'tray.quit': 'Fechar',
    'tray.style.bars': 'Barras',
    'tray.style.battery': 'Bateria',
    'tray.style.gauge': 'Medidor',
    'tray.style.minimal': 'Mínimo',
    'tray.style.dynamic': 'Dinâmico',

    'dialog.clickThrough.title': 'Ativar clique transparente?',
    'dialog.clickThrough.cancel': 'Cancelar',
    'dialog.clickThrough.confirm': 'Ativar clique transparente',
    'dialog.clickThrough.message': 'O clique transparente torna o widget invisível aos cliques do mouse.',
    'dialog.clickThrough.detail': "Enquanto estiver ativo, não será possível arrastar o widget, clicar nos botões ou fechá-lo — os cliques passam diretamente para o que estiver abaixo.\n\nPara desativar, clique com o botão direito no ícone da bandeja e desmarque Clique transparente.\n\nContinuar?",

    'notify.limit': '{label} em {pct}%',
    'notify.critical': 'Limiar crítico atingido.',
    'notify.warn': 'Limiar de aviso atingido.',
    'notify.upToDate': 'Você está atualizado',
    'notify.upToDate.body': 'Executando v{version} — a versão mais recente.',
    'notify.updateFailed': 'Falha na verificação de atualizações',
    'notify.updateFailed.body': 'Não foi possível acessar o GitHub.',

    'limit.five_hour': 'Sessão atual',
    'limit.seven_day': 'Semanal · todos os modelos',
    'limit.seven_day_sonnet': 'Semanal · Sonnet',
    'limit.seven_day_opus': 'Semanal · Opus',
    'limit.seven_day_cowork': 'Semanal · Cowork',
    'limit.cowork': 'Cowork',
    'limit.routines': 'Rotinas diárias',
    'limit.extra_usage': 'Uso extra',
  },
};

let _strings = LOCALES.en;

function setLang(lang) {
  _strings = LOCALES[lang] || LOCALES.en;
}

function t(key, vars) {
  const str = _strings[key] !== undefined ? _strings[key] : (LOCALES.en[key] !== undefined ? LOCALES.en[key] : key);
  if (!vars || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

module.exports = { setLang, t };
