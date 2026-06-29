# Claude Usage Widget — Português (Brasil)

> **Este repositório é um fork de [projectvelox/claude-usage-widget](https://github.com/projectvelox/claude-usage-widget).**
> O objetivo deste fork é exclusivamente a **tradução da interface para Português (Brasil)**. Nenhuma funcionalidade foi alterada, adicionada ou removida em relação ao projeto original. Todo o crédito pelo desenvolvimento do aplicativo pertence ao autor original.

<p align="center">
  <img src="assets/demo.gif" width="340" alt="Demo: o widget respondendo a um tick de uso. A barra de sessão atual sobe de 42% para 91%, o ponto fica vermelho e pulsa, e uma notificação desktop dispara no limiar crítico." />
</p>

**Um widget flutuante sempre visível que mostra o uso do seu plano claude.ai em tempo real, no Windows.** Construído especificamente em torno do token OAuth que o Claude Code já mantém na sua máquina, por isso não pode ser quebrado por mudanças no Cloudflare que derrubam rastreadores baseados em cookies.

➡ **[Baixar o .exe portátil mais recente](../../releases/latest)** — ~88 MB, arquivo único, sem instalação. Testado no Windows 11.

> **Nota no primeiro uso:** o EXE não é assinado. O SmartScreen vai dizer "O Windows protegeu seu computador." Clique em **Mais informações → Executar assim mesmo**. Clique único por máquina.

> **Se seu antivírus detectar como Trojan:** é um falso positivo conhecido que afeta todo app Electron não assinado (Discord, VS Code e Notion passaram pelo mesmo antes de assinar). O sufixo `!ml` no nome da detecção significa que veio do heurístico de machine learning do Windows Defender, não de uma assinatura real. Para verificar o arquivo, compare o hash SHA256 com o `SHA256SUMS.txt` na [página de releases](../../releases/latest).

---

## Idiomas disponíveis

Este fork adiciona um sistema de internacionalização (i18n) completo. Para trocar o idioma: abra as **Configurações** (ícone de engrenagem) → seção **Idioma**.

| Idioma | Código | Status |
|---|---|---|
| English | `en` | ✅ Padrão original |
| Português (Brasil) | `pt-BR` | ✅ Tradução completa |

**O que é traduzido:**
- Toda a interface do widget (labels, botões, tooltips, estados de erro)
- Janela de configurações completa
- Menu do ícone na bandeja do sistema
- Notificações nativas do Windows
- Diálogos de confirmação
- Contagens regressivas e indicadores de tempo
- Frases do mascote Claw'd

---

## O que ele mostra

As mesmas barras de **Configurações → Uso** no claude.ai, mais coisas que eles não mostram:

- Sessão atual (janela de 5 horas)
- Semanal · todos os modelos / Sonnet / Opus / Cowork — o que seu plano expõe
- Créditos de uso extra — com o valor em dinheiro usado e o limite mensal (ex: `R$225 de R$5.000 usados`)
- Contagem regressiva de reset por limite
- Um **marcador de ritmo** em cada barra — uma linha vertical que fica vermelha quando você está consumindo mais rápido do que o timer
- Um gráfico de histórico SVG de 7 dias opcional para qualquer limite escolhido
- Notificações e hooks shell que disparam quando um limite é resetado
- Um **modo pílula / mínimo** que colapsa o widget em uma cápsula de ~156×44 px mostrando apenas o limite mais crítico
- **Claw'd**, um caranguejo mascote em pixel-art que caminha pela borda inferior do widget e reage ao seu uso
- **Verificação de atualização no app** — uma vez por dia o widget verifica o GitHub Releases e mostra um link `↑ v0.2.X` quando uma nova versão está disponível

---

## Como é diferente dos outros

> **Resumo:** É o único widget Windows que combina autenticação OAuth imune ao Cloudflare com UX flutuante sempre visível, gráfico de histórico de 7 dias, múltiplos estilos de ícone na bandeja, hooks de reset por cota, e parser com testes de snapshot.

| Funcionalidade | Este | jens-duttke | SlavomirDurej | thanoban | Usage4Claude | ClaudeMeter |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Sistema operacional | Win | Win | Win/Mac/Linux | Win | macOS | macOS |
| Auth OAuth Bearer (imune ao Cloudflare) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Widget flutuante sempre visível | ✅ | ❌ bandeja | ✅ | ❌ bandeja | ❌ barra menu | ❌ barra menu |
| Gráfico de histórico 7 dias | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Múltiplos estilos de ícone na bandeja | 4 + dinâmico | 1 | 1 | 1 | 1 | 6 |
| Ícone dinâmico (reflete estado ao vivo) | ✅ | ❌ | ❌ | ❌ | ❌ | parcial |
| Hooks shell de reset por cota | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Limiares warn + critical configuráveis com cores | ✅ | parcial | ✅ | ❌ | ✅ | ✅ |
| Notificações desktop nos limiares | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Polling adaptativo (ativo / ocioso / profundo / travado) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Atualização alinhada ao reset | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Testes de snapshot para o formato da resposta da API | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Suporte a Codex / outros provedores | planejado | ❌ | ❌ | ❌ | ✅ | ❌ |
| Interface em Português (Brasil) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Instalação

Você precisa do [Claude Code](https://claude.com/claude-code) instalado e logado, pois o widget lê o token OAuth que ele mantém em `~/.claude/.credentials.json`.

### Windows — baixar o EXE

1. Baixe o **portable .exe** mais recente em [Releases](../../releases/latest).
2. Dê duplo clique. SmartScreen → **Mais informações → Executar assim mesmo**.
3. Clique com o botão direito no ícone da bandeja para opções, ou clique na engrenagem no widget para o painel completo de configurações.

### Para desenvolvedores

```powershell
git clone https://github.com/projectvelox/claude-usage-widget
cd claude-usage-widget
npm install
npm start
```

```powershell
npm test              # testes de snapshot do parser + testes semver + geometria de display
npm run build         # EXE portátil em dist/
npm run build:installer  # instalador NSIS em dist/
```

---

## Personalize como quiser

Quase tudo sobre como o widget aparece, onde fica e quando te interrompe é configurável pelo ícone de engrenagem — sem editar arquivos de configuração.

<p align="center">
  <img src="assets/settings.png" width="720" alt="O painel completo de configurações: Layout, Aparência, Ícone da bandeja, Gráfico de histórico, Limiares, Notificações, Hooks de reset, Inicialização e Sobre." />
</p>

### Layout

Quatro modos de densidade, troque a qualquer momento:

- **Expandido** — experiência completa: cabeçalho, barras, contagens regressivas, marcadores de ritmo, gráfico de histórico opcional.
- **Compacto** — cabeçalho + barras, contagens ocultas.
- **Essencial** — espaçamento mais apertado, rodapé oculto, fontes menores.
- **Mínimo (pílula)** — cápsula única mostrando o % do limite mais crítico. ~156×44 px. Clique na seta para expandir.

  <p align="center">
    <img src="assets/demo-pill.gif" width="320" alt="Modo pílula animando de 30% (verde) passando por 78% (amarelo aviso) até 91% (vermelho crítico), depois resetando." />
  </p>

Além disso: sempre visível, clique transparente opcional, mostrar/ocultar cabeçalho, marcador de ritmo, badge de dados desatualizados, contagem regressiva.

### Aparência

<p align="center">
  <img src="assets/themes.png" width="640" alt="O widget renderizado nos temas Escuro e Claro lado a lado." />
</p>

- **Tema:** Sistema / Escuro / Claro, segue o SO por padrão.
- **Cor de destaque:** qualquer hex — recolore as barras, pontos e medidor.
- **Opacidade:** 40 – 100%, para o widget ficar discreto sobre outras janelas.
- **Arredondamento:** 0 – 28 px (cantos retos a totalmente arredondados).
- **Tamanho da fonte:** 85 – 160%, com família de fonte personalizada opcional.
- **Desfoque de fundo:** ativa/desativa o efeito de vidro fosco.

### Ícone da bandeja

<p align="center">
  <img src="assets/trays.png" width="720" alt="Cinco estilos de ícone da bandeja: Barras, Bateria, Medidor, Mínimo e Dinâmico." />
</p>

Cinco estilos, todos redesenhados ao vivo conforme o uso muda:

- **Barras** — três barras empilhadas.
- **Bateria** — nível de carga espelha o pior limite.
- **Medidor** — arco de progresso circular.
- **Mínimo** — ponto colorido por severidade.
- **Dinâmico** — escolhe a representação certa e colore pelo pior limite ao vivo.

### Gráfico de histórico

<p align="center">
  <img src="assets/history.png" width="360" alt="O widget com o gráfico de histórico de 7 dias expandido: uma sparkline SVG suave com a sombra abaixo." />
</p>

Ative/desative. Escolha qualquer limite para plotar — 7 dias de amostras, desenhadas como sparkline SVG dentro do widget.

### Claw'd, o caranguejo mascote

<p align="center">
  <img src="assets/claw-d.png" width="900" alt="Quatro painéis mostrando o Claw'd em cada humor: ok (laranja, passeio casual), aviso (amarelo com gota de suor), crítico (vermelho com pontos de exclamação), e pausado (cinza, dormindo com Z flutuante)." />
</p>

Um caranguejo em pixel-art inspirado no mascote do Claude. Ele caminha de um lado para o outro na borda inferior do widget e seu humor espelha o pior limite:

| Humor | Gatilho | O que ele faz |
|---|---|---|
| **ok** | pior limite < 75% | Caminhada casual de 14 segundos. Laranja Anthropic. |
| **aviso** | 75% – 90% | Trote apressado de 8 segundos com balanço lateral. Gota de suor azul acima da cabeça. |
| **crítico** | ≥ 90% | Corrida em pânico — saltos ansiosos e inclinação do corpo. Três "!" vermelhos flutuam. |
| **pausado** | rate-limited ≥ 2 min | Dormindo. Corpo curvado, olhos fechados, três Zs escalonados flutuam. |

Ele também reage à interação:

- **Clique nele** para fazê-lo pular.
- **Clique nele enquanto dorme** e você recebe um balão de fala ranzinza (`"Mais 5 minutos…"`, `"Humph."`, `"Grosseria."`, etc.).
- Quando uma cota é resetada, ele para de andar e acena de um lado para o outro por ~1,6s.

Ative/desative em **Configurações → Layout → "Exibir o Claw'd"**.

### Limiares e notificações

<p align="center">
  <img src="assets/thresholds.png" width="720" alt="O widget renderizado em três estados de severidade lado a lado: OK (verde), Aviso (amarelo) e Crítico (vermelho)." />
</p>

- **Aviso %** e **Crítico %** (padrões: 75 / 90) — controla quando as barras mudam de cor e quando as notificações disparam.
- **Cores por estado** para OK / aviso / crítico — totalmente personalizáveis.
- **Notificações desktop nativas** no nível de aviso (opcional) e crítico (ativo por padrão).

### Hooks de reset (usuários avançados)

Execute qualquer comando shell quando uma janela de cota específica for reiniciada. O comando recebe estas variáveis de ambiente:

- `CLAUDE_RESET_ID` — qual limite foi resetado (ex: `seven_day_sonnet`)
- `CLAUDE_RESET_LABEL` — o rótulo legível por humanos
- `CLAUDE_RESET_AT` — o novo timestamp de reset

Útil para: enviar notificação para o Slack, disparar um script de "novo começo", iniciar um job em lote que estava aguardando a cota.

### Inicialização

- **Iniciar com o Windows** — registra o widget como item de login.
- **Abrir oculto** — inicializa direto na bandeja do sistema, sem popup do widget na inicialização.

---

As configurações persistem em `%APPDATA%\claude-usage-widget\config.json`; as amostras de histórico em `%APPDATA%\claude-usage-widget\history.json`.

---

## Autenticação — e o que não tocamos

O widget lê o token de acesso OAuth que o Claude Code já mantém. Não há login separado, nenhum scraping de cookie do navegador, nenhum problema com Cloudflare.

Se o token expirar:

1. O widget mostra um badge `auth`.
2. Na próxima consulta, ele relê o arquivo de credenciais. Se o Claude Code (ou outra sessão concorrente) tiver renovado o token, o novo valor é usado imediatamente.
3. Se o token estiver realmente expirado, execute `claude` no terminal para renovar, e o widget se atualiza na próxima consulta.

O token é enviado apenas para `https://api.anthropic.com/api/oauth/usage` — o endpoint oficial da Anthropic, e nada mais.

---

## Estrutura de arquivos

```
src/
  main.js       Processo principal do Electron, IPC, bandeja, itens de login, hooks de reset
  preload.js    Ponte isolada entre renderer e main
  usage.js      Fetch OAuth Bearer, normalizar, retry de auth no 401
  poller.js     Polling adaptativo, detecção de reset, backoff
  history.js    Store de amostras append-only, trim de 7 dias
  config.js     Configurações persistidas + deep merge
  i18n.js       Sistema de traduções (main process)
  icon.js       Encoder PNG puro Node.js + 4 estilos de ícone + medidor dinâmico
  updater.js    Verificação diária no GitHub Releases, comparação semver, feed do badge
  geom.js       Helpers de sobreposição de rect para resgatar o widget quando um monitor desconecta
renderer/
  i18n.js                          Sistema de traduções (renderer) — EN e PT-BR
  widget.html / .css / .js         Widget flutuante sempre visível + gráfico de histórico SVG
  settings.html / .css / .js       Painel de configurações com edição ao vivo
  demo.html                        Clone do widget para captura de GIF
  demo-pill.html                   Clone do modo pílula para o GIF da pílula
assets/
  claw-d-states.html               Prévia dos estados do Claw'd (abra em qualquer navegador)
tests/
  normalize.test.js    Testes de snapshot contra o formato de resposta ao vivo
  updater.test.js      Parsing semver + comparação para verificação no GitHub Releases
  geom.test.js         Matemática de sobreposição de rect para resgate de monitor desconectado
scripts/
  launch.js             Remove ELECTRON_RUN_AS_NODE antes de iniciar a GUI
  build-icon.js         Pré-gera ícones da bandeja, janela e prévia
  build-demo-gif.js     Captura headless do Electron + gifenc → assets/demo.gif
  ...
```

---

## Roadmap

- Switcher de múltiplas contas / organizações
- Uso do Codex ao lado do Claude
- Linha de projeção de esgotamento no gráfico de histórico
- Builds para Mac e Linux no mesmo workflow de CI
- Binário Windows assinado via SignPath OSS
- Distribuição via `winget install`

---

## Changelog

[CHANGELOG.md](CHANGELOG.md) é regerado automaticamente do histórico git a cada push para `main`. Notas por release (com links de download) ficam na [página de Releases](../../releases).

---

## Contribuindo

PRs são bem-vindos — por favor leia [CONTRIBUTING.md](CONTRIBUTING.md) primeiro. Problemas de segurança passam pelo [SECURITY.md](SECURITY.md), não pelo issue tracker público.

---

## Licença

[MIT](LICENSE).

---

## Créditos

**Todo o desenvolvimento, arquitetura e funcionalidade deste aplicativo são obra do autor original:**

> **Joshua Ricarder Oducado** — [projectvelox/claude-usage-widget](https://github.com/projectvelox/claude-usage-widget)

Este fork não altera nenhuma funcionalidade do projeto original. A única contribuição aqui é a **tradução da interface para o Português do Brasil (pt-BR)**, tornando o aplicativo acessível a usuários lusófonos.

Se você achou este aplicativo útil, por favor dê uma ⭐ estrela no [repositório original](https://github.com/projectvelox/claude-usage-widget) e considere apoiar o autor original.

Padrões emprestados de outros projetos da comunidade (créditos do projeto original):

| Padrão | De |
|---|---|
| Auth OAuth Bearer de `~/.claude/.credentials.json` | jens-duttke/usage-monitor-for-claude |
| Tiers de polling adaptativo + debounce de 10s | jens-duttke + f-is-h/Usage4Claude |
| Honrar `Retry-After`, backoff exponencial, badge de dados desatualizados | jens-duttke |
| Releitura de credenciais no 401 | projectvelox/claude-usage-widget |
| Re-afirmação de sempre visível a cada 30s | niccolo-sabato/claude-usage-widget |
| Layout compacto "Essential" | niccolo-sabato |
| Temas Claro/Escuro/Sistema, cabeçalho arrastável | SlavomirDurej/claude-usage-widget |
| Limiares warn/critical configuráveis + notificações nativas | eddmann/ClaudeMeter |
| Marcador de ritmo / indicador de taxa de consumo | jens-duttke + eddmann |
| Hook shell `on_reset_command` por cota | jens-duttke |
| Múltiplos estilos de ícone na bandeja | eddmann/ClaudeMeter |
