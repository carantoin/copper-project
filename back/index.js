const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { pool, isPostgresConnected, memoryStore } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование входящих запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ===================================================
// 1. GET /api/categories — Получение списка категорий
// ===================================================
app.get('/api/categories', async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      return res.json(result.rows);
    }
    return res.json(memoryStore.categories);
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    res.status(500).json({ error: 'Не удалось получить категории' });
  }
});

// ===================================================
// 2. GET /api/products — Получение каталога товаров
// Поддерживает фильтры: ?badge=hit|new|recommended|sale&category=slug&search=text
// ===================================================
app.get('/api/products', async (req, res) => {
  const { badge, category, search } = req.query;

  try {
    if (isPostgresConnected()) {
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (badge === 'hit') {
        params.push(true);
        query += ` AND is_hit = $${params.length}`;
      } else if (badge === 'new') {
        params.push(true);
        query += ` AND is_new = $${params.length}`;
      } else if (badge === 'recommended') {
        params.push(true);
        query += ` AND is_recommended = $${params.length}`;
      } else if (badge === 'sale') {
        params.push(true);
        query += ` AND is_sale = $${params.length}`;
      }

      if (category) {
        params.push(category);
        query += ` AND category_slug = $${params.length}`;
      }

      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        query += ` AND LOWER(title) LIKE $${params.length}`;
      }

      query += ' ORDER BY id ASC';
      const result = await pool.query(query, params);
      return res.json(result.rows);
    }

    // Режим памяти
    let filtered = [...memoryStore.products];
    if (badge === 'hit') filtered = filtered.filter(p => p.is_hit);
    if (badge === 'new') filtered = filtered.filter(p => p.is_new);
    if (badge === 'recommended') filtered = filtered.filter(p => p.is_recommended);
    if (badge === 'sale') filtered = filtered.filter(p => p.is_sale);
    if (category) filtered = filtered.filter(p => p.category_slug === category);
    if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return res.json(filtered);
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    res.status(500).json({ error: 'Не удалось получить список товаров' });
  }
});

// GET /api/products/:id — Получение одного товара
app.get('/api/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  try {
    if (isPostgresConnected()) {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Товар не найден' });
      }
      return res.json(result.rows[0]);
    }

    const product = memoryStore.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    return res.json(product);
  } catch (error) {
    console.error('Ошибка при получении товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ===================================================
// 3. GET /api/reviews — Получение отзывов
// ===================================================
app.get('/api/reviews', async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await pool.query('SELECT * FROM reviews ORDER BY id ASC');
      return res.json(result.rows);
    }
    return res.json(memoryStore.reviews);
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error);
    res.status(500).json({ error: 'Не удалось получить отзывы' });
  }
});

// ===================================================
// 4. GET /api/benefits — Получение преимуществ ("Почему выбирают нас")
// ===================================================
app.get('/api/benefits', async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await pool.query('SELECT * FROM benefits ORDER BY id ASC');
      return res.json(result.rows);
    }
    return res.json(memoryStore.benefits);
  } catch (error) {
    console.error('Ошибка при получении преимуществ:', error);
    res.status(500).json({ error: 'Не удалось получить преимущества' });
  }
});

// ===================================================
// 5. GET /api/faq — Получение часто задаваемых вопросов
// ===================================================
app.get('/api/faq', async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await pool.query('SELECT * FROM faq ORDER BY id ASC');
      return res.json(result.rows);
    }
    return res.json(memoryStore.faq);
  } catch (error) {
    console.error('Ошибка при получении FAQ:', error);
    res.status(500).json({ error: 'Не удалось получить FAQ' });
  }
});

