# EasyFood Mobile — versão integrada

Esta versão preserva a interface mobile original do EasyFood (layout de celular, cabeçalho, busca, categorias, cards, favoritos e navegação inferior) e integra as funcionalidades solicitadas.

## Funcionalidades
- Cadastro e login com senha protegida por bcryptjs e autenticação JWT.
- Perfil do usuário autenticado e upload de avatar.
- Listagem, busca, filtro, favoritos e cadastro de restaurantes.
- Clique em um card de restaurante para abrir seu cardápio.
- Cadastro de pratos dentro do restaurante selecionado.
- Upload opcional de imagem JPG, PNG ou WEBP para cada prato (máximo 5 MB).
- Dados persistidos em arquivos JSON.

## Executar
Requer Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

## Demonstração
1. Abra **Perfil** ou toque no avatar e crie uma conta.
2. Faça login.
3. Use o botão **+** na navegação inferior para cadastrar restaurante.
4. Toque no card de um restaurante para abrir o cardápio.
5. Toque em **Adicionar prato**, preencha os dados e selecione uma imagem.
6. Abra **Perfil** e envie uma foto de perfil.

## Persistência
- `data/restaurants.json`: restaurantes.
- `data/users.json`: usuários e hashes de senha.
- `data/dishes.json`: pratos associados ao restaurante e ao usuário.
- `uploads/profiles`: fotos de perfil.
- `uploads/dishes`: fotos dos pratos.

A chave JWT padrão é apenas para desenvolvimento local. Configure `JWT_SECRET` com uma chave forte antes de qualquer implantação. Esta versão utiliza armazenamento local JSON e é destinada a demonstração acadêmica, não a produção multiusuário.
