const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'copper_db',
  connectionTimeoutMillis: 3000
});

let isPostgresConnected = false;

// Встроенные данные на случай, если PostgreSQL временно не запущен (Fallback Memory Store)
const memoryStore = {
  users: [
    {
      id: 1,
      name: 'Иван Иванов',
      email: 'user@example.com',
      password_hash: bcrypt.hashSync('123456', 10),
      role: 'user',
      created_at: new Date()
    },
    {
      id: 2,
      name: 'Администратор',
      email: 'admin@copperpro.com',
      password_hash: bcrypt.hashSync('123456', 10),
      role: 'admin',
      created_at: new Date()
    }
  ],
  categories: [
    { id: 1, title: 'Для эфирных масел', slug: 'essential-oils', image_url: 'images/cat-1.jpg', badge: null },
    { id: 2, title: 'Для гидролатов', slug: 'hydrolats', image_url: 'images/cat-2.jpg', badge: null },
    { id: 3, title: 'Медная посуда', slug: 'copper-cookware', image_url: 'images/cat-3.jpg', badge: null },
    { id: 4, title: 'Аксессуары из меди', slug: 'accessories', image_url: 'images/cat-4.jpg', badge: null },
    { id: 5, title: 'Индивидуальный заказ', slug: 'custom-order', image_url: 'images/cat-5.jpg', badge: null },
    { id: 6, title: 'Скидки и предложения', slug: 'discounts', image_url: 'images/cat-6.jpg', badge: '-30% -50% -80%' }
  ],
  products: [
    { id: 1, title: 'Дистиллятор для эфирных масел', category_slug: 'essential-oils', price: 4906.00, old_price: null, is_hit: true, is_new: false, is_recommended: false, is_sale: false, image_url: 'images/hero-distiller.jpg', description: 'Профессиональный медный дистиллятор ручной работы для получения чистейших эфирных масел.' },
    { id: 2, title: 'Медный чайник с фарфоровой ручкой', category_slug: 'copper-cookware', price: 1953.00, old_price: null, is_hit: true, is_new: false, is_recommended: true, is_sale: false, image_url: 'images/prod-3.jpg', description: 'Классический медный чайник с удобной фарфоровой термостойкой ручкой.' },
    { id: 3, title: 'Дистиллятор колонный "Премиум"', category_slug: 'essential-oils', price: 3450.00, old_price: null, is_hit: true, is_new: false, is_recommended: true, is_sale: false, image_url: 'images/prod-1.jpg', description: 'Высокоточная перегонная колонна из меди для тонкой дистилляции.' },
    { id: 4, title: 'Аламбик шарантский медный', category_slug: 'hydrolats', price: 4120.00, old_price: null, is_hit: true, is_new: false, is_recommended: false, is_sale: false, image_url: 'images/prod-2.jpg', description: 'Традиционный шарантский аламбик для цветочных гидролатов и ароматов.' },
    { id: 5, title: 'Медный чайник с фарфоровой ручкой (Акция)', category_slug: 'copper-cookware', price: 1953.00, old_price: 2450.00, is_hit: false, is_new: true, is_recommended: false, is_sale: true, image_url: 'images/prod-3.jpg', description: 'Чайник по специальной цене ограниченной серии со скидкой.' },
    { id: 6, title: 'Аппарат для гидролатов "Люкс"', category_slug: 'hydrolats', price: 2890.00, old_price: null, is_hit: false, is_new: true, is_recommended: false, is_sale: false, image_url: 'images/prod-2.jpg', description: 'Новинка сезона с улучшенной системой конденсации и охлаждения.' },
    { id: 7, title: 'Колонный дистиллятор "Мастер"', category_slug: 'essential-oils', price: 3700.00, old_price: null, is_hit: false, is_new: true, is_recommended: true, is_sale: false, image_url: 'images/prod-1.jpg', description: 'Универсальное оборудование для домашнего и полупрофессионального применения.' },
    { id: 8, title: 'Медный чайник с фарфоровой ручкой (Black Edition)', category_slug: 'copper-cookware', price: 1953.00, old_price: 2300.00, is_hit: false, is_new: false, is_recommended: true, is_sale: true, image_url: 'images/prod-3.jpg', description: 'Медный чайник с черной отделкой и благородной патиной.' },
    { id: 9, title: 'Медный аламбик с термометром', category_slug: 'essential-oils', price: 5200.00, old_price: 6100.00, is_hit: false, is_new: false, is_recommended: false, is_sale: true, image_url: 'images/prod-2.jpg', description: 'Полный комплект со встроенным биметаллическим термометром.' },
    { id: 10, title: 'Медный фильтр-дефлегматор', category_slug: 'accessories', price: 1450.00, old_price: 1950.00, is_hit: false, is_new: false, is_recommended: false, is_sale: true, image_url: 'images/cat-4.jpg', description: 'Аксессуар из меди высокой степени очистки М1.' }
  ],
  reviews: [
    { id: 1, author_name: 'Иван Иванов', date_text: '20.10.21', content: 'Наше оборудование производится вручную. Мы постоянно производим контроль качества произведенной продукции. В то же время если в ходе транспортировки или эксплуатации в течение первых 2 лет произойдет поломка, мы всегда находим с клиентом наиболее удобный вариант решения вопроса.', avatar_url: 'images/avatar-user.jpg' },
    { id: 2, author_name: 'Елена Смирнова', date_text: '15.11.21', content: 'Заказывала аламбик для эфирных масел лаванды. Качество меди и соединений просто поразительное! Всё работает безукоризненно, очень довольна покупкой и сервисом.', avatar_url: 'images/avatar-user.jpg' },
    { id: 3, author_name: 'Михаил Коваль', date_text: '02.12.21', content: 'Прекрасный медный чайник с фарфоровой ручкой. Держит тепло невероятно долго, выглядит на плите как настоящее произведение искусства. Рекомендую!', avatar_url: 'images/avatar-user.jpg' }
  ],
  benefits: [
    { id: 1, title: 'Аутентичность', description: 'Наше перегонное оборудование используется для получения эфирных масел с незапамятных времен.', icon_type: 'authenticity' },
    { id: 2, title: 'Изысканность', description: 'Наши изделия из меди являются очень практичными. В то же время они украшают собой интерьер вашего дома или рабочего пространства.', icon_type: 'refinement' },
    { id: 3, title: 'Честная оплата', description: 'Мы стремимся предоставить лучший товар по лучшей цене с сервисом высокого уровня.', icon_type: 'fair_payment' },
    { id: 4, title: 'Большой ассортимент', description: 'У нас есть все: от миниатюрных настольных паровых дистилляторов эфирных масел до крупногабаритного оборудования.', icon_type: 'assortment' },
    { id: 5, title: 'Доставка по всему миру', description: 'Вы можете получить нашу продукцию в кратчайшие сроки в любую точку земного шара.', icon_type: 'worldwide' },
    { id: 6, title: 'Гарантия качества', description: 'Наше оборудование производится вручную. Мы постоянно производим строжайший контроль качества продукции.', icon_type: 'guarantee' },
    { id: 7, title: 'Удобство в использовании', description: 'Наши изделия из меди имеют уникальный дизайн, который разрабатывался с целью максимального комфорта.', icon_type: 'convenience' },
    { id: 8, забота: 'Забота об окружающей среде', title: 'Забота об окружающей среде', description: 'От 2 до 5% от стоимости каждого приобретенного товара в нашем магазине мы направляем на защиту природы.', icon_type: 'eco' }
  ],
  faq: [
    { id: 1, num: '01', question: 'Сколько времени занимает изготовление и доставка?', answer: 'Стандартные позиции каталога отправляются в течение 1–2 рабочих дней. Изготовление индивидуальных заказов занимает от 5 до 14 рабочих дней в зависимости от сложности.' },
    { id: 2, num: '02', question: 'Какая марка меди используется при производстве?', answer: 'Мы используем исключительно первичную сертифицированную пищевую медь марки М1 (содержание чистой меди не менее 99.9%), полностью безопасную для дистилляции и пищевого использования.' },
    { id: 3, num: '03', question: 'Предоставляется ли гарантия на изделия?', answer: 'Да, на все наши дистилляторы и изделия действует официальная гарантия 2 года. В случае любых производственных дефектов мы производим бесплатный ремонт или замену.' },
    { id: 4, num: '04', question: 'Возможен ли индивидуальный заказ по моим чертежам?', answer: 'Да, наше производство оборудовано для выполнения нестандартных проектов любой сложности — от компактных домашних аппаратов до промышленных установок.' },
    { id: 5, num: '05', question: 'Как ухаживать за медной посудой и аламбиками?', answer: 'Медь сохраняет блеск при периодической чистке натуральными средствами (раствор лимонной кислоты или смеси соли и уксуса), после чего изделие ополаскивается водой и насухо вытирается мягкой тканью.' }
  ],
  contacts: [],
  orders: []
};

