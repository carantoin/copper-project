-- ===================================================
-- Скрипт инициализации базы данных для проекта COPPER PRO
-- Выполняется в DBeaver или консоли psql PostgreSQL
-- ===================================================

-- Создание таблиц
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS faq CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Таблица пользователей (Регистрация / Авторизация)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблица категорий ("Наша продукция")
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    image_url VARCHAR(255) NOT NULL,
    badge VARCHAR(50) DEFAULT NULL
);

-- 3. Таблица товаров ("Хит продаж", "Лучшие продажи", "Новинки", "Мы рекомендуем", "Скидки")
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category_slug VARCHAR(100) REFERENCES categories(slug) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL,
    old_price NUMERIC(10, 2) DEFAULT NULL,
    is_hit BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_sale BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблица отзывов ("Что думают о нас")
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    author_name VARCHAR(100) NOT NULL,
    date_text VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    avatar_url VARCHAR(255) DEFAULT 'images/avatar-user.jpg'
);

-- 5. Таблица преимуществ ("Почему выбирают нас" - 8 карточек)
CREATE TABLE benefits (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    icon_type VARCHAR(50) NOT NULL
);

-- 6. Таблица FAQ (Часто задаваемые вопросы)
CREATE TABLE faq (
    id SERIAL PRIMARY KEY,
    num VARCHAR(10) NOT NULL,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL
);

-- 7. Таблица сообщений формы контактов (POST-запросы)
CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(150),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Таблица заказов из корзины (POST-запросы)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    delivery_address TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Новый',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1
);

-- ===================================================
-- Наполнение начальными данными (SEED DATA)
-- ===================================================

-- Тестовый пользователь (пароль: 123456, хэширован bcrypt)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Иван Иванов', 'user@example.com', '$2a$10$wO8o5T8l1z6qI1f7MfqC7uX8j1G3EfZ7u6g9zQf6U4M.8F6Gv7e5y', 'user'),
('Администратор', 'admin@copperpro.com', '$2a$10$wO8o5T8l1z6qI1f7MfqC7uX8j1G3EfZ7u6g9zQf6U4M.8F6Gv7e5y', 'admin');

-- Категории
INSERT INTO categories (title, slug, image_url, badge) VALUES
('Для эфирных масел', 'essential-oils', 'images/cat-1.jpg', NULL),
('Для гидролатов', 'hydrolats', 'images/cat-2.jpg', NULL),
('Медная посуда', 'copper-cookware', 'images/cat-3.jpg', NULL),
('Аксессуары из меди', 'accessories', 'images/cat-4.jpg', NULL),
('Индивидуальный заказ', 'custom-order', 'images/cat-5.jpg', NULL),
('Скидки и предложения', 'discounts', 'images/cat-6.jpg', '-30% -50% -80%');

-- Товары
INSERT INTO products (title, category_slug, price, old_price, is_hit, is_new, is_recommended, is_sale, image_url, description) VALUES
('Дистиллятор для эфирных масел', 'essential-oils', 4906.00, NULL, TRUE, FALSE, FALSE, FALSE, 'images/hero-distiller.jpg', 'Профессиональный медный дистиллятор ручной работы для получения чистейших эфирных масел.'),
('Медный чайник с фарфоровой ручкой', 'copper-cookware', 1953.00, NULL, TRUE, FALSE, TRUE, FALSE, 'images/prod-3.jpg', 'Классический медный чайник с удобной фарфоровой термостойкой ручкой.'),
('Дистиллятор колонный "Премиум"', 'essential-oils', 3450.00, NULL, TRUE, FALSE, TRUE, FALSE, 'images/prod-1.jpg', 'Высокоточная перегонная колонна из меди для тонкой дистилляции.'),
('Аламбик шарантский медный', 'hydrolats', 4120.00, NULL, TRUE, FALSE, FALSE, FALSE, 'images/prod-2.jpg', 'Традиционный шарантский аламбик для цветочных гидролатов и ароматов.'),
('Медный чайник с фарфоровой ручкой (Акция)', 'copper-cookware', 1953.00, 2450.00, FALSE, TRUE, FALSE, TRUE, 'images/prod-3.jpg', 'Чайник по специальной цене ограниченной серии со скидкой.'),
('Аппарат для гидролатов "Люкс"', 'hydrolats', 2890.00, NULL, FALSE, TRUE, FALSE, FALSE, 'images/prod-2.jpg', 'Новинка сезона с улучшенной системой конденсации и охлаждения.'),
('Колонный дистиллятор "Мастер"', 'essential-oils', 3700.00, NULL, FALSE, TRUE, TRUE, FALSE, 'images/prod-1.jpg', 'Универсальное оборудование для домашнего и полупрофессионального применения.'),
('Медный чайник с фарфоровой ручкой (Black Edition)', 'copper-cookware', 1953.00, 2300.00, FALSE, FALSE, TRUE, TRUE, 'images/prod-3.jpg', 'Медный чайник с черной отделкой и благородной патиной.'),
('Медный аламбик с термометром', 'essential-oils', 5200.00, 6100.00, FALSE, FALSE, FALSE, TRUE, 'images/prod-2.jpg', 'Полный комплект со встроенным биметаллическим термометром.'),
('Медный фильтр-дефлегматор', 'accessories', 1450.00, 1950.00, FALSE, FALSE, FALSE, TRUE, 'images/cat-4.jpg', 'Аксессуар из меди высокой степени очистки М1.');

