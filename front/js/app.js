/**
 * Main Application Logic for COPPER PRO
 * Динамический рендеринг данных через Axios GET-запросы с бэкенда,
 * интерактивная корзина, избранное, модальные окна, аккордеон FAQ,
 * регистрация и авторизация пользователей, форма контактов (POST).
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Инициализация состояния (State)
  const state = {
    cart: JSON.parse(localStorage.getItem('copper_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('copper_wishlist') || '[]'),
    user: JSON.parse(localStorage.getItem('copper_user') || 'null'),
    products: [],
    categories: []
  };

  // 2. Уведомления (Toasts)
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // 3. Синхронизация UI счетчиков (Корзина и Избранное)
  function updateCounters() {
    const cartCountEl = document.getElementById('cart-count');
    const wishlistCountEl = document.getElementById('wishlist-count');
    const authBtn = document.getElementById('auth-btn');

    if (cartCountEl) {
      const totalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
      cartCountEl.textContent = totalQty;
      cartCountEl.style.display = totalQty > 0 ? 'flex' : 'none';
    }

    if (wishlistCountEl) {
      wishlistCountEl.textContent = state.wishlist.length;
      wishlistCountEl.style.display = state.wishlist.length > 0 ? 'flex' : 'none';
    }

    if (authBtn) {
      if (state.user) {
        authBtn.innerHTML = `
          <div class="user-profile-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="user-name-label">${state.user.name}</span>
            <span style="font-size: 11px; color: #CB8D62; text-decoration: underline; margin-left: 4px;" id="logout-link">(Выйти)</span>
          </div>
        `;
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
          logoutLink.addEventListener('click', (e) => {
            e.stopPropagation();
            logout();
          });
        }
      } else {
        authBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        `;
      }
    }
  }

  // 4. Корзина (Cart)
  function addToCart(product) {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: product.id,
        title: product.title,
        price: parseFloat(product.price),
        image_url: product.image_url,
        quantity: 1
      });
    }
    localStorage.setItem('copper_cart', JSON.stringify(state.cart));
    updateCounters();
    renderCart();
    showToast(`Товар "${product.title}" добавлен в корзину!`);
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    localStorage.setItem('copper_cart', JSON.stringify(state.cart));
    updateCounters();
    renderCart();
  }

  function changeQuantity(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      localStorage.setItem('copper_cart', JSON.stringify(state.cart));
      updateCounters();
      renderCart();
    }
  }

  function renderCart() {
    const body = document.getElementById('cart-drawer-body');
    const totalEl = document.getElementById('cart-total-price');
    if (!body || !totalEl) return;

    if (state.cart.length === 0) {
      body.innerHTML = '<div class="cart-empty-message">Ваша корзина пуста.<br>Выберите товары из нашего каталога.</div>';
      totalEl.textContent = '0 грн';
      return;
    }

    let total = 0;
    body.innerHTML = state.cart.map(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      return `
        <div class="cart-item">
          <div class="item-thumb">
            <img src="${item.image_url}" alt="${item.title}">
          </div>
          <div class="item-details">
            <div class="item-name">${item.title}</div>
            <div class="item-price">${Math.round(item.price)} грн</div>
            <div class="item-qty-row">
              <button class="btn-qty" onclick="window.changeCartQty(${item.id}, -1)">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="btn-qty" onclick="window.changeCartQty(${item.id}, 1)">+</button>
            </div>
          </div>
          <button class="btn-remove-item" onclick="window.removeCartItem(${item.id})" title="Удалить">✕</button>
        </div>
      `;
    }).join('');

    totalEl.textContent = `${Math.round(total)} грн`;
  }

  window.changeCartQty = changeQuantity;
  window.removeCartItem = removeFromCart;

  // 5. Избранное (Wishlist)
  function toggleWishlist(productId) {
    const index = state.wishlist.indexOf(productId);
    if (index > -1) {
      state.wishlist.splice(index, 1);
      showToast('Товар удален из списка желаемого');
    } else {
      state.wishlist.push(productId);
      showToast('Товар добавлен в избранное!');
    }
    localStorage.setItem('copper_wishlist', JSON.stringify(state.wishlist));
    updateCounters();

    // Обновляем иконки сердечек на странице
    document.querySelectorAll(`[data-wishlist-id="${productId}"]`).forEach(btn => {
      btn.classList.toggle('active', state.wishlist.includes(productId));
    });
  }

  window.toggleWishlist = toggleWishlist;

  // 6. Шаблон карточки товара
  function createProductCardHTML(product) {
    const isFav = state.wishlist.includes(product.id);
    const hasDiscount = product.old_price && parseFloat(product.old_price) > parseFloat(product.price);

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-img-box">
          ${product.is_sale ? '<span class="badge-sale">SALE</span>' : ''}
          <button class="btn-favorite ${isFav ? 'active' : ''}" data-wishlist-id="${product.id}" onclick="window.toggleWishlist(${product.id})" title="В избранное">
            <svg viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <img src="${product.image_url}" alt="${product.title}" loading="lazy">
        </div>
        <div class="product-info">
          <div class="product-title">${product.title}</div>
          <div class="product-price-row">
            <span class="price-current ${product.is_sale ? 'is-sale' : ''}">${Math.round(product.price)} грн</span>
            ${hasDiscount ? `<span class="price-old">${Math.round(product.old_price)} грн</span>` : ''}
          </div>
          <button class="btn-add-cart" onclick='window.addCardToCart(${JSON.stringify(product)})'>В корзину</button>
        </div>
      </div>
    `;
  }

  window.addCardToCart = addToCart;

  // 7. Загрузка данных через GET-запросы с бэкенда (Axios)
  async function loadData() {
    try {
      // Проверяем доступность бэкенда
      const health = await window.CopperAPI.checkHealth();
      console.log('Статус сервера бэкенда:', health);

      // А. Категории ("Наша продукция")
      const categories = await window.CopperAPI.getCategories();
      state.categories = categories;
      const catContainer = document.getElementById('categories-grid');
      if (catContainer) {
        catContainer.innerHTML = categories.map(cat => `
          <div class="category-card" onclick="window.filterByCategory('${cat.slug}')">
            <div class="card-img-wrapper">
              <img src="${cat.image_url}" alt="${cat.title}">
            </div>
            <div class="category-overlay">
              <div class="category-title">${cat.title}</div>
              <div class="category-link">Смотреть каталог →</div>
            </div>
          </div>
        `).join('');
      }

      // Б. Все товары и секции
      const allProducts = await window.CopperAPI.getProducts();
      state.products = allProducts;

      // 1. Лучшие продажи (Хиты)
      const bestSellers = allProducts.filter(p => p.is_hit).slice(0, 3);
      const bestContainer = document.getElementById('best-sellers-grid');
      if (bestContainer) {
        bestContainer.innerHTML = bestSellers.map(createProductCardHTML).join('');
      }

      // 2. Новинки
      const newArrivals = allProducts.filter(p => p.is_new).slice(0, 3);
      const newContainer = document.getElementById('new-arrivals-grid');
      if (newContainer) {
        newContainer.innerHTML = (newArrivals.length > 0 ? newArrivals : allProducts.slice(3, 6)).map(createProductCardHTML).join('');
      }

      // 3. Мы рекомендуем
      const recommended = allProducts.filter(p => p.is_recommended).slice(0, 3);
      const recContainer = document.getElementById('recommended-grid');
      if (recContainer) {
        recContainer.innerHTML = (recommended.length > 0 ? recommended : allProducts.slice(0, 3)).map(createProductCardHTML).join('');
      }

      // 4. Скидки
      const discounts = allProducts.filter(p => p.is_sale).slice(0, 3);
      const discContainer = document.getElementById('discounts-grid');
      if (discContainer) {
        discContainer.innerHTML = (discounts.length > 0 ? discounts : allProducts.slice(1, 4)).map(createProductCardHTML).join('');
      }

      // В. Отзывы ("Что думают о нас")
      const reviews = await window.CopperAPI.getReviews();
      const reviewsContainer = document.getElementById('reviews-grid');
      if (reviewsContainer) {
        reviewsContainer.innerHTML = reviews.map(rev => `
          <div class="review-card">
            <div class="review-user-row">
              <div class="review-avatar">
                <img src="${rev.avatar_url || 'images/avatar-user.jpg'}" alt="${rev.author_name}">
              </div>
              <div class="review-meta">
                <div class="review-author">${rev.author_name}</div>
                <div class="review-date">${rev.date_text}</div>
              </div>
            </div>
            <div class="review-text">"${rev.content}"</div>
          </div>
        `).join('');
      }

      // Г. Преимущества ("Почему выбирают нас" - 8 карточек)
      const benefits = await window.CopperAPI.getBenefits();
      const benefitsContainer = document.getElementById('benefits-grid');
      if (benefitsContainer) {
        benefitsContainer.innerHTML = benefits.map(b => `
          <div class="benefit-card">
            <div class="benefit-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div class="benefit-title">${b.title}</div>
            <div class="benefit-desc">${b.description}</div>
            <a href="#catalog" class="benefit-link">Читать больше →</a>
          </div>
        `).join('');
      }

      // Д. FAQ (Часто задаваемые вопросы)
      const faqItems = await window.CopperAPI.getFaq();
      const faqContainer = document.getElementById('faq-list');
      if (faqContainer) {
        faqContainer.innerHTML = faqItems.map((item, idx) => `
          <div class="faq-item ${idx === 0 ? 'open' : ''}" data-faq="${item.id}">
            <div class="faq-question-row">
              <div class="faq-left">
                <span class="faq-number">${item.num}</span>
                <span class="faq-question">${item.question}</span>
              </div>
              <span class="faq-toggle-icon">+</span>
            </div>
            <div class="faq-answer">
              <p>${item.answer}</p>
            </div>
          </div>
        `).join('');

        // Обработчик аккордеона FAQ
        document.querySelectorAll('.faq-question-row').forEach(row => {
          row.addEventListener('click', () => {
            const parent = row.closest('.faq-item');
            const wasOpen = parent.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(it => it.classList.remove('open'));
            if (!wasOpen) {
              parent.classList.add('open');
            }
          });
        });
      }

    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      showToast('Сервер бэкенда недоступен. Проверьте запуск "npm start" в папке back.', 'error');
    }
  }

  window.filterByCategory = (slug) => {
    const target = document.getElementById('best-sellers');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      showToast(`Выбрана категория: ${slug}`);
    }
  };

  // 8. Корзина: открытие / закрытие
  const cartTrigger = document.getElementById('cart-btn');
  const cartDrawer = document.getElementById('cart-drawer-overlay');
  const closeCartBtn = document.getElementById('btn-close-cart');

  if (cartTrigger && cartDrawer) {
    cartTrigger.addEventListener('click', () => {
      renderCart();
      cartDrawer.classList.add('open');
    });
  }

  if (closeCartBtn && cartDrawer) {
    closeCartBtn.addEventListener('click', () => {
      cartDrawer.classList.remove('open');
    });
    cartDrawer.addEventListener('click', (e) => {
      if (e.target === cartDrawer) {
        cartDrawer.classList.remove('open');
      }
    });
  }

  // 9. Оформление заказа (Checkout Modal)
  const checkoutBtn = document.getElementById('btn-checkout');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.getElementById('btn-close-checkout');
  const checkoutForm = document.getElementById('checkout-form');

  if (checkoutBtn && checkoutModal) {
    checkoutBtn.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast('Ваша корзина пуста!', 'error');
        return;
      }
      cartDrawer.classList.remove('open');
      checkoutModal.classList.add('open');
    });
  }

  if (closeCheckoutBtn && checkoutModal) {
    closeCheckoutBtn.addEventListener('click', () => {
      checkoutModal.classList.remove('open');
    });
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) checkoutModal.classList.remove('open');
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customer_name = document.getElementById('order-name').value.trim();
      const customer_email = document.getElementById('order-email').value.trim();
      const customer_phone = document.getElementById('order-phone').value.trim();
      const delivery_address = document.getElementById('order-address').value.trim();

      const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      try {
        const result = await window.CopperAPI.createOrder({
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          items: state.cart,
          total_amount: total
        });

        showToast(result.message || 'Заказ успешно создан!', 'success');
        state.cart = [];
        localStorage.removeItem('copper_cart');
        updateCounters();
        checkoutModal.classList.remove('open');
        checkoutForm.reset();
      } catch (err) {
        showToast(err.response?.data?.error || 'Ошибка при оформлении заказа', 'error');
      }
    });
  }

  // 10. Модальное окно авторизации / регистрации
  const authTrigger = document.getElementById('auth-btn');
  const authModal = document.getElementById('auth-modal');
  const closeAuthBtn = document.getElementById('btn-close-auth');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  if (authTrigger && authModal) {
    authTrigger.addEventListener('click', () => {
      if (!state.user) {
        authModal.classList.add('open');
      }
    });
  }

  if (closeAuthBtn && authModal) {
    closeAuthBtn.addEventListener('click', () => authModal.classList.remove('open'));
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) authModal.classList.remove('open');
    });
  }

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'flex';
      formRegister.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.style.display = 'flex';
      formLogin.style.display = 'none';
    });
  }

  // Обработка Входа (POST)
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const res = await window.CopperAPI.login({ email, password });
        state.user = res.user;
        localStorage.setItem('copper_user', JSON.stringify(res.user));
        localStorage.setItem('copper_token', res.token);
        updateCounters();
        authModal.classList.remove('open');
        formLogin.reset();
        showToast(`Добро пожаловать, ${res.user.name}!`, 'success');
      } catch (err) {
        showToast(err.response?.data?.error || 'Ошибка входа', 'error');
      }
    });
  }

  // Обработка Регистрации (POST)
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      try {
        const res = await window.CopperAPI.register({ name, email, password });
        state.user = res.user;
        localStorage.setItem('copper_user', JSON.stringify(res.user));
        localStorage.setItem('copper_token', res.token);
        updateCounters();
        authModal.classList.remove('open');
        formRegister.reset();
        showToast(`Регистрация прошла успешно! Добро пожаловать, ${res.user.name}!`, 'success');
      } catch (err) {
        showToast(err.response?.data?.error || 'Ошибка регистрации', 'error');
      }
    });
  }

  function logout() {
    state.user = null;
    localStorage.removeItem('copper_user');
    localStorage.removeItem('copper_token');
    updateCounters();
    showToast('Вы вышли из учетной записи');
  }

  // 11. Отправка формы контактов (POST)
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-message').value.trim();

      try {
        const res = await window.CopperAPI.sendContact({ name, email, subject, message });
        showToast(res.message || 'Сообщение успешно отправлено в базу данных!', 'success');
        contactForm.reset();
      } catch (err) {
        showToast(err.response?.data?.error || 'Ошибка при отправке сообщения', 'error');
      }
    });
  }

  // 12. Кнопка "ВВЕРХ" (Back to top)
  const btnTop = document.getElementById('btn-back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btnTop?.classList.add('visible');
    } else {
      btnTop?.classList.remove('visible');
    }
  });

  if (btnTop) {
    btnTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Первоначальный запуск
  updateCounters();
  loadData();
});
