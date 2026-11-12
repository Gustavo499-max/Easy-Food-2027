const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'easyfood-dev-secret-change-before-production';

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const FILES = {
  restaurants: path.join(DATA_DIR, 'restaurants.json'),
  users: path.join(DATA_DIR, 'users.json'),
  dishes: path.join(DATA_DIR, 'dishes.json')
};

for (const dir of [DATA_DIR, path.join(UPLOAD_DIR, 'profiles'), path.join(UPLOAD_DIR, 'dishes')]) {
  fs.mkdirSync(dir, { recursive: true });
}
for (const file of Object.values(FILES)) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf8');
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(ROOT, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

async function readData(file) {
  const parsed = JSON.parse(await fsp.readFile(file, 'utf8'));
  return Array.isArray(parsed) ? parsed : [];
}
async function saveData(file, value) {
  const temp = `${file}.tmp`;
  await fsp.writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
  await fsp.rename(temp, file);
}
function nextId(items) {
  return items.length ? Math.max(...items.map(item => Number(item.id) || 0)) + 1 : 1;
}
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, avatar: user.avatar || null };
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Faça login para continuar.' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
  }
}

const mimeExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};
function uploader(folder, fieldName) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_DIR, folder)),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${mimeExtensions[file.mimetype] || ''}`)
  });
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!mimeExtensions[file.mimetype]) return cb(new Error('Formato não permitido. Envie JPG, PNG ou WEBP.'));
      cb(null, true);
    }
  }).single(fieldName);
}
const uploadAvatar = uploader('profiles', 'avatar');
const uploadDishImage = uploader('dishes', 'image');

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'EasyFood' }));

// Autenticação
app.post('/auth/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || !password) return res.status(400).json({ error: 'Preencha nome, e-mail e senha.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
    if (password.length < 6) return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    const users = await readData(FILES.users);
    if (users.some(user => user.email === email)) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    const user = {
      id: nextId(users), name, email,
      passwordHash: await bcrypt.hash(password, 10),
      avatar: null, createdAt: new Date().toISOString()
    };
    users.push(user);
    await saveData(FILES.users, users);
    res.status(201).json({ message: 'Conta criada com sucesso.', user: publicUser(user) });
  } catch (error) {
    console.error('register:', error);
    res.status(500).json({ error: 'Não foi possível criar a conta.' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const users = await readData(FILES.users);
    const user = users.find(item => item.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Login realizado com sucesso.', token, user: publicUser(user) });
  } catch (error) {
    console.error('login:', error);
    res.status(500).json({ error: 'Não foi possível realizar o login.' });
  }
});

app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const users = await readData(FILES.users);
    const user = users.find(item => item.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(publicUser(user));
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível consultar o perfil.' });
  }
});

app.post('/users/me/avatar', authenticateToken, (req, res, next) => {
  uploadAvatar(req, res, async error => {
    if (error) return next(error);
    try {
      if (!req.file) return res.status(400).json({ error: 'Selecione uma imagem.' });
      const users = await readData(FILES.users);
      const index = users.findIndex(item => item.id === req.user.id);
      if (index < 0) {
        await fsp.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      const previous = users[index].avatar;
      users[index].avatar = `/uploads/profiles/${req.file.filename}`;
      await saveData(FILES.users, users);
      if (previous && previous.startsWith('/uploads/profiles/')) {
        await fsp.unlink(path.join(UPLOAD_DIR, 'profiles', path.basename(previous))).catch(() => {});
      }
      res.json({ message: 'Foto de perfil atualizada.', avatar: users[index].avatar });
    } catch (err) {
      if (req.file) await fsp.unlink(req.file.path).catch(() => {});
      next(err);
    }
  });
});

// Restaurantes: rotas mantidas e compatíveis com a versão original
app.get('/restaurants', async (req, res) => {
  try {
    let restaurants = await readData(FILES.restaurants);
    const { category, search, order = 'desc' } = req.query;
    if (category && category !== 'Todos') restaurants = restaurants.filter(item => item.category === category);
    if (search) restaurants = restaurants.filter(item => String(item.name).toLowerCase().includes(String(search).toLowerCase()));
    restaurants.sort((a, b) => order === 'asc' ? a.rating - b.rating : b.rating - a.rating);
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível listar os restaurantes.' });
  }
});

app.get('/restaurants/:id', async (req, res) => {
  try {
    const restaurants = await readData(FILES.restaurants);
    const restaurant = restaurants.find(item => item.id === Number(req.params.id));
    if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado.' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível consultar o restaurante.' });
  }
});

app.post('/restaurants', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const category = String(req.body.category || '').trim();
    const rating = Number(req.body.rating);
    if (!name || !category || !Number.isFinite(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Informe nome, categoria e avaliação entre 0 e 5.' });
    }
    const restaurants = await readData(FILES.restaurants);
    const created = { id: nextId(restaurants), name, category, rating };
    restaurants.push(created);
    await saveData(FILES.restaurants, restaurants);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível cadastrar o restaurante.' });
  }
});

app.put('/restaurants/:id', async (req, res) => {
  try {
    const restaurants = await readData(FILES.restaurants);
    const index = restaurants.findIndex(item => item.id === Number(req.params.id));
    if (index < 0) return res.status(404).json({ error: 'Restaurante não encontrado.' });
    const updated = {
      ...restaurants[index],
      ...(req.body.name !== undefined && { name: String(req.body.name).trim() }),
      ...(req.body.category !== undefined && { category: String(req.body.category).trim() }),
      ...(req.body.rating !== undefined && { rating: Number(req.body.rating) })
    };
    if (!updated.name || !updated.category || !Number.isFinite(updated.rating) || updated.rating < 0 || updated.rating > 5) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }
    restaurants[index] = updated;
    await saveData(FILES.restaurants, restaurants);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível atualizar o restaurante.' });
  }
});

app.delete('/restaurants/:id', async (req, res) => {
  try {
    const restaurants = await readData(FILES.restaurants);
    const filtered = restaurants.filter(item => item.id !== Number(req.params.id));
    if (filtered.length === restaurants.length) return res.status(404).json({ error: 'Restaurante não encontrado.' });
    await saveData(FILES.restaurants, filtered);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível excluir o restaurante.' });
  }
});

// Pratos vinculados a um restaurante e ao usuário que os cadastrou
app.get('/dishes', async (req, res) => {
  try {
    let dishes = await readData(FILES.dishes);
    if (req.query.restaurantId) dishes = dishes.filter(item => item.restaurantId === Number(req.query.restaurantId));
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível listar os pratos.' });
  }
});

app.post('/dishes', authenticateToken, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const category = String(req.body.category || '').trim();
    const price = Number(req.body.price);
    const restaurantId = Number(req.body.restaurantId);
    if (!name || !description || !category || !Number.isFinite(price) || price <= 0 || !Number.isInteger(restaurantId)) {
      return res.status(400).json({ error: 'Preencha nome, descrição, categoria, preço e restaurante.' });
    }
    const restaurants = await readData(FILES.restaurants);
    if (!restaurants.some(item => item.id === restaurantId)) {
      return res.status(400).json({ error: 'Restaurante selecionado não existe.' });
    }
    const dishes = await readData(FILES.dishes);
    const dish = {
      id: nextId(dishes), name, description, category, price, restaurantId,
      image: null, userId: req.user.id, createdAt: new Date().toISOString()
    };
    dishes.push(dish);
    await saveData(FILES.dishes, dishes);
    res.status(201).json({ message: 'Prato cadastrado com sucesso.', dish });
  } catch (error) {
    console.error('create dish:', error);
    res.status(500).json({ error: 'Não foi possível cadastrar o prato.' });
  }
});

app.post('/dishes/:id/image', authenticateToken, (req, res, next) => {
  uploadDishImage(req, res, async error => {
    if (error) return next(error);
    try {
      if (!req.file) return res.status(400).json({ error: 'Selecione uma imagem.' });
      const dishes = await readData(FILES.dishes);
      const index = dishes.findIndex(item => item.id === Number(req.params.id));
      if (index < 0) {
        await fsp.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ error: 'Prato não encontrado.' });
      }
      if (dishes[index].userId !== req.user.id) {
        await fsp.unlink(req.file.path).catch(() => {});
        return res.status(403).json({ error: 'Você não tem permissão para alterar este prato.' });
      }
      const previous = dishes[index].image;
      dishes[index].image = `/uploads/dishes/${req.file.filename}`;
      await saveData(FILES.dishes, dishes);
      if (previous && previous.startsWith('/uploads/dishes/')) {
        await fsp.unlink(path.join(UPLOAD_DIR, 'dishes', path.basename(previous))).catch(() => {});
      }
      res.json({ message: 'Imagem do prato atualizada.', dish: dishes[index] });
    } catch (err) {
      if (req.file) await fsp.unlink(req.file.path).catch(() => {});
      next(err);
    }
  });
});

// Erros de upload e demais erros
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'A imagem deve ter no máximo 5 MB.' });
  }
  res.status(400).json({ error: error.message || 'Ocorreu um erro na solicitação.' });
});

// Aplicação web
app.get('*path', (_req, res) => res.sendFile(path.join(ROOT, 'public', 'index.html')));

app.listen(PORT, () => console.log(`EasyFood disponível em http://localhost:${PORT}`));
