# Simulador AFD — Arquitetura e Lógica

Este documento descreve como o simulador de Autômatos Finitos Determinísticos (AFD) foi implementado: quais arquivos foram criados, por que as decisões foram tomadas dessa forma, e como as peças se conectam.

---

## Estrutura de arquivos criados

```
src/
├── automata/
│   └── afd.js                     # Lógica pura do autômato
├── utils/
│   └── canvasGeometry.js          # Utilitários geométricos para o canvas
├── hooks/
│   └── useSimulacaoAFD.js         # Hook de simulação passo a passo
└── pages/
    └── AFD/
        ├── AFD.jsx                # Página container (orquestra tudo)
        ├── AFD.module.css
        ├── CanvasAFD.jsx          # Renderização Konva do autômato
        ├── CanvasAFD.module.css
        ├── ControlesSimulacao.jsx # Input + botões + visualização da cadeia
        ├── ControlesSimulacao.module.css
        ├── PainelEdicaoAFD.jsx    # Painel lateral de edição
        └── PainelEdicaoAFD.module.css
```

---

## Camada 1 — Lógica pura (`src/automata/afd.js`)

### Modelo formal

O AFD é representado como um objeto JavaScript simples (sem React):

```js
{
  estados: ['q0', 'q1', 'q2'],
  alfabeto: ['0', '1'],
  transicoes: {
    q0: { '0': 'q1', '1': 'q0' },
    q1: { '0': 'q1', '1': 'q2' },
    q2: { '0': 'q1', '1': 'q0' },
  },
  estadoInicial: 'q0',
  estadosFinais: ['q2'],
}
```

Isso corresponde diretamente à tupla formal **(Q, Σ, δ, q₀, F)**:
- `estados` → Q
- `alfabeto` → Σ
- `transicoes` → δ (indexada como `transicoes[estado][símbolo]`)
- `estadoInicial` → q₀
- `estadosFinais` → F

### Função `simular(afd, entrada)`

Retorna um array de `PassoSimulacao`, onde cada elemento representa um ponto no tempo da execução:

```
[
  { estado: 'q0', posicao: 0, simboloConsumido: null },       // estado inicial
  { estado: 'q1', posicao: 1, simboloConsumido: '0' },        // após consumir '0'
  { estado: 'q2', posicao: 2, simboloConsumido: '1', aceito: true }, // fim
]
```

**Fluxo interno:**

1. Valida se todos os símbolos da entrada pertencem ao alfabeto. Se não, retorna dois passos: o inicial + um passo de erro com `{ erro: "..." }`.
2. Itera sobre cada símbolo da entrada. Se não existe transição para o símbolo no estado atual, retorna os passos até aqui + um passo de erro.
3. Ao final da cadeia, marca o último passo com `aceito: true` ou `aceito: false` dependendo de o estado atual estar em `estadosFinais`.

A função é **pura**: recebe os dados, retorna o array. Nenhum efeito colateral, nenhuma referência ao React.

### Por que separar a lógica do React?

A separação garante que a lógica do autômato possa ser testada, reutilizada e evoluída independentemente da interface. O simulador de AFND, por exemplo, poderá reusar a estrutura de `PassoSimulacao` e apenas substituir a função de simulação — sem tocar em nenhum componente React.

---

## Camada 2 — Utilitários geométricos (`src/utils/canvasGeometry.js`)

O canvas Konva trabalha com coordenadas (x, y) em pixels. Para desenhar setas entre estados de forma precisa, quatro funções foram implementadas:

### `pontoNaBorda(origem, destino, raio)`

Retorna o ponto na borda do círculo `destino` que fica na direção de `origem`. Usado para que a ponta da seta termine exatamente na borda do círculo, não no centro.

```
   origem ──────────────→ ● destino
                       ↑
              pontoNaBorda (raio antes do centro)
```

Cálculo: normaliza o vetor `origem → destino` e subtrai `raio` unidades do centro do destino.

### `calcularCurvaBezier(origem, destino, curvatura)`

Retorna o ponto de controle para curvar uma seta entre dois estados. Usado quando há transição bidirecional (A → B e B → A), para que as duas setas não se sobreponham.

O ponto de controle fica no ponto médio da linha `origem → destino`, deslocado perpendicularmente (rotação 90°) pela distância `curvatura`. Curvatura positiva e negativa resultam em curvas em lados opostos — o que garante que A→B e B→A curvem para lados diferentes com o mesmo valor de `curvatura`.

