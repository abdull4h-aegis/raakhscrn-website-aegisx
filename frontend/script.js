document.addEventListener('DOMContentLoaded', () => {
  // --- Cart State ---
  let cart = JSON.parse(localStorage.getItem('raakh_cart')) || [];
  const WHATSAPP_NUMBER = '923368837784'; // Updated number
  const API_URL = 'https://raakhscrn-shop.up.railway.app'; // Production URL on Railway

  // --- Inject HTML Structures ---
  const body = document.body;

  // Cart Drawer
  const cartDrawerHTML = `
    <div class="cart-overlay" id="cart-overlay"></div>
    <div class="cart-drawer" id="cart-drawer">
      <div class="cart-header">
        <h2>Your Cart</h2>
        <span class="close-cart" id="close-cart">&times;</span>
      </div>
      <div class="cart-items" id="cart-items-container">
        <!-- Cart Items Go Here -->
      </div>
      <div class="cart-footer">
        <div class="cart-total">
          <span>Total:</span>
          <span id="cart-total-price">PKR 0</span>
        </div>
        <button class="checkout-btn" id="drawer-checkout-btn">Checkout</button>
      </div>
    </div>
  `;
  body.insertAdjacentHTML('beforeend', cartDrawerHTML);

  // Checkout Modal
  const checkoutModalHTML = `
    <div class="modal-overlay" id="checkout-modal">
      <div class="modal-content">
        <span class="close-modal" id="close-checkout">&times;</span>
        <h2>Checkout Details</h2>
        <form id="checkout-form">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="customer-name" required>
          </div>
          <div class="form-group">
            <label>WhatsApp Number</label>
            <input type="text" id="whatsapp-number" placeholder="e.g. 03001234567" required>
          </div>
          <div class="form-group">
            <label>Delivery Address</label>
            <textarea id="address" rows="3" required></textarea>
            <p style="font-size: 8px; color: #666; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase;">Max 50 words</p>
          </div>
          <div class="form-group">
            <label>City</label>
            <input type="text" id="city" required>
          </div>
          <button type="submit" class="submit-order-btn">Place Order</button>
        </form>
      </div>
    </div>
  `;
  body.insertAdjacentHTML('beforeend', checkoutModalHTML);

  // Payment/WhatsApp Modal
  const paymentModalHTML = `
    <div class="modal-overlay" id="payment-modal">
      <div class="modal-content">
        <span class="close-modal" id="close-payment">&times;</span>
        <h2>Order Confirmed!</h2>
        <div class="payment-info">
          <p>Your order ID is: <strong id="success-order-id"></strong></p>
          <p>Total Amount: <strong id="success-total"></strong></p>
          <br>
          <p>Please send the payment via EasyPaisa or JazzCash to the following number:</p>
          <p style="font-size: 16px; margin: 10px 0;"><strong>0336-8837784</strong> (Name: Muhammad Zakria)</p>
          <p>Please send <strong>Rs 300 in advance</strong> for order confirmation and share the screenshot (SS) on WhatsApp.</p>
        </div>
        <a href="#" class="whatsapp-btn" id="whatsapp-confirm-btn" target="_blank">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Confirm on WhatsApp
        </a>
      </div>
    </div>
  `;
  body.insertAdjacentHTML('beforeend', paymentModalHTML);

  // Floating WhatsApp Button
  const floatingWhatsAppHTML = `
    <a href="https://wa.me/923368837784" class="floating-whatsapp" target="_blank" aria-label="Chat with us on WhatsApp">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
  `;
  body.insertAdjacentHTML('beforeend', floatingWhatsAppHTML);
  
  // Promo Popup
  const promoPopupHTML = `
    <div class="promo-overlay" id="promo-popup">
      <div class="promo-content">
        <span class="close-promo" id="close-promo">&times;</span>
        <div class="promo-icon">✨</div>
        <h2 id="promo-title">SPECIAL OFFER</h2>
        <p id="promo-text"></p>
        <button class="promo-btn" id="promo-shop-btn">Shop Now</button>
      </div>
    </div>
    <style>
      .promo-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 2000;
        display: none; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.4s;
        backdrop-filter: blur(5px);
      }
      .promo-overlay.active { display: flex; opacity: 1; }
      .promo-content {
        background: #0a0a0a; border: 1px solid var(--accent); padding: 50px 40px; width: 90%; max-width: 450px;
        text-align: center; position: relative; transform: translateY(20px); transition: transform 0.4s;
      }
      .promo-overlay.active .promo-content { transform: translateY(0); }
      .close-promo { position: absolute; top: 15px; right: 20px; color: #555; cursor: pointer; font-size: 24px; transition: color 0.2s; }
      .close-promo:hover { color: var(--white); }
      .promo-icon { font-size: 40px; margin-bottom: 20px; }
      .promo-content h2 { font-family: 'Bebas Neue', sans-serif; font-size: 42px; letter-spacing: 4px; color: var(--accent); margin-bottom: 15px; }
      .promo-content p { font-family: 'Space Mono', monospace; font-size: 14px; line-height: 1.6; color: var(--white); margin-bottom: 30px; letter-spacing: 1px; }
      .promo-btn {
        background: var(--white); color: var(--black); border: none; padding: 16px 32px;
        font-family: 'Space Mono', monospace; font-size: 12px; font-weight: bold; text-transform: uppercase;
        letter-spacing: 3px; cursor: pointer; transition: all 0.3s;
      }
      .promo-btn:hover { background: var(--accent); transform: scale(1.05); }
    </style>
  `;
  body.insertAdjacentHTML('beforeend', promoPopupHTML);

  // --- DOM Elements ---
  const cartIcons = document.querySelectorAll('.cart-icon-trigger');
  const navMenu = document.getElementById('nav-menu');
  const mobileMenuBtn = document.getElementById('mobile-menu');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }

  // Close menu when clicking a link
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenuBtn) {
        mobileMenuBtn.classList.remove('active');
        navMenu.classList.remove('active');
      }
    });
  });
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartTotalPriceEl = document.getElementById('cart-total-price');

  const drawerCheckoutBtn = document.getElementById('drawer-checkout-btn');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.getElementById('close-checkout');
  const checkoutForm = document.getElementById('checkout-form');
  const submitOrderBtn = document.querySelector('.submit-order-btn');

  const paymentModal = document.getElementById('payment-modal');
  const closePaymentBtn = document.getElementById('close-payment');
  const successOrderId = document.getElementById('success-order-id');
  const successTotal = document.getElementById('success-total');
  const whatsappConfirmBtn = document.getElementById('whatsapp-confirm-btn');

  const productsGridContainer = document.getElementById('products-grid-container');

  // --- Functions ---
  const saveCart = () => localStorage.setItem('raakh_cart', JSON.stringify(cart));

  const getCartTotal = () => cart.reduce((sum, item) => {
    const price = item.discountPrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  const updateCartUI = () => {
    cartItemsContainer.innerHTML = '';
    let totalQty = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p style="color: #888; margin-top: 20px;">Your cart is empty.</p>';
      drawerCheckoutBtn.style.display = 'none';
    } else {
      drawerCheckoutBtn.style.display = 'block';
      cart.forEach((item, index) => {
        totalQty += item.quantity;
        cartItemsContainer.insertAdjacentHTML('beforeend', `
          <div class="cart-item">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <div class="cart-item-price">
                ${item.discountPrice ? `<span style="text-decoration:line-through; color:#666; font-size:10px; margin-right:5px;">PKR ${item.price}</span>` : ''}
                PKR ${item.discountPrice || item.price}
              </div>
              <span class="remove-item" data-index="${index}">Remove</span>
            </div>
            <div class="cart-item-qty">
              <button class="qty-btn minus" data-index="${index}">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn plus" data-index="${index}">+</button>
            </div>
          </div>
        `);
      });
    }

    cartIcons.forEach(icon => {
      const countEl = icon.querySelector('.cart-count');
      if (countEl) countEl.textContent = totalQty;
    });
    cartTotalPriceEl.textContent = `PKR ${getCartTotal().toLocaleString()}`;

    // Re-bind qty buttons
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.index;
        cart[idx].quantity += 1;
        saveCart(); updateCartUI();
      });
    });
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.index;
        if (cart[idx].quantity > 1) {
          cart[idx].quantity -= 1;
        } else {
          cart.splice(idx, 1);
        }
        saveCart(); updateCartUI();
      });
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        cart.splice(e.target.dataset.index, 1);
        saveCart(); updateCartUI();
      });
    });
  };

  const openCart = (e) => { if (e) e.preventDefault(); cartDrawer.classList.add('active'); cartOverlay.classList.add('active'); };
  const closeCart = () => { cartDrawer.classList.remove('active'); cartOverlay.classList.remove('active'); };

  const openCheckout = () => {
    closeCart();
    checkoutModal.classList.add('active');
  };
  const closeCheckout = () => checkoutModal.classList.remove('active');

  const openPaymentModal = (orderId, total) => {
    successOrderId.textContent = orderId;
    successTotal.textContent = `PKR ${total.toLocaleString()}`;

    // Setup WhatsApp Link
    const message = encodeURIComponent(`Hello! I just placed an order on RAAKHSCRN.\nOrder ID: ${orderId}\nTotal Amount: PKR ${total}\nI have sent the Rs 300 advance. Here is the screenshot.`);
    whatsappConfirmBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    paymentModal.classList.add('active');
  };
  const closePaymentModal = () => paymentModal.classList.remove('active');

  // Listen for cart updates from other parts of the app (like product.html)
  window.addEventListener('cartUpdated', () => {
    cart = JSON.parse(localStorage.getItem('raakh_cart')) || [];
    updateCartUI();
  });

  // Listen for storage changes (cross-tab)
  window.addEventListener('storage', (e) => {
    if (e.key === 'raakh_cart') {
      cart = JSON.parse(e.newValue) || [];
      updateCartUI();
    }
  });

  // --- Event Listeners ---
  cartIcons.forEach(icon => icon.addEventListener('click', openCart));
  closeCartBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  drawerCheckoutBtn.addEventListener('click', openCheckout);
  closeCheckoutBtn.addEventListener('click', closeCheckout);

  closePaymentBtn.addEventListener('click', closePaymentModal);

  // --- Fetch and Render Products ---
  const loadFrontendProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();

      if (data.success && data.products.length > 0) {
        productsGridContainer.innerHTML = data.products.map(p => {
          const hasDiscount = p.discount > 0;
          const finalPrice = hasDiscount ? (p.price * (1 - p.discount/100)) : p.price;
          
          return `
            <a href="product.html?id=${p._id}" class="product-card" style="text-decoration: none; display: block;">
              <div class="product-card-img ${p.isComingSoon ? 'muted' : ''}">
                <img src="${API_URL}${p.images ? p.images[0] : p.image}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" />
                ${p.isComingSoon ? '<div class="coming-soon-badge">Coming Soon</div>' : ''}
                ${hasDiscount && !p.isComingSoon ? `<div class="sale-badge">SALE -${p.discount}%</div>` : ''}
              </div>
              <div class="product-card-info">
                <div class="product-name">${p.name}</div>
                ${hasDiscount && !p.isComingSoon ? `<div class="product-discount-info">Limited Time Offer</div>` : ''}
                <div class="product-price" ${p.isComingSoon ? 'style="color: #555"' : ''}>
                  ${p.isComingSoon ? '— —' : (hasDiscount 
                    ? `<span class="new-price">PKR ${finalPrice.toLocaleString()}</span><span class="old-price">PKR ${p.price.toLocaleString()}</span>` 
                    : 'PKR ' + p.price.toLocaleString())}
                </div>
              </div>
            </a>
          `;
        }).join('');

        // Cards now link to product.html — no inline add-to-cart needed here
      } else {
        productsGridContainer.innerHTML = '<p style="padding: 20px;">No products available at the moment.</p>';
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      productsGridContainer.innerHTML = '<p style="padding: 20px;">Error loading products.</p>';
    }
  };

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerName = document.getElementById('customer-name').value;
    const whatsappNumber = document.getElementById('whatsapp-number').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;

    const wordCount = address.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 50) {
      alert('Address must be no more than 50 words.');
      return;
    }

    const orderData = {
      customerName,
      whatsappNumber,
      address,
      city,
      orderItems: cart,
      totalPrice: getCartTotal()
    };

    submitOrderBtn.textContent = 'Processing...';
    submitOrderBtn.disabled = true;

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (data.success) {
        closeCheckout();
        openPaymentModal(data.orderID, orderData.totalPrice);

        // Clear cart
        cart = [];
        saveCart();
        updateCartUI();
        checkoutForm.reset();
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Please try again.');
    } finally {
      submitOrderBtn.textContent = 'Place Order';
      submitOrderBtn.disabled = false;
    }
  });

  // --- Promo Popup Logic ---
  const checkPromo = async () => {
    // Only show if not dismissed in this session
    if (sessionStorage.getItem('raakh_promo_dismissed')) return;

    try {
      const res = await fetch(`${API_URL}/api/settings`);
      const data = await res.json();
      
      if (data.success && data.settings && data.settings.promoPopupEnabled) {
        document.getElementById('promo-text').textContent = data.settings.promoMessage;
        const overlay = document.getElementById('promo-popup');
        
        // Show after a slight delay
        setTimeout(() => {
          overlay.classList.add('active');
        }, 1500);

        document.getElementById('close-promo').addEventListener('click', () => {
          overlay.classList.remove('active');
          sessionStorage.setItem('raakh_promo_dismissed', 'true');
        });

        document.getElementById('promo-shop-btn').addEventListener('click', () => {
          overlay.classList.remove('active');
          sessionStorage.setItem('raakh_promo_dismissed', 'true');
          window.location.href = 'shop.html';
        });
        
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.classList.remove('active');
            sessionStorage.setItem('raakh_promo_dismissed', 'true');
          }
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Initial render
  updateCartUI();
  loadFrontendProducts();
  checkPromo();
});
