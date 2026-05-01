document.addEventListener('DOMContentLoaded', () => {
  // --- Cart State ---
  let cart = JSON.parse(localStorage.getItem('raakh_cart')) || [];
  const WHATSAPP_NUMBER = '923000000000'; // REPLACE WITH ACTUAL NUMBER
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
          <p style="font-size: 16px; margin: 10px 0;"><strong>0300-XXXXXXX</strong> (Name: RAAKHSCRN)</p>
          <p>Once paid, click the button below to confirm your payment with us on WhatsApp.</p>
        </div>
        <a href="#" class="whatsapp-btn" id="whatsapp-confirm-btn" target="_blank">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Confirm on WhatsApp
        </a>
      </div>
    </div>
  `;
  body.insertAdjacentHTML('beforeend', paymentModalHTML);

  // --- DOM Elements ---
  const cartIcon = document.getElementById('cart-icon');
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

  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
              <div class="cart-item-price">PKR ${item.price}</div>
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

    cartIcon.textContent = `Cart (${totalQty})`;
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
    const message = encodeURIComponent(`Hello! I just placed an order on RAAKHSCRN.\nOrder ID: ${orderId}\nTotal Amount: PKR ${total}\nI would like to confirm my payment.`);
    whatsappConfirmBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    paymentModal.classList.add('active');
  };
  const closePaymentModal = () => paymentModal.classList.remove('active');

  // --- Event Listeners ---
  cartIcon.addEventListener('click', openCart);
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
        productsGridContainer.innerHTML = data.products.map(p => `
          <a href="product.html?id=${p._id}" class="product-card" style="text-decoration: none; display: block;">
            <div class="product-card-img ${p.isComingSoon ? 'muted' : ''}">
              <img src="${API_URL}${p.images ? p.images[0] : p.image}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" />
              ${p.isComingSoon ? '<div class="coming-soon-badge">Coming Soon</div>' : ''}
            </div>
            <div class="product-card-info">
              <div>
                <div class="product-name">${p.name}</div>
                <div class="product-meta">${p.description}</div>
              </div>
              <div style="text-align: right;">
                <div class="product-price" ${p.isComingSoon ? 'style="color: #555"' : ''}>
                  ${p.isComingSoon ? '— —' : 'PKR ' + p.price.toLocaleString()}
                </div>
                ${!p.isComingSoon ? `<div style="font-size:9px; letter-spacing:2px; text-transform:uppercase; color: var(--accent); margin-top:6px;">View →</div>` : ''}
              </div>
            </div>
          </a>
        `).join('');

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

  // Initial render
  updateCartUI();
  loadFrontendProducts();
});