### `pontosSelfLoop(centro, raio)`

Retorna 8 valores `[x1,y1, cp1x,cp1y, cp2x,cp2y, x2,y2]` para uma cubic bezier que forma um laço acima do nó (self-loop). O início e o fim ficam na borda superior-esquerda e superior-direita do círculo; os pontos de controle ficam bem acima, criando o arco.

### `ehBidirecional(afd, origem, destino)`

Verifica se existem transições em ambos os sentidos. Usado pelo `CanvasAFD` para decidir se deve curvar as setas ou desenhá-las retas.

---

## Camada 3 — Hook de simulação (`src/hooks/useSimulacaoAFD.js`)

O hook encapsula todo o estado de "execução" da simulação, expondo uma API declarativa para o componente pai:

```js
const {
  passos, passoAtual, estadoAtivo,
  iniciar, proximo, anterior,
  play, pause, tocando, resultado, reset
} = useSimulacaoAFD(afd, entrada)
```

### Estados internos

| Estado | Tipo | Descrição |
|---|---|---|
| `passos` | `PassoSimulacao[]` | Array completo retornado por `simular()` |
| `passoAtual` | `number` | Índice do passo sendo exibido (-1 = não iniciado) |
| `tocando` | `boolean` | Se o play automático está ativo |

### Fluxo de play/pause

O play não usa `setInterval` fixo eternamente. Em vez disso:

1. `play()` seta `tocando = true`.
2. Um `useEffect` que depende de `[tocando, passos.length, passoAtual]` inicia o interval.
3. Dentro do interval, uma variável local `step` avança o passo e chama `setPassoAtual(step)`.
4. Quando `step` chega ao último passo, o interval chama `clearInterval` e seta `tocando = false` — **dentro do callback do interval, não no body do effect** (o que evitaria renderizações em cascata).
5. A mudança de `passoAtual` faz o effect re-executar (com o novo passo como base), garantindo que `step` nunca fica stale.

### Derivação de `resultado`

`resultado` é derivado a cada render, sem estado extra:

- `'parado'` — simulação não iniciada
- `'em_andamento'` — `passoAtual < passos.length - 1`
- `'aceito'` — último passo com `aceito: true`
- `'rejeitado'` — último passo com `aceito: false` ou com campo `erro`

---

## Camada 4 — Componentes visuais

### `AFD.jsx` (página container)

Responsabilidade: **orquestrar o estado global da página** e passar props para os filhos.

Estados que vive aqui:

| Estado | Descrição |
|---|---|
| `afd` | O autômato atual (começa com o exemplo "Termina em 01") |
| `layout` | Posição (x, y) de cada estado no canvas |
| `entrada` | String que o usuário quer simular |
| `modo` | Modo de interação: selecionar / adicionarEstado / adicionarTransicao / removerEstado |
| `origemTransicao` | Estado selecionado como origem no modo "adicionar transição" |

**Handlers de interação do canvas:**

- `handleMoverEstado(estado, novaPos)` — atualiza `layout` ao arrastar
- `handleClicarEstado(estado)` — comportamento varia por modo:
  - `removerEstado`: remove o estado e todas as transições de/para ele
  - `adicionarTransicao`: seleciona como origem (primeiro clique) ou abre `prompt()` para o símbolo (segundo clique)
- `handleClicarVazio(pos)` — no modo `adicionarEstado`, cria novo estado (`q0`, `q1`... primeiro índice livre) na posição do clique
- `handleDuploCliqueEstado(estado)` — alterna estado entre final/não-final em qualquer modo

### `CanvasAFD.jsx` (renderização Konva)

Responsabilidade: **desenhar o autômato** dado o estado atual; emitir eventos de interação.

**Estrutura do Stage:**
```
Stage
└── Layer
    ├── Arestas (Arrow/bezier)
    │   ├── Reta (transição simples)
    │   ├── Curva (bidirecional)
    │   └── Self-loop (cubic bezier acima do nó)
    └── Estados (Group com Circle + Text + Arrow inicial)
```

**Agrupamento de arestas:**

Antes de renderizar, as transições são agrupadas por par `(origem, destino)`:

