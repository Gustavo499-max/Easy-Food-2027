# ADR-003 — Interface web responsiva integrada à API

| Campo | Valor |
|---|---|
| **Status** | Aceito |
| **Data** | 2026-09-24 |
| **Autores** | Equipe EasyFood |

## Contexto
A aplicação precisa demonstrar visualmente a listagem, filtro e cadastro de restaurantes sem exigir um framework de front-end adicional.

## Alternativas consideradas
1. HTML, CSS e JavaScript puro
2. React
3. Vue
4. Aplicação somente via Postman

## Decisão
Criar uma interface em **HTML, CSS e JavaScript puro**, servida pelo próprio Express na pasta `public`.

## Justificativa
- Mantém o projeto pequeno e fácil de abrir no VS Code.
- Evita etapa adicional de build.
- Permite consumir a API com `fetch` diretamente.
- Facilita publicação do código e demonstração acadêmica.

## Consequências
### Positivas
- Uma única aplicação inicia API e interface.
- Menos configuração e dependências.
- Fácil entendimento do fluxo front-end → API → banco.

### Negativas
- Componentização limitada quando comparada a frameworks modernos.
- Crescimento da interface poderá exigir reorganização do JavaScript e CSS.

## Critérios de revisão
Reavaliar caso a interface ganhe autenticação, múltiplas telas complexas ou estado compartilhado significativo.
