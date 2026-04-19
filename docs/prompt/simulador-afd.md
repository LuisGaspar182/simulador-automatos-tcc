Implemente a página do Simulador de AFD usando react-konva. Este é o próximo passo definido no `CLAUDE.md`.

## Antes de começar, leia:
- `CLAUDE.md` na raiz — convenções do projeto (já defini a stack, pastas, estilo, idioma).
- `package.json` — libs já instaladas.
- `src/App.jsx` — as rotas `/afd`, `/afnd`, etc já existem como redirect para `/simuladores`. Substitua o redirect de `/afd` pela nova página.
- `src/index.css` — sistema de variáveis CSS global. Use essas variáveis no CSS Module da nova página em vez de hardcodar cores/espaçamentos.
- `src/components/Layout.jsx`, `Header.jsx`, `Footer.jsx` — wrapper visual que todas as páginas usam.
- `src/pages/Home/Home.jsx` + `Home.module.css` — padrão de página como referência.
- `src/pages/Simuladores/Simuladores.jsx` — padrão de layout de card central.
- `src/pages/Conteudo/Conteudo.jsx` — referência caso queira entender como o conteúdo sobre AFD está sendo descrito.

## Convenções obrigatórias do projeto (do CLAUDE.md)
- **JavaScript puro (JSX)**, sem TypeScript. Tipos via JSDoc quando útil.
- **CSS Modules** (`Arquivo.module.css` ao lado do `.jsx`).
- **Usar variáveis CSS de `src/index.css`** em vez de hardcodar cores/espaçamentos.
- **Imports absolutos a partir de `src/`** quando possível (ex: `import Layout from 'components/Layout'`).
- **Comentários, nomes de variáveis e strings de UI em PORTUGUÊS**.
- **Componentes em PascalCase**, arquivos de lógica pura em camelCase (`afd.js`).
- **Separação estrita entre lógica e renderização**: nada de React dentro de `src/automata/`.
- **Evitar dependências novas**. As únicas a adicionar são `react-konva` e `konva`. Qualquer outra, pergunte antes.

## Dependências
Instale `react-konva` e `konva` com npm. Se já estiverem no `package.json`, pule.

## Onde colocar cada coisa

**Lógica pura (sem React):**
- `src/automata/afd.js` — modelo formal (Q, Σ, δ, q₀, F), função `simular(afd, entrada)`, AFDs de exemplo, função `validarEntrada(afd, entrada)`.

**Utilitários:**
- `src/utils/canvasGeometry.js` — `pontoNaBorda`, `calcularCurvaBezier`, `pontosSelfLoop`, `ehBidirecional`.

**Hook:**
- `src/hooks/useSimulacaoAFD.js` — gerencia passos, passo atual, play/pause/next/prev/reset.

**Página e subcomponentes (dentro de `src/pages/AFD/`):**
- `AFD.jsx` + `AFD.module.css` — página container.
- `CanvasAFD.jsx` + `CanvasAFD.module.css` — renderização do autômato em react-konva.
- `ControlesSimulacao.jsx` + `ControlesSimulacao.module.css` — input de entrada + botões de controle.
- `PainelEdicaoAFD.jsx` + `PainelEdicaoAFD.module.css` — menu lateral de edição (adicionar/remover estado, marcar final, definir inicial, modos de interação).

Observação sobre reuso: como AFND é a próxima etapa após AFD, e compartilha quase toda a estrutura visual (só muda a função de simulação e transições-ε), ao criar `CanvasAFD.jsx` tente escrever de forma que dê pra reaproveitar para AFND depois — mas **não** generalize agora. Apenas evite decisões que seriam difíceis de desfazer (ex: não assumir no código do canvas que transição é sempre determinística em termos de tipo de dado; use a estrutura `{ origem, destino, simbolo }` como lista de arestas em vez de depender direto do formato `transicoes[q][a]`).

## Modelo de dados (via JSDoc em `afd.js`)

```js
/**
 * @typedef {Object} AFD
 * @property {string[]} estados
 * @property {string[]} alfabeto
 * @property {Record<string, Record<string, string>>} transicoes
 * @property {string} estadoInicial
 * @property {string[]} estadosFinais
 */

/**
 * @typedef {Record<string, { x: number, y: number }>} Layout
 */

/**
 * @typedef {Object} PassoSimulacao
 * @property {string | null} estado
 * @property {number} posicao
 * @property {string | null} simboloConsumido
 * @property {boolean} [aceito]
 * @property {string} [erro]
 */
```