```js
// transicoes: { q0: { '0': 'q1', '1': 'q0' } }
// resultado:
[
  { origem: 'q0', destino: 'q1', simbolos: ['0'] },
  { origem: 'q0', destino: 'q0', simbolos: ['1'] },  // self-loop
]
```

Isso permite exibir `"0, 1"` numa única seta quando dois símbolos levam ao mesmo destino.

**Drag de estados:**

O `Group` de cada estado tem `draggable={modo === 'selecionar'}`. O handler `onDragEnd` (não `onDragMove`) atualiza o layout — apenas no fim do arrasto, evitando centenas de re-renders durante o movimento.

**Prevenção de bubble de clique:**

```js
onClick={e => { e.cancelBubble = true; onClicarEstado(estado) }}
```

Sem isso, clicar em um estado acionaria também o handler do Stage (que interpreta clique em área vazia).

**Responsividade do canvas:**

Um `ResizeObserver` no container div atualiza a largura do `Stage` automaticamente. A altura é fixa em 500px.

### `ControlesSimulacao.jsx`

Responsabilidade: **input da cadeia + botões + feedback visual**.

**Visualização caractere a caractere:**

Cada caractere da cadeia é um `<span>` com classe CSS diferente dependendo do passo atual:

- `charConsumido` (esmaecido) — índice < posição atual − 1
- `charAtivo` (destacado em amarelo) — índice = posição atual − 1 (símbolo sendo consumido neste passo)
- `charNormal` — ainda não consumido

A `posicao` no `PassoSimulacao` indica quantos caracteres já foram consumidos até aquele passo.

**Desabilitação dos botões:**

| Botão | Desabilitado quando |
|---|---|
| Iniciar | Símbolo inválido na entrada, ou play ativo |
| Anterior | Não iniciado, passo 0, ou play ativo |
| Próximo | Não iniciado, último passo, ou play ativo |
| Play | Não iniciado ou já no último passo |
| Reset | Simulação não foi iniciada |

### `PainelEdicaoAFD.jsx`

Responsabilidade: **edição da estrutura do AFD** (estados, alfabeto, exemplos).

**Campo de alfabeto (input não-controlado com `key`):**

O input usa `defaultValue` em vez de `value` para permitir edição livre sem re-renders. Quando o usuário carrega um novo exemplo, o `key={afd.alfabeto.join(',')}` muda, forçando o React a remontar o input com o novo `defaultValue`. A atualização de `afd.alfabeto` ocorre apenas no `onBlur` ou `Enter`.

**Lista de estados:**

- Radio button → define estado inicial
- Checkbox → marca/desmarca como estado final

---

## Fluxo completo: do clique ao canvas

```
Usuário clica "Iniciar"
  → ControlesSimulacao chama iniciar()
  → useSimulacaoAFD chama simular(afd, entrada) → PassoSimulacao[]
  → passoAtual = 0, estadoAtivo = afd.estadoInicial

Usuário clica "Próximo"
  → useSimulacaoAFD incrementa passoAtual
  → estadoAtivo = passos[passoAtual].estado

React re-renderiza CanvasAFD com novo estadoAtivo
  → Group do estado ativo recebe fill=COR_ESTADO_ATIVO (azul)
  → texto do estado ativo recebe fill=COR_TEXTO_ATIVO (branco)

React re-renderiza ControlesSimulacao com novo passoAtual
  → charAtivo atualiza o destaque na cadeia
  → status exibe "Estado atual: qX"
```

---

## Decisões de design notáveis

**Painel à direita:** o painel de edição foi posicionado à direita do canvas. O canvas é a área principal de trabalho e fica naturalmente à esquerda; o painel lateral de ferramentas à direita segue o padrão de editores visuais (ex: Figma, VS Code).

**`prompt()` para símbolo de transição:** a especificação prevê o uso de `window.prompt()` ao criar uma transição. É simples e funcional para o escopo atual. Em versões futuras pode ser substituído por um modal próprio.

**Estrutura de arestas genérica:** as arestas são representadas como `{ origem, destino, simbolos[] }` — sem assumir que existe exatamente um símbolo por aresta. Isso facilita a reutilização do `CanvasAFD` para AFND, onde múltiplos símbolos (ou ε) podem existir na mesma aresta visual.

**Lógica nunca entra em componentes:** `src/automata/afd.js` não importa nada do React. Os componentes consomem os dados retornados pelo hook e pelo arquivo de lógica, mas nunca executam a simulação diretamente.
