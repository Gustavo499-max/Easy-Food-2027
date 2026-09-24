# EasyFood Novo

Projeto full stack simples para cadastro e consulta de restaurantes, com interface inspirada no modelo fornecido.

## Tecnologias
- Node.js
- Express
- HTML, CSS e JavaScript
- Persistência local em JSON

## Funcionalidades
- Listagem de restaurantes
- Busca por nome
- Filtro por categoria
- Ordenação por avaliação
- Paginação visual com "Carregar mais"
- Favoritos salvos no navegador
- Cadastro de restaurantes
- API REST com GET, POST, PUT e DELETE
- Persistência dos cadastros em `data/restaurants.json`

## Como executar
1. Instale o Node.js LTS.
2. Abra a pasta no VS Code.
3. Abra o terminal integrado.
4. Execute `npm install`.
5. Execute `npm start`.
6. Abra `http://localhost:3000`.

## Endpoints
- `GET /health`
- `GET /restaurants`
- `GET /restaurants/:id`
- `POST /restaurants`
- `PUT /restaurants/:id`
- `DELETE /restaurants/:id`