## Função de simulação (em `src/automata/afd.js`)

`simular(afd, entrada)`:
- Valida `entrada` contra `alfabeto` antes de começar. Se tiver símbolo inválido, retorna passo inicial + passo de erro.
- Se falta transição para algum símbolo em algum estado durante execução, retorna passo de erro.
- Retorna array de `PassoSimulacao` com todos os estados intermediários.
- Último passo indica `aceito: true/false`.
- Função **pura** — sem side effects, sem React.

Exportar também:
- `afdExemploTerminaEm01` — AFD de 3 estados que aceita strings binárias terminando em `01`, já com layout pronto.
- `afdExemploPar0s` — AFD que aceita strings binárias com número par de zeros, 2 estados.

## Utilitários geométricos (`src/utils/canvasGeometry.js`)
- `pontoNaBorda({x, y}, {x, y}, raio)` — interseção da linha origem→destino com a borda do círculo de destino.
- `calcularCurvaBezier({x, y}, {x, y}, curvatura)` — ponto de controle para `Line` com `bezier={true}`.
- `pontosSelfLoop({x, y}, raio)` — retorna pontos do arco acima do nó.
- `ehBidirecional(afd, origem, destino)` — `true` se existe transição em ambos os sentidos.

## Hook `useSimulacaoAFD(afd, entrada)`
Retorna `{ passos, passoAtual, estadoAtivo, iniciar, proximo, anterior, reset, play, pause, tocando, resultado }`.
- `resultado`: `'aceito' | 'rejeitado' | 'em_andamento' | 'parado'`.
- `play` dispara `setInterval` (intervalo ~700ms), avançando automaticamente; para no último passo.
- Limpa o interval no unmount e ao pausar/resetar.

## Componentes visuais

### `AFD.jsx` (página)
- Usa o `<Layout>` global (Header/Footer), seguindo o padrão das outras páginas.
- Título da página: "Simulador de AFD".
- State:
  - `afd` (começa com `afdExemploTerminaEm01`)
  - `layout` (começa com o layout do exemplo)
  - `entrada` (string do usuário)
  - `modo`: `'selecionar' | 'adicionarEstado' | 'adicionarTransicao' | 'removerEstado'`
  - `origemTransicao` (estado selecionado como origem no modo adicionar transição)
- Usa `useSimulacaoAFD` para simular.
- Layout da página: canvas ocupando a maior parte, painel de edição à esquerda ou direita, controles de simulação abaixo do canvas.

### `CanvasAFD.jsx`
Props: `afd`, `layout`, `estadoAtivo`, `modo`, `origemTransicao`, callbacks (`onMoverEstado`, `onClicarEstado`, `onClicarVazio`, `onDuploCliqueEstado`).

Renderiza `Stage` > `Layer` com:
- **Estados**: `Circle` raio 30. Estado final = dois círculos concêntricos (raio externo 30, interno 25). Estado ativo durante simulação com cor destacada (use variáveis CSS via `getComputedStyle` do container ou constantes declaradas no próprio componente — veja o que fica mais limpo).
- **Rótulo do estado**: `Text` centralizado no círculo (`q0`, `q1`...).
- **Seta do estado inicial**: `Arrow` curta vinda da esquerda do estado inicial.
- **Transições**: `Arrow` entre estados. Use `pontoNaBorda` para que a seta termine na borda do círculo, não no centro.
- **Self-loop**: arco acima do nó com `pontosSelfLoop` e `Line` com `tension`.
- **Transições bidirecionais**: se `ehBidirecional` for true, curva uma pra cima e outra pra baixo usando `calcularCurvaBezier`.
- **Rótulo da transição**: `Text` no ponto médio da aresta, deslocado perpendicularmente à linha para não ficar em cima. Quando houver múltiplos símbolos para a mesma aresta (ex: q0 → q0 com `0` e com `1`), mostre como `0, 1`.
- **Drag**: estados são `draggable`. Atualize layout só no `onDragEnd` (não em `onDragMove`).

Tamanho do Stage: ocupar largura total disponível do container, altura fixa tipo 500px. Responsivo via `ResizeObserver` no container, atualizando `width` do Stage.

### `ControlesSimulacao.jsx`
Props: `afd`, `entrada`, `setEntrada`, e o que vem do hook (`passos`, `passoAtual`, `resultado`, `iniciar`, `proximo`, `anterior`, `reset`, `play`, `pause`, `tocando`).

