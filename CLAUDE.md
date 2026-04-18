# Simulador de Autômatos e Máquinas de Turing

Projeto de TCC em Engenharia de Computação — UNIFEI Campus Itabira.

**Autor:** Luís Gaspar da Cruz
**Orientador:** Prof. Dr. Rafael Francisco dos Santos
**Disciplina relacionada:** ECOI13 — Teoria da Computação

---

## Objetivo do projeto

Desenvolver uma ferramenta web educacional para auxiliar o aprendizado de autômatos e máquinas de Turing, centralizando conteúdo teórico e simulações interativas em uma plataforma acessível via navegador, sem necessidade de instalação local.

A ferramenta deve suportar simulação de:

- Autômatos Finitos Determinísticos (AFD)
- Autômatos Finitos Não Determinísticos (AFND)
- Autômatos de Pilha Determinísticos (APD)
- Autômatos de Pilha Não Determinísticos (APND)
- Máquinas de Turing determinísticas de fita única, com lado esquerdo limitado

Além de páginas de menu e uma página de conteúdo teórico com manual de uso.

---

## Stack técnica

- **Build/dev server:** Vite
- **Framework:** React (JavaScript, não TypeScript por enquanto)
- **Renderização dos autômatos:** react-konva (Canvas)
- **Roteamento:** react-router-dom
- **Versionamento:** Git + GitHub
- **Ambiente:** Ubuntu, Node.js 20+

Sem backend na fase inicial. Tudo roda no cliente.

---

## Estrutura de pastas

```
src/
├── components/       # Componentes reutilizáveis (Header, Footer, botões, etc)
├── pages/            # Uma pasta por página de alto nível
│   ├── Home/
│   ├── Simuladores/  # Menu de simuladores
│   ├── Conteudo/     # Página teórica + manual
│   ├── AFD/
│   ├── AFND/
│   ├── APD/
│   ├── APND/
│   └── MaquinaTuring/
├── automata/         # Lógica pura dos autômatos (sem React)
│   ├── afd.js
│   ├── afnd.js
│   ├── apd.js
│   ├── apnd.js
│   └── turing.js
├── hooks/            # Custom hooks React
├── utils/            # Funções auxiliares
├── App.jsx           # Rotas
└── main.jsx
docs/                 # PDF do plano de trabalho e materiais de referência
```

---

## Páginas previstas (conforme plano de trabalho)

| Página | Função | Elementos principais |
|---|---|---|
| Menu | Estrutura de navegação inicial | Botões de link para outras páginas |
| Simuladores | Menu específico de simuladores | Botões para cada tipo de autômato |
| Simulação AFD/AFND | Criar e simular autômato finito | Canvas com estados/transições, menu lateral, campo de entrada, resultado |
| Simulação APD/APND | Criar e simular autômato de pilha | Canvas + visualização da pilha em tempo real |
| Simulação Máquina de Turing | Criar e simular MT | Canvas + visualização da fita com cabeçote |
| Conteúdo | Material teórico + manual | Texto explicativo sobre autômatos, MT e uso da ferramenta |

---

## Princípios de design

- **Consistência visual entre páginas:** header e footer iguais em todas; menus (Simuladores e Conteúdo) compartilham estrutura, mudando só o título.
- **Interface limpa e intuitiva.** Referência é o JFLAP, mas resolvendo as críticas do plano: interface moderna, responsiva, acessível em dispositivos móveis.
- **Separação estrita entre lógica e renderização.** A lógica do autômato (pasta `automata/`) não deve conhecer React. Os componentes só consomem essa lógica e desenham.

---

## Convenções de código

- Componentes em PascalCase, um arquivo por componente (`MenuSimuladores.jsx`).
- Arquivos de lógica pura em camelCase (`afd.js`).
- Imports absolutos a partir de `src/` quando possível.
- Comentários e nomes de variáveis em **português** (é um projeto acadêmico em português, alinhado com o texto do TCC).
- Strings visíveis ao usuário sempre em português.
- Evitar dependências desnecessárias. Antes de adicionar uma lib nova, verificar se dá pra resolver com o que já existe.

---

## Modelos formais — referência rápida

Para guiar a implementação da pasta `automata/`:

- **AFD:** tupla (Q, Σ, δ, q₀, F) com δ: Q × Σ → Q
- **AFND:** δ: Q × Σ → P(Q), permite transições-ε
- **APD:** (Q, Σ, Γ, δ, q₀, Z₀, F) com pilha, δ determinística
- **APND:** mesma tupla do APD mas com δ retornando conjunto
- **MT (determinística, fita única, esquerda limitada):** (Q, Σ, Γ, δ, q₀, qaccept, qreject), δ: Q × Γ → Q × Γ × {L, R}

---

## Fluxo de trabalho com Claude Code

- Implementar uma página/funcionalidade por vez. Ordem sugerida: Menu → Conteúdo → AFD → AFND → APD → APND → MT.
- Commitar ao final de cada funcionalidade estável, com mensagem descritiva em português.
- Antes de mexer em lógica de autômato, escrever/atualizar testes manuais mínimos (cadeias que devem ser aceitas e rejeitadas).
- Preservar a estrutura de pastas descrita acima. Se precisar adicionar uma pasta nova, atualizar este `CLAUDE.md` junto.

---

## Estado atual

Projeto recém-iniciado. Ambiente configurado com Vite + React. Próximo passo: criar estrutura de rotas e implementar as páginas de Menu e Conteúdo.

---

## Referências do plano de trabalho

O PDF completo do plano está em `docs/TCC_1___Lui_s_Gaspar_da_Cruz_FINAL.pdf` (se já tiver sido copiado pra lá). Ele contém os esboços visuais das telas feitos no Figma, que devem guiar a implementação das interfaces.