// ===================================================
// 6. POST /api/auth/register — Регистрация пользователя (с bcryptjs)
// ===================================================
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Пожалуйста, заполните имя, email и пароль' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен содержать не менее 6 символов' });
  }

  try {
    // Хэширование пароля с помощью bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (isPostgresConnected()) {
      // Проверка существования пользователя
      const checkUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (checkUser.rows.length > 0) {
        return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
      }

      const insertResult = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
        [name, email.toLowerCase(), passwordHash, 'user']
      );

      const newUser = insertResult.rows[0];
      return res.status(201).json({
        success: true,
        message: 'Регистрация прошла успешно!',
        user: newUser,
        token: `token-${newUser.id}-${Date.now()}`
      });
    }

    // Режим памяти
    const exists = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    const newUser = {
      id: memoryStore.users.length + 1,
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: 'user',
      created_at: new Date()
    };
    memoryStore.users.push(newUser);

    return res.status(201).json({
      success: true,
      message: 'Регистрация прошла успешно!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      token: `token-${newUser.id}-${Date.now()}`
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// ===================================================
// 7. POST /api/auth/login — Авторизация пользователя (с bcryptjs)
// ===================================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Введите email и пароль' });
  }

  try {
    let user = null;

    if (isPostgresConnected()) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Неверный email или пароль' });
      }
      user = result.rows[0];
    } else {
      user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(400).json({ error: 'Неверный email или пароль' });
      }
    }

    // Сравнение пароля с хэшем через bcryptjs
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    return res.json({
      success: true,
      message: 'Вы успешно вошли в систему!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: `token-${user.id}-${Date.now()}`
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
});

// ===================================================
// 8. POST /api/contact — Отправка контактной формы (POST запрос)
// ===================================================
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Пожалуйста, укажите имя, email и текст сообщения' });
  }

  try {
    if (isPostgresConnected()) {
      const result = await pool.query(
        'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, subject || 'Общий вопрос', message]
      );
      return res.status(201).json({
        success: true,
        message: 'Спасибо! Ваше сообщение успешно отправлено и сохранено в базе данных.',
        data: result.rows[0]
      });
    }

    const newMessage = {
      id: memoryStore.contacts.length + 1,
      name,
      email,
      subject: subject || 'Общий вопрос',
      message,
      created_at: new Date()
    };
    memoryStore.contacts.push(newMessage);

    return res.status(201).json({
      success: true,
      message: 'Спасибо! Ваше сообщение успешно отправлено.',
      data: newMessage
    });
  } catch (error) {
    console.error('Ошибка сохранения сообщения:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// GET /api/contact — Получение сообщений (для проверки)
app.get('/api/contact', async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await pool.query('SELECT * FROM contact_messages ORDER BY id DESC');
      return res.json(result.rows);
    }
    return res.json(memoryStore.contacts);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ===================================================
// 9. POST /api/orders — Оформление заказа из корзины (POST запрос)
// ===================================================
app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_email, customer_phone, delivery_address, items, total_amount } = req.body;

  if (!customer_name || !customer_email || !customer_phone) {
    return res.status(400).json({ error: 'Пожалуйста, заполните контактные данные для заказа' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Корзина пуста' });
  }

  try {
    const total = parseFloat(total_amount) || 0;

    if (isPostgresConnected()) {
      const orderRes = await pool.query(
        'INSERT INTO orders (customer_name, customer_email, customer_phone, delivery_address, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [customer_name, customer_email, customer_phone, delivery_address || '', total]
      );
      const orderId = orderRes.rows[0].id;

      for (const item of items) {
        await pool.query(
          'INSERT INTO order_items (order_id, product_id, title, price, quantity) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.id || null, item.title, item.price, item.quantity || 1]
        );
      }

      return res.status(201).json({
        success: true,
        message: `Заказ №${orderId} успешно оформлен! Наш менеджер свяжется с вами в ближайшее время.`,
        order_id: orderId
      });
    }

    const orderId = memoryStore.orders.length + 1;
    const newOrder = {
      id: orderId,
      customer_name,
      customer_email,
      customer_phone,
      delivery_address,
      items,
      total_amount: total,
      created_at: new Date()
    };
    memoryStore.orders.push(newOrder);

    return res.status(201).json({
      success: true,
      message: `Заказ №${orderId} успешно оформлен! Наш менеджер свяжется с вами в ближайшее время.`,
      order_id: orderId
    });
  } catch (error) {
    console.error('Ошибка оформления заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера при оформлении заказа' });
  }
});

// GET /api/orders — Список заказов
app.get('/api/orders', async (req, res) => {
  try {
    if (isPostgresConnected()) {
      const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
      return res.json(result.rows);
    }
    return res.json(memoryStore.orders);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ===================================================
// 10. GET /api/health — Состояние сервера и БД
// ===================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    postgres: isPostgresConnected() ? 'connected' : 'fallback-memory',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Запуск сервера Express
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Сервер COPPER PRO запущен на http://localhost:${PORT}`);
  console.log(`📡 API доступен по адресу: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});
