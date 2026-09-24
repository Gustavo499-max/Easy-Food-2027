# ADR-001 — API REST em Node.js e Express

| Campo | Valor |
|---|---|
| **Status** | Aceito |
| **Data** | 2026-09-24 |
| **Autores** | Equipe EasyFood |

## Contexto
O EasyFood precisa expor operações de consulta e manutenção de restaurantes para uma interface web. A solução deve ser simples para desenvolvimento acadêmico, fácil de executar no VS Code e preparada para evolução.

## Alternativas consideradas
1. Node.js + Express
2. Java + Spring Boot
3. Python + Flask/FastAPI

## Decisão
Utilizar **Node.js com Express** para disponibilizar a API REST e servir o front-end estático.

## Justificativa
- Curva de aprendizado reduzida para uma equipe que já utiliza JavaScript.
- Mesmo ecossistema no front-end e no back-end.
- Express possui estrutura pequena e suficiente para o escopo atual.
- Fácil integração com Prisma e middlewares como CORS e JSON.

## Consequências
### Positivas
- Desenvolvimento e testes locais rápidos.
- Menos tecnologias diferentes no projeto.
- API simples de demonstrar e documentar.

### Negativas
- Exige disciplina para organizar responsabilidades conforme o projeto crescer.
- Validações e tratamento de erros precisam ser implementados explicitamente.

## Critérios de revisão
Reavaliar se o domínio crescer a ponto de exigir módulos independentes, mensageria ou requisitos de desempenho que justifiquem outra arquitetura.