// Проверка и инициализация соединения с базой данных
async function initDatabase() {
  try {
    const client = await pool.connect();
    isPostgresConnected = true;
    console.log('[DB SUCCESS] Успешное подключение к PostgreSQL (Postgres/DBeaver)!');

    // Проверяем наличие таблицы users
    const checkTable = await client.query(`
      SELECT to_regclass('public.users') as exists;
    `);

    if (!checkTable.rows[0].exists) {
      console.log('[DB INFO] Таблицы не найдены, выполняем начальную миграцию из init_db.sql...');
      const sqlPath = path.join(__dirname, 'init_db.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('[DB SUCCESS] База данных успешно инициализирована таблицами и начальными данными!');
      }
    } else {
      console.log('[DB INFO] Таблицы PostgreSQL уже созданы и готовы к работе.');
    }

    client.release();
  } catch (err) {
    isPostgresConnected = false;
    console.log('------------------------------------------------------------');
    console.log('[DB NOTICE] PostgreSQL сервер недоступен по указанным параметрам:');
    console.log(`Хост: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}, База: ${process.env.DB_NAME || 'copper_db'}`);
    console.log('Сервер переключился в РЕЖИМ ПАМЯТИ (In-Memory Database).');
    console.log('Все GET и POST запросы, регистрация, вход и оформление заказов РАБОТАЮТ!');
    console.log('Чтобы подключить PostgreSQL:');
    console.log('1. Запустите PostgreSQL и откройте DBeaver');
    console.log('2. Создайте базу данных "copper_db"');
    console.log('3. Выполните скрипт init_db.sql в редакторе SQL DBeaver');
    console.log('4. Укажите правильный пароль в файле .env');
    console.log('------------------------------------------------------------');
  }
}

// Запуск проверки БД
initDatabase();

module.exports = {
  pool,
  isPostgresConnected: () => isPostgresConnected,
  memoryStore
};