- Input da string com validação em tempo real (mostra aviso se tem símbolo fora do alfabeto).
- Botões: Iniciar, ⏮ Anterior, ⏭ Próximo, ▶/⏸ Play/Pause, 🔄 Reset. Desabilitar quando apropriado (ex: Próximo desabilitado se já terminou).
- Visualização da string: renderize cada caractere como span; o símbolo sendo consumido no passo atual fica destacado (ex: borda ou background colorido). Os já consumidos ficam esmaecidos.
- Status: "Estado atual: qX" e, no fim, "Cadeia aceita" (verde) ou "Cadeia rejeitada" (vermelho).

### `PainelEdicaoAFD.jsx`
Props: `afd`, `setAfd`, `modo`, `setModo`, `layout`, `setLayout`.
- Botões de modo (visualmente indicam qual está ativo): Selecionar, Adicionar Estado, Adicionar Transição, Remover Estado.
- Lista de estados com checkbox "final" e radio "inicial".
- Campo para editar alfabeto (input separado por vírgula).
- Botão "Carregar exemplo" com dropdown entre os AFDs de exemplo.
- Botão "Limpar tudo" (com confirmação).

## Interações no canvas
- Modo `selecionar`: arrastar estados atualiza layout.
- Modo `adicionarEstado`: clicar em área vazia cria novo estado com nome automático (`q0`, `q1`, ...—primeiro índice livre) na posição do clique.
- Modo `adicionarTransicao`: primeiro clique em estado marca como origem (destaque visual); segundo clique em um estado (mesmo ou outro) abre `prompt()` pedindo o símbolo; cria a transição. Clicar em área vazia cancela a seleção de origem.
- Modo `removerEstado`: clicar em estado o remove, junto de todas as transições que entram ou saem dele.
- Duplo clique em estado (em qualquer modo): alterna entre final e não-final.

## Testes manuais mínimos (do CLAUDE.md)
Antes de considerar a feature pronta, valide manualmente:

Para o AFD `afdExemploTerminaEm01` (aceita strings binárias que terminam em 01):
- Aceitar: `01`, `101`, `001`, `11101`
- Rejeitar: `0`, `1`, `10`, `11`, `010`, (vazio)

Para o AFD `afdExemploPar0s`:
- Aceitar: `` (vazio), `1`, `11`, `00`, `100`, `0011`
- Rejeitar: `0`, `10`, `0001`

Inclua esses casos no final do `afd.js` como comentário, para referência futura.

## O que NÃO fazer
- Não use TypeScript.
- Não crie CSS global novo — use CSS Modules + variáveis de `src/index.css`.
- Não coloque strings em inglês na UI.
- Não misture React com a lógica em `src/automata/`.
- Não atualize o state do React a cada `onDragMove` (use `onDragEnd`).
- Não use `localStorage`/`sessionStorage`.
- Não instale libs além de `react-konva` e `konva` sem perguntar.
- Não renomeie nem mova arquivos existentes.
- Não generalize prematuramente para AFND — só evite decisões difíceis de desfazer.

## Registro da rota
Em `src/App.jsx`, a rota `/afd` hoje redireciona para `/simuladores`. Substitua o redirect pelo componente `<AFD />`. Não mexa nas outras rotas redirect.

## Entrega
Ao final:
1. Rode `npm run dev` — deve compilar sem warnings.
2. Rode `npm run lint` (se existir).
3. Abra `/afd` e verifique:
   - AFD de exemplo renderizado com posições corretas.
   - Dá pra arrastar estados.
   - Simulação passo a passo funciona (Iniciar → Próximo repetidamente → mostra aceito/rejeitado).
   - Play/Pause funciona.
   - Adicionar estado clicando no canvas funciona.
   - Adicionar transição clicando em dois estados funciona, inclusive self-loop.
   - Remover estado funciona e remove transições associadas.
   - Todas as cadeias de teste listadas acima retornam o resultado esperado.
4. Faça commit com mensagem descritiva em português ao final, ex: "feat: implementa página do simulador AFD com canvas react-konva".

Se encontrar decisões ambíguas (posicionamento do painel à esquerda vs direita, como exatamente responsivar o canvas, etc), pergunte antes de decidir algo grande. Decisões pequenas, siga seu julgamento e me avise na entrega.