-- Отзывы
INSERT INTO reviews (author_name, date_text, content, avatar_url) VALUES
('Иван Иванов', '20.10.21', 'Наше оборудование производится вручную. Мы постоянно производим контроль качества произведенной продукции. В то же время если в ходе транспортировки или эксплуатации в течение первых 2 лет произойдет поломка, мы всегда находим с клиентом наиболее удобный вариант решения вопроса.', 'images/avatar-user.jpg'),
('Елена Смирнова', '15.11.21', 'Заказывала аламбик для эфирных масел лаванды. Качество меди и соединений просто поразительное! Всё работает безукоризненно, очень довольна покупкой и сервисом.', 'images/avatar-user.jpg'),
('Михаил Коваль', '02.12.21', 'Прекрасный медный чайник с фарфоровой ручкой. Держит тепло невероятно долго, выглядит на плите как настоящее произведение искусства. Рекомендую!', 'images/avatar-user.jpg');

-- Преимущества (8 карточек)
INSERT INTO benefits (title, description, icon_type) VALUES
('Аутентичность', 'Наше перегонное оборудование используется для получения эфирных масел с незапамятных времен.', 'authenticity'),
('Изысканность', 'Наши изделия из меди являются очень практичными. В то же время они украшают собой интерьер вашего дома или рабочего пространства.', 'refinement'),
('Честная оплата', 'Мы стремимся предоставить лучший товар по лучшей цене с сервисом высокого уровня.', 'fair_payment'),
('Большой ассортимент', 'У нас есть все: от миниатюрных настольных паровых дистилляторов эфирных масел до крупногабаритного оборудования.', 'assortment'),
('Доставка по всему миру', 'Вы можете получить нашу продукцию в кратчайшие сроки в любую точку земного шара.', 'worldwide'),
('Гарантия качества', 'Наше оборудование производится вручную. Мы постоянно производим строжайший контроль качества продукции.', 'guarantee'),
('Удобство в использовании', 'Наши изделия из меди имеют уникальный дизайн, который разрабатывался с целью максимального комфорта.', 'convenience'),
('Забота об окружающей среде', 'От 2 до 5% от стоимости каждого приобретенного товара в нашем магазине мы направляем на защиту природы.', 'eco');

-- FAQ
INSERT INTO faq (num, question, answer) VALUES
('01', 'Сколько времени занимает изготовление и доставка?', 'Стандартные позиции каталога отправляются в течение 1–2 рабочих дней. Изготовление индивидуальных заказов занимает от 5 до 14 рабочих дней в зависимости от сложности.'),
('02', 'Какая марка меди используется при производстве?', 'Мы используем исключительно первичную сертифицированную пищевую медь марки М1 (содержание чистой меди не менее 99.9%), полностью безопасную для дистилляции и пищевого использования.'),
('03', 'Предоставляется ли гарантия на изделия?', 'Да, на все наши дистилляторы и изделия действует официальная гарантия 2 года. В случае любых производственных дефектов мы производим бесплатный ремонт или замену.'),
('04', 'Возможен ли индивидуальный заказ по моим чертежам?', 'Да, наше производство оборудовано для выполнения нестандартных проектов любой сложности — от компактных домашних аппаратов до промышленных установок.'),
('05', 'Как ухаживать за медной посудой и аламбиками?', 'Медь сохраняет блеск при периодической чистке натуральными средствами (раствор лимонной кислоты или смеси соли и уксуса), после чего изделие ополаскивается водой и насухо вытирается мягкой тканью.');
