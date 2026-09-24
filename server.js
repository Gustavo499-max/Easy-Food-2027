const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'restaurants.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function readRestaurants() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function saveRestaurants(restaurants) {
  await fs.writeFile(DATA_FILE, JSON.stringify(restaurants, null, 2), 'utf8');
}

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'EasyFood' }));

app.get('/restaurants', async (req, res) => {
  try {
    let restaurants = await readRestaurants();
    const { category, search, order = 'desc' } = req.query;
    if (category && category !== 'Todos') restaurants = restaurants.filter(r => r.category === category);
    if (search) restaurants = restaurants.filter(r => r.name.toLowerCase().includes(String(search).toLowerCase()));
    restaurants.sort((a, b) => order === 'asc' ? a.rating - b.rating : b.rating - a.rating);
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível listar os restaurantes.' });
  }
});

app.get('/restaurants/:id', async (req, res) => {
  const restaurants = await readRestaurants();
  const restaurant = restaurants.find(r => r.id === Number(req.params.id));
  if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado.' });
  res.json(restaurant);
});

app.post('/restaurants', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const category = String(req.body.category || '').trim();
  const rating = Number(req.body.rating);
  if (!name || !category || Number.isNaN(rating) || rating < 0 || rating > 5) {
    return res.status(400).json({ error: 'Informe nome, categoria e avaliação entre 0 e 5.' });
  }
  const restaurants = await readRestaurants();
  const nextId = restaurants.length ? Math.max(...restaurants.map(r => r.id)) + 1 : 1;
  const created = { id: nextId, name, category, rating };
  restaurants.push(created);
  await saveRestaurants(restaurants);
  res.status(201).json(created);
});

app.put('/restaurants/:id', async (req, res) => {
  const restaurants = await readRestaurants();
  const index = restaurants.findIndex(r => r.id === Number(req.params.id));
  if (index < 0) return res.status(404).json({ error: 'Restaurante não encontrado.' });
  const current = restaurants[index];
  const updated = {
    ...current,
    ...(req.body.name !== undefined && { name: String(req.body.name).trim() }),
    ...(req.body.category !== undefined && { category: String(req.body.category).trim() }),
    ...(req.body.rating !== undefined && { rating: Number(req.body.rating) })
  };
  if (!updated.name || !updated.category || Number.isNaN(updated.rating) || updated.rating < 0 || updated.rating > 5) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }
  restaurants[index] = updated;
  await saveRestaurants(restaurants);
  res.json(updated);
});

app.delete('/restaurants/:id', async (req, res) => {
  const restaurants = await readRestaurants();
  const filtered = restaurants.filter(r => r.id !== Number(req.params.id));
  if (filtered.length === restaurants.length) return res.status(404).json({ error: 'Restaurante não encontrado.' });
  await saveRestaurants(filtered);
  res.status(204).send();
});

app.get('*path', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`EasyFood disponível em http://localhost:${PORT}`));
