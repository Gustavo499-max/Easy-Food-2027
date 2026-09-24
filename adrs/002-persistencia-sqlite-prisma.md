# ADR-002 — Persistência local em arquivo JSON

| Campo | Valor |
|---|---|
| **Status** | Aceito |
| **Data** | 2026-09-24 |
| **Autores** | Equipe EasyFood |

## Contexto
A aplicação precisa preservar os restaurantes cadastrados entre reinicializações, mas a atividade deve continuar simples de executar em laboratório, sem exigir instalação e configuração de um servidor de banco de dados.

## Alternativas consideradas
1. Array em memória
2. Arquivo JSON
3. SQLite
4. PostgreSQL
5. MongoDB
6. Firebase

## Decisão
Persistir os restaurantes em **arquivo JSON local**, acessado pelo módulo nativo `fs/promises` do Node.js.

## Justificativa
- Não exige banco externo ou credenciais.
- Mantém os dados após reiniciar o servidor.
- Facilita a demonstração do fluxo completo no VS Code.
- O conteúdo pode ser inspecionado diretamente durante a aula.
- É suficiente para o volume e concorrência esperados no protótipo acadêmico.

## Consequências
### Positivas
- Setup muito simples.
- Persistência sem infraestrutura adicional.
- Código fácil de explicar e testar.

### Negativas
- Escritas concorrentes não são adequadas para produção.
- Consultas complexas e relacionamentos ficam limitados.
- Para crescimento real, será necessária migração para um SGBD.

## Critérios de revisão
Reavaliar ao entrar em produção, precisar de autenticação multiusuário, relacionamentos entre entidades, alto volume ou múltiplas instâncias da API.
