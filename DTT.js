const SUPABASE_URL = 'https://yrqyufpvncfudatvmtrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycXl1ZnB2bmNmdWRhdHZtdHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzAyMjEsImV4cCI6MjEwMzMwNjIyMX0.hqJ51r_sEAYaZe2WhkiqyaCGeLxtYEemNM8mgGYhpJE';
const supabaseClient = window.supabase && SUPABASE_URL.indexOf('YOUR_') === -1
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
let siteCurrency = 'NGN';
let checkoutCoupon = null;
let checkoutItems = [];
let checkoutDeliveryFee = 0;
let paystackPublicKey = '';
let paymentsEnabled = false;
let manualPaymentEnabled = false;
let manualPaymentSettings = {};

function formatMoney(value) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: siteCurrency }).format(Number(value));
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function refreshDisplayedPrices() {
    document.querySelectorAll('[data-price]').forEach(element => {
        element.textContent = formatMoney(element.dataset.price);
    });
}

function couponDiscount(coupon, subtotal) {
    if (!coupon) return 0;
    return coupon.discount_type === 'percentage' ? subtotal * Number(coupon.discount_value) / 100 : Math.min(subtotal, Number(coupon.discount_value));
}

async function loadSiteSettings() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.from('site_settings').select('store_name, seo_title, seo_description, logo_url, logo_width, favicon_url, payment_currency, paystack_public_key, payments_enabled, manual_payment_enabled, bank_name, bank_account_name, bank_account_number, bank_instructions, hero_eyebrow, hero_title, hero_description, hero_button_text, hero_button_link, hero_image_url, contact_email, contact_phone, contact_address, contact_hours, contact_instagram').eq('id', true).maybeSingle();
    if (error) {
        const { data: paymentData } = await supabaseClient.from('site_settings').select('payment_currency, paystack_public_key, payments_enabled, manual_payment_enabled, bank_name, bank_account_name, bank_account_number, bank_instructions').eq('id', true).maybeSingle();
        const savedSettings = JSON.parse(localStorage.getItem('dttSiteSettings') || '{}');
        siteCurrency = paymentData?.payment_currency || savedSettings.payment_currency || siteCurrency;
        paystackPublicKey = paymentData?.paystack_public_key || savedSettings.paystack_public_key || '';
        paymentsEnabled = paymentData ? Boolean(paymentData.payments_enabled) : Boolean(savedSettings.payments_enabled);
        manualPaymentEnabled = paymentData ? Boolean(paymentData.manual_payment_enabled) : false;
        manualPaymentSettings = paymentData || {};
        refreshDisplayedPrices();
        return;
    }
    if (!data) return;
    siteCurrency = data.payment_currency || 'NGN';
    paystackPublicKey = data.paystack_public_key || '';
    paymentsEnabled = Boolean(data.payments_enabled);
    manualPaymentEnabled = Boolean(data.manual_payment_enabled);
    manualPaymentSettings = data;
    localStorage.setItem('dttSiteSettings', JSON.stringify({ payment_currency: siteCurrency, paystack_public_key: paystackPublicKey, payments_enabled: paymentsEnabled }));
    refreshDisplayedPrices();
    if (data.seo_title) document.title = data.seo_title;
    const heroEyebrow = document.getElementById('heroEyebrow');
    const heroTitle = document.getElementById('heroTitle');
    const heroDescription = document.getElementById('heroDescription');
    const heroButton = document.getElementById('heroButton');
    const heroImage = document.getElementById('heroImage');
    if (heroEyebrow && data.hero_eyebrow) heroEyebrow.textContent = data.hero_eyebrow;
    if (heroTitle && data.hero_title) heroTitle.textContent = data.hero_title;
    if (heroDescription && data.hero_description) heroDescription.textContent = data.hero_description;
    if (heroButton) {
        if (data.hero_button_text) heroButton.textContent = data.hero_button_text;
        if (data.hero_button_link) heroButton.href = data.hero_button_link;
    }
    if (heroImage && data.hero_image_url) {
        heroImage.style.backgroundImage = `linear-gradient(90deg, #dfe5d9 0%, rgba(223,229,217,.2) 42%), url('${data.hero_image_url}')`;
        const heroImageElement = heroImage.querySelector('img');
        if (heroImageElement) heroImageElement.src = data.hero_image_url;
    }
    if (data.logo_url) document.querySelectorAll('.logo').forEach(logo => {
        logo.innerHTML = `<img src="${data.logo_url}" alt="${data.store_name || 'DTT'}">`;
        logo.style.setProperty('--logo-width', `${Number(data.logo_width) || 96}px`);
    });
    if (data.favicon_url) {
        const icon = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }));
        icon.href = data.favicon_url;
    }
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    const contactAddress = document.getElementById('contactAddress');
    const contactHours = document.getElementById('contactHours');
    const contactInstagram = document.getElementById('contactInstagram');
    if (contactEmail && data.contact_email) { contactEmail.textContent = data.contact_email; contactEmail.href = `mailto:${data.contact_email}`; }
    if (contactPhone && data.contact_phone) { contactPhone.textContent = data.contact_phone; contactPhone.href = `tel:${data.contact_phone.replace(/[^+\d]/g, '')}`; }
    if (contactAddress && data.contact_address) contactAddress.textContent = data.contact_address;
    if (contactHours && data.contact_hours) contactHours.textContent = data.contact_hours;
    if (contactInstagram && data.contact_instagram) { contactInstagram.hidden = false; contactInstagram.href = data.contact_instagram; }
}

const DEFAULT_PRODUCT_IMAGE = 'https://placehold.co/900x1100/e8e1d4/1d2522?text=Add+product+image';
const PRODUCTS = [
    ['Cakes and pastries', 'Food'], ['Food trays or food bowls', 'Food'], ['Jewelry', 'Jewelry'], ['Lip gloss or lip balm', 'Beauty'],
    ['Hair accessories', 'Accessories'], ['Dresses and outfits', 'Fashion'], ['Perfumes and body spray', 'Perfumes'], ['Wrist watches', 'Accessories'],
    ['Room and wall decor', 'Decor'], ['Tattoo stickers', 'Accessories'], ['Money bouquet', 'Gifts'], ['Birthday and gift packages', 'Gifts'],
    ['Face, under-eye and lip masks', 'Beauty'], ['Mini fan', 'Gadgets'], ['Water bottles and fancy cups', 'Gadgets'], ['Tripod', 'Gadgets'], ['Fancy mirrors', 'Decor']
].map(([name, category], index) => ({ id: index + 1, name, category, price: 0, image: DEFAULT_PRODUCT_IMAGE, description: 'Add product description.' }));

function setFormMessage(elementId, message, isError = true) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `form-message ${isError ? 'is-error' : 'is-success'}`;
    }
}

function authErrorMessage(error) {
    if (error?.message?.toLowerCase().includes('rate limit')) {
        return 'Supabase email limit reached. Wait a little while, or disable email confirmation during development in Supabase Auth settings.';
    }
    return error?.message || 'Something went wrong. Please try again.';
}

async function redirectAfterAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
    window.location.href = profile?.role === 'admin' ? 'admin.html' : 'account.html';
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    if (!validateEmail(email) || !password) {
        setFormMessage('loginMessage', 'Enter a valid email and password.');
        return false;
    }
    if (!supabaseClient) {
        setFormMessage('loginMessage', 'Connect your Supabase URL and anon key in DTT.js first.');
        return false;
    }
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            setFormMessage('loginMessage', authErrorMessage(error));
            return false;
        }
    } catch (error) {
        setFormMessage('loginMessage', 'Unable to connect to DTT. Check your internet connection and try again.');
        return false;
    } finally {
        button.disabled = false;
    }
    setFormMessage('loginMessage', 'Signed in. Taking you to DTT...', false);
    window.setTimeout(redirectAfterAuth, 500);
    return false;
}

async function registerUser(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    if (!name || !validateEmail(email) || password.length < 6 || !document.getElementById('terms').checked) {
        setFormMessage('registerMessage', 'Complete every field and use a password with at least 6 characters.');
        return false;
    }
    if (!supabaseClient) {
        setFormMessage('registerMessage', 'Connect your Supabase URL and anon key in DTT.js first.');
        return false;
    }
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    let data;
    try {
        const result = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: name } } });
        data = result.data;
        if (result.error) {
            setFormMessage('registerMessage', authErrorMessage(result.error));
            return false;
        }
    } catch (error) {
        setFormMessage('registerMessage', 'Unable to connect to DTT. Check your internet connection and try again.');
        return false;
    } finally {
        button.disabled = false;
    }
    setFormMessage('registerMessage', data.session ? 'Account created. Welcome to DTT.' : 'Account created. Check your email to confirm it.', false);
    if (data.session) window.setTimeout(redirectAfterAuth, 700);
    return false;
}

document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
document.getElementById('registerForm')?.addEventListener('submit', registerUser);

document.getElementById('forgotPassword')?.addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    if (!validateEmail(email)) {
        setFormMessage('loginMessage', 'Enter your email first, then choose forgot password.');
        return;
    }
    if (!supabaseClient) {
        setFormMessage('loginMessage', 'Connect your Supabase URL and anon key in DTT.js first.');
        return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login.html` });
    setFormMessage('loginMessage', error ? authErrorMessage(error) : 'Password reset instructions sent.', Boolean(error));
});

// Function to validate login form
function validateLoginForm() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    let valid = true;

    if (!email || !validateEmail(email)) {
        alert('Please enter a valid email address.');
        valid = false;
    }

    if (!password) {
        alert('Please enter your password.');
        valid = false;
    }

    return valid;
}

// Function to validate registration form
function validateRegistrationForm() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const terms = document.getElementById('terms').checked;
    let valid = true;

    if (!name) {
        alert('Please enter your name.');
        valid = false;
    }

    if (!email || !validateEmail(email)) {
        alert('Please enter a valid email address.');
        valid = false;
    }

    if (!password) {
        alert('Please enter your password.');
        valid = false;
    }

    if (!terms) {
        alert('You must accept the terms and conditions.');
        valid = false;
    }

    return valid;
}

// Function to validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Function to handle product search
function searchProducts() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    } else {
        alert('Please enter a search term.');
    }
}

// Function to update cart count
function updateCartCount(count) {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.innerText = count;
}

async function initializeAccountPage() {
    const accountPage = document.querySelector('.account-page');
    if (!accountPage || !supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.replace('login.html');
        return;
    }

    const user = session.user;
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name, created_at')
        .eq('id', user.id)
        .maybeSingle();
    if (profile?.role === 'admin') {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.hidden = false;
    }
    const fullName = profile?.full_name || user.user_metadata?.full_name || 'shopper';
    document.getElementById('accountName').textContent = fullName.split(' ')[0];
    document.getElementById('accountEmail').textContent = user.email || '';
    document.getElementById('profileName').textContent = fullName;
    document.getElementById('profileEmail').textContent = user.email || 'Not available';
    document.getElementById('memberSince').textContent = new Date(profile?.created_at || user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('id, status, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    const orderList = document.getElementById('accountOrders');
    if (error) {
        orderList.innerHTML = '<p class="muted-copy">Your order history is not available yet.</p>';
    } else if (!orders?.length) {
        orderList.innerHTML = '<div class="account-empty"><strong>No orders yet.</strong><span>Your next find is waiting.</span><a href="products.html">Browse products &#8594;</a></div>';
    } else {
        orderList.innerHTML = orders.map(order => `
            <div class="order-row"><div><strong>Order #${order.id.slice(0, 8)}</strong><span>${new Date(order.created_at).toLocaleDateString()}</span></div><div><strong>${formatMoney(order.total)}</strong><span class="order-status">${order.status}</span></div></div>`).join('');
    }
}

async function updateAccountLinks() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    document.querySelectorAll('a[href="login.html"]').forEach(link => {
        if (session) {
            link.href = 'account.html';
            link.textContent = 'Account';
        }
    });
}

function adminTable(headers, rows) {
    if (!rows.length) return '<p class="admin-muted">No records found.</p>';
    return `<table class="admin-table"><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function productSlug(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resetProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    form.reset();
    form.elements.id.value = '';
    form.is_active.checked = true;
    document.getElementById('variationList')?.replaceChildren();
    document.getElementById('productSaveButton').textContent = 'Add product';
    document.getElementById('productFormTitle').textContent = 'Add a product';
    updateProductImagePreview('');
}

function updateProductImagePreview(url) {
    const preview = document.getElementById('productImagePreview');
    if (!preview) return;
    preview.innerHTML = url ? `<img src="${url}" alt="Product preview" onerror="this.parentElement.innerHTML = '<span>Image could not load</span>'">` : '<span>Image preview</span>';
}

function previewSelectedProductImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => updateProductImagePreview(reader.result));
    reader.readAsDataURL(file);
}

async function uploadProductImage(file, slug) {
    const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${slug}-${uniqueUploadId()}.${extension}`;
    const { error } = await supabaseClient.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    return supabaseClient.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

async function uploadProductImages(files, slug) {
    return Promise.all(Array.from(files).map(file => uploadProductImage(file, slug)));
}

function addVariationRow(values = {}) {
    const list = document.getElementById('variationList');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'variation-row';
    row.innerHTML = `<input name="variation_name" placeholder="Option (e.g. Color)" value="${escapeHtml(values.name || '')}"><input name="variation_value" placeholder="Value (e.g. Black)" value="${escapeHtml(values.value || '')}"><input name="variation_stock" type="number" min="0" placeholder="Stock" value="${values.stock ?? ''}"><button type="button" class="table-action danger remove-variation">Remove</button>`;
    row.querySelector('.remove-variation').addEventListener('click', () => row.remove());
    list.appendChild(row);
}

function getVariationRows() {
    return Array.from(document.querySelectorAll('.variation-row')).map(row => ({
        name: row.querySelector('[name="variation_name"]').value.trim(),
        value: row.querySelector('[name="variation_value"]').value.trim(),
        stock: Number(row.querySelector('[name="variation_stock"]').value || 0)
    })).filter(variation => variation.name && variation.value);
}

async function uploadSiteAsset(file, name) {
    if (file.size > 5 * 1024 * 1024) throw new Error('Please choose an image smaller than 5 MB.');
    const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `site/${name}-${uniqueUploadId()}.${extension}`;
    const { error } = await supabaseClient.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    return supabaseClient.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

function uniqueUploadId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fillProductForm(product) {
    const form = document.getElementById('productForm');
    form.elements.id.value = product.id;
    form.name.value = product.name;
    form.description.value = product.description || '';
    form.price.value = product.price;
    if (form.compare_at_price) form.compare_at_price.value = product.compare_at_price || '';
    form.stock.value = product.stock;
    form.category_id.value = product.category_id || '';
    form.image_url.value = product.image_url || '';
    form.is_active.checked = product.is_active;
    document.getElementById('productSaveButton').textContent = 'Save changes';
    document.getElementById('productFormTitle').textContent = 'Edit product';
    updateProductImagePreview(product.image_url || '');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function initializeAdminPage() {
    const adminPage = document.querySelector('.admin-page');
    if (!adminPage || !supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.replace('login.html');
        return;
    }
    const { data: profile } = await supabaseClient.from('profiles').select('full_name, role').eq('id', session.user.id).maybeSingle();
    if (profile?.role !== 'admin') {
        window.location.replace('account.html');
        return;
    }
    const priceField = document.querySelector('#productForm [name="price"]');
    const imageInput = document.getElementById('productImageFile');
    imageInput?.setAttribute('multiple', 'multiple');
    imageInput?.closest('.upload-field')?.childNodes[0] && (imageInput.closest('.upload-field').childNodes[0].textContent = 'Upload images from device');
    if (priceField && !document.querySelector('#productForm [name="compare_at_price"]')) {
        const label = document.createElement('label');
        label.innerHTML = 'Original price <span class="field-hint">optional, for sale badges</span><input name="compare_at_price" type="number" min="0" step="0.01" placeholder="Before sale price">';
        priceField.closest('label')?.after(label);
    }
    const productForm = document.getElementById('productForm');
    if (productForm && !document.getElementById('variationList')) {
        const variations = document.createElement('div');
        variations.className = 'settings-section-label';
        variations.innerHTML = 'Variations <button type="button" class="text-button" id="addVariationButton">Add variation +</button><div id="variationList" class="variation-list"></div>';
        productForm.querySelector('.product-form-main')?.after(variations);
        document.getElementById('addVariationButton').addEventListener('click', () => addVariationRow());
    }
    document.getElementById('adminName').textContent = (profile.full_name || 'admin').split(' ')[0];
    const deliveryTab = document.querySelector('[data-tab="delivery"]');
    if (deliveryTab && !document.getElementById('admin-delivery')) {
        document.querySelector('.admin-content').insertAdjacentHTML('beforeend', '<div class="admin-view" id="admin-delivery"><p class="eyebrow">Shipping</p><h1>Delivery fees</h1><p class="admin-muted">Set the delivery fee for each Nigerian state.</p><form id="deliveryForm" class="admin-panel settings-form"><label>State<input name="state" placeholder="e.g. Lagos" required></label><label>Delivery fee<input name="fee" type="number" min="0" step="0.01" placeholder="0.00" required></label><label class="check-row"><input name="is_active" type="checkbox" checked><span>Available at checkout</span></label><div class="admin-form-actions"><button class="primary-button" type="submit">Save delivery zone</button><button class="outline-button" type="button" id="deliveryCancel">Clear</button></div><p class="form-message" id="deliveryMessage" role="status"></p></form><section class="admin-panel"><div id="deliveryTable" class="admin-table-wrap"></div></section></div>');
    }
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm && !settingsForm.querySelector('[name="contact_email"]')) {
        const section = document.createElement('div');
        section.className = 'settings-section-label';
        section.textContent = 'Contact details';
        settingsForm.insertBefore(section, settingsForm.querySelector('button[type="submit"]'));
        section.insertAdjacentHTML('afterend', '<label>Contact email<input name="contact_email" type="email" placeholder="hello@example.com"></label><label>Contact phone<input name="contact_phone" type="tel" placeholder="+234 800 000 0000"></label><label>Store address<textarea name="contact_address" rows="2" placeholder="Your store address"></textarea></label><label>Opening hours<input name="contact_hours" placeholder="Monday - Saturday, 9:00 AM - 6:00 PM"></label><label>Instagram URL<input name="contact_instagram" type="url" placeholder="https://instagram.com/..."></label>');
    }
    const [{ data: orders }, { data: products }, { data: users }, { data: settings }, { data: coupons }] = await Promise.all([
        supabaseClient.from('orders').select('id, user_id, status, total, shipping_address, created_at').order('created_at', { ascending: false }),
        supabaseClient.from('products').select('id, category_id, name, slug, description, price, compare_at_price, stock, is_active, product_images(image_url, sort_order)').order('created_at', { ascending: false }),
        supabaseClient.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false }),
        supabaseClient.from('site_settings').select('*').eq('id', true).maybeSingle(),
        supabaseClient.from('coupons').select('*').order('created_at', { ascending: false })
    ]);
    const { data: deliveryZones } = await supabaseClient.from('delivery_zones').select('*').order('state');
    const { data: pendingPayments } = await supabaseClient.from('orders').select('id, total, shipping_address, payment_proof_url, created_at').eq('payment_method', 'manual_bank_transfer').eq('payment_status', 'pending').order('created_at', { ascending: false });
    const safeOrders = orders || [];
    const safeProducts = products || [];
    const safeUsers = users || [];
    document.getElementById('metricOrders').textContent = safeOrders.length;
    document.getElementById('metricRevenue').textContent = formatMoney(safeOrders.reduce((sum, order) => sum + Number(order.total), 0));
    document.getElementById('metricUsers').textContent = safeUsers.length;
    document.getElementById('metricProducts').textContent = safeProducts.length;
    const orderStatuses = ['pending', 'confirmed', 'declined', 'on the way', 'delivered'];
    const orderRows = safeOrders.map(order => { const address = order.shipping_address || {}; const deliveryAddress = [address.name, address.phone, address.email, address.address, address.city, address.state, address.postal_code, address.country].filter(Boolean); const addressMarkup = deliveryAddress.length ? deliveryAddress.map((value, index) => `<span>${escapeHtml(value)}</span>`).join('') : '<span>No address provided</span>'; return `<tr><td>#${order.id.slice(0, 8)}</td><td>${order.user_id.slice(0, 8)}</td><td>${formatMoney(order.total)}</td><td><address class="admin-address">${addressMarkup}</address></td><td><select class="status-select" data-order-id="${order.id}">${orderStatuses.map(status => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></td><td>${new Date(order.created_at).toLocaleDateString()}</td></tr>`; });
    const productRows = safeProducts.map(product => `<tr><td>${product.name}</td><td>${formatMoney(product.price)}</td><td>${product.stock}</td><td>${product.is_active ? 'Active' : 'Hidden'}</td><td><button class="table-action" data-product-action="edit" data-product-id="${product.id}">Edit</button><button class="table-action danger" data-product-action="delete" data-product-id="${product.id}">Delete</button></td></tr>`);
    const userRows = safeUsers.map(user => `<tr><td>${user.full_name}</td><td>${user.id.slice(0, 8)}</td><td>${user.role}</td><td>${new Date(user.created_at).toLocaleDateString()}</td></tr>`);
    document.getElementById('overviewOrders').innerHTML = adminTable(['Order', 'User', 'Total', 'Delivery address', 'Status', 'Date'], orderRows.slice(0, 5));
    document.getElementById('ordersTable').innerHTML = adminTable(['Order', 'User', 'Total', 'Delivery address', 'Status', 'Date'], orderRows);
    document.getElementById('productsTable').innerHTML = adminTable(['Product', 'Price', 'Stock', 'Visibility', 'Actions'], productRows);
    document.getElementById('usersTable').innerHTML = adminTable(['Name', 'User ID', 'Role', 'Joined'], userRows);
    const zones = deliveryZones || [];
    document.getElementById('deliveryTable').innerHTML = adminTable(['State', 'Fee', 'Status', 'Actions'], zones.map(zone => `<tr><td>${zone.state}</td><td>${formatMoney(zone.fee)}</td><td>${zone.is_active ? 'Active' : 'Hidden'}</td><td><button class="table-action" data-zone-edit="${zone.id}">Edit</button><button class="table-action danger" data-zone-delete="${zone.id}">Delete</button></td></tr>`));
    const deliveryForm = document.getElementById('deliveryForm');
    deliveryForm.addEventListener('submit', async event => { event.preventDefault(); const values = Object.fromEntries(new FormData(deliveryForm)); const { error } = await supabaseClient.from('delivery_zones').upsert({ state: values.state.trim(), fee: Number(values.fee), is_active: deliveryForm.is_active.checked, updated_at: new Date().toISOString() }, { onConflict: 'state' }); setFormMessage('deliveryMessage', error ? error.message : 'Delivery fee saved.', Boolean(error)); if (!error) window.location.reload(); });
    document.getElementById('deliveryCancel').addEventListener('click', () => deliveryForm.reset());
    document.querySelectorAll('[data-zone-edit]').forEach(button => button.addEventListener('click', () => { const zone = zones.find(item => String(item.id) === button.dataset.zoneEdit); if (zone) { deliveryForm.state.value = zone.state; deliveryForm.fee.value = zone.fee; deliveryForm.is_active.checked = zone.is_active; deliveryForm.scrollIntoView({ behavior: 'smooth' }); } }));
    document.querySelectorAll('[data-zone-delete]').forEach(button => button.addEventListener('click', async () => { if (!window.confirm('Delete this delivery zone?')) return; const { error } = await supabaseClient.from('delivery_zones').delete().eq('id', button.dataset.zoneDelete); if (error) setFormMessage('deliveryMessage', error.message); else window.location.reload(); }));
    const couponRows = (coupons || []).map(coupon => `<tr><td>${coupon.code}</td><td>${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatMoney(coupon.discount_value)}</td><td>${coupon.minimum_order ? formatMoney(coupon.minimum_order) : '-'}</td><td>${coupon.is_active ? 'Active' : 'Inactive'}</td></tr>`);
    document.getElementById('couponsTable').innerHTML = adminTable(['Code', 'Discount', 'Minimum order', 'Status'], couponRows);
    document.getElementById('pendingPayments').innerHTML = adminTable(['Customer', 'Amount', 'Proof', 'Date', 'Action'], (pendingPayments || []).map(order => `<tr><td>${escapeHtml(order.shipping_address?.name || 'Customer')}<br><small>${escapeHtml(order.shipping_address?.phone || '')}</small></td><td>${formatMoney(order.total)}</td><td>${order.payment_proof_url ? `<a href="${order.payment_proof_url}" target="_blank" rel="noopener">View proof</a>` : 'Missing'}</td><td>${new Date(order.created_at).toLocaleDateString()}</td><td><button class="table-action" data-payment-action="paid" data-order-id="${order.id}">Confirm</button><button class="table-action danger" data-payment-action="declined" data-order-id="${order.id}">Decline</button></td></tr>`));
    document.querySelectorAll('[data-payment-action]').forEach(button => button.addEventListener('click', async () => { const action = button.dataset.paymentAction; const update = await supabaseClient.from('orders').update({ payment_status: action === 'paid' ? 'paid' : 'failed', status: action === 'paid' ? 'confirmed' : 'declined', updated_at: new Date().toISOString() }).eq('id', button.dataset.orderId); if (!update.error) window.location.reload(); }));
    document.querySelectorAll('.status-select').forEach(select => select.addEventListener('change', async event => {
        const { error } = await supabaseClient.from('orders').update({ status: event.target.value, updated_at: new Date().toISOString() }).eq('id', event.target.dataset.orderId);
        if (error) event.target.value = 'pending';
    }));
    const categoryResult = await supabaseClient.from('categories').select('id, name').order('name');
    document.getElementById('productCategory').innerHTML = (categoryResult.data || []).map(category => `<option value="${category.id}">${category.name}</option>`).join('');
    document.querySelectorAll('[data-product-action="edit"]').forEach(button => button.addEventListener('click', () => {
        const product = safeProducts.find(item => String(item.id) === button.dataset.productId);
        if (product) {
            fillProductForm({ ...product, image_url: product.product_images?.sort((first, second) => first.sort_order - second.sort_order)[0]?.image_url || '' });
            (product.product_variations || []).forEach(addVariationRow);
        }
    }));
    document.querySelectorAll('[data-product-action="delete"]').forEach(button => button.addEventListener('click', async () => {
        if (!window.confirm('Delete this product? This cannot be undone.')) return;
        const { error } = await supabaseClient.from('products').delete().eq('id', button.dataset.productId);
        if (error) {
            setFormMessage('productMessage', error.message);
            return;
        }
        window.location.reload();
    }));
    document.getElementById('productForm').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.target;
        const saveButton = document.getElementById('productSaveButton');
            const values = Object.fromEntries(new FormData(form));
        const selectedFiles = document.getElementById('productImageFile').files;
        if (!selectedFiles.length && !values.image_url.trim()) {
            setFormMessage('productMessage', 'Upload an image or provide an image URL.');
            return;
        }
        const slug = productSlug(values.name);
        const compareAtPrice = values.compare_at_price ? Number(values.compare_at_price) : null;
        if (compareAtPrice !== null && compareAtPrice <= Number(values.price)) {
            setFormMessage('productMessage', 'Original price must be higher than the sale price.');
            return;
        }
        const productData = { name: values.name.trim(), slug, description: values.description.trim(), price: Number(values.price), compare_at_price: compareAtPrice, stock: Number(values.stock), category_id: Number(values.category_id), is_active: form.is_active.checked, updated_at: new Date().toISOString() };
        saveButton.disabled = true;
        try {
            if (selectedFiles.length) values.image_urls = await uploadProductImages(selectedFiles, slug);
        } catch (error) {
            setFormMessage('productMessage', error.message || 'The image could not be uploaded.');
            saveButton.disabled = false;
            return;
        }
        const productId = values.id;
        const result = productId
            ? await supabaseClient.from('products').update(productData).eq('id', productId).select('id').single()
            : await supabaseClient.from('products').insert(productData).select('id').single();
        if (result.error) {
            setFormMessage('productMessage', result.error.message);
            saveButton.disabled = false;
            return;
        }
        const savedId = productId || result.data.id;
        await supabaseClient.from('product_images').delete().eq('product_id', savedId);
        const imageUrls = values.image_urls || [values.image_url.trim()];
        const imageResult = await supabaseClient.from('product_images').insert(imageUrls.map((imageUrl, index) => ({ product_id: savedId, image_url: imageUrl, alt_text: values.name.trim(), sort_order: index })));
        if (imageResult.error) {
            setFormMessage('productMessage', imageResult.error.message);
            saveButton.disabled = false;
            return;
        }
        await supabaseClient.from('product_variations').delete().eq('product_id', savedId);
        const variationResult = await supabaseClient.from('product_variations').insert(getVariationRows().map(variation => ({ product_id: savedId, name: variation.name, value: variation.value, stock: variation.stock })));
        if (variationResult.error) {
            setFormMessage('productMessage', variationResult.error.message);
            saveButton.disabled = false;
            return;
        }
        window.location.reload();
    });
    document.getElementById('productCancelButton').addEventListener('click', resetProductForm);
    document.querySelector('#productForm [name="image_url"]').addEventListener('input', event => updateProductImagePreview(event.target.value.trim()));
    document.getElementById('productImageFile').addEventListener('change', event => previewSelectedProductImage(event.target.files[0]));
    document.getElementById('newProductButton').addEventListener('click', () => {
        resetProductForm();
        document.getElementById('productForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (settings) {
        Object.entries(settings).forEach(([key, value]) => {
            const field = document.querySelector(`#settingsForm [name="${key}"]`);
            if (field) field.value = value || '';
        });
        document.getElementById('paystackPublicKey').value = settings.paystack_public_key || '';
        document.getElementById('paymentCurrency').value = settings.payment_currency || 'NGN';
        document.getElementById('paymentsEnabled').checked = settings.payments_enabled;
        document.getElementById('siteCurrency').value = settings.payment_currency || 'NGN';
    }
    document.getElementById('settingsForm').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.target;
        const values = Object.fromEntries(new FormData(form));
        try {
            if (form.hero_image_file.files[0]) values.hero_image_url = await uploadSiteAsset(form.hero_image_file.files[0], 'hero');
            if (form.logo_file.files[0]) values.logo_url = await uploadSiteAsset(form.logo_file.files[0], 'logo');
            if (form.favicon_file.files[0]) values.favicon_url = await uploadSiteAsset(form.favicon_file.files[0], 'favicon');
        } catch (error) {
            setFormMessage('settingsMessage', error.message || 'Asset upload failed.');
            return;
        }
        delete values.logo_file;
        delete values.favicon_file;
        delete values.hero_image_file;
        const { error } = await supabaseClient.from('site_settings').upsert({ id: true, ...values, updated_at: new Date().toISOString() });
        setFormMessage('settingsMessage', error ? error.message : 'Site settings saved.', Boolean(error));
    });
    document.getElementById('savePayments').addEventListener('click', async () => {
        const paymentSettings = { paystack_public_key: document.getElementById('paystackPublicKey').value.trim(), payment_currency: document.getElementById('paymentCurrency').value.trim().toUpperCase(), payments_enabled: document.getElementById('paymentsEnabled').checked, manual_payment_enabled: document.getElementById('manualPaymentEnabled').checked, bank_name: document.getElementById('bankName').value.trim(), bank_account_name: document.getElementById('bankAccountName').value.trim(), bank_account_number: document.getElementById('bankAccountNumber').value.trim(), bank_instructions: document.getElementById('bankInstructions').value.trim() };
        const { error } = await supabaseClient.from('site_settings').upsert({ id: true, ...paymentSettings, updated_at: new Date().toISOString() });
        if (!error) localStorage.setItem('dttSiteSettings', JSON.stringify(paymentSettings));
        setFormMessage('paymentsMessage', error ? error.message : 'Payment settings saved.', Boolean(error));
    });
    document.getElementById('couponForm').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.target;
        const values = Object.fromEntries(new FormData(form));
        const { error } = await supabaseClient.from('coupons').insert({ code: values.code.trim().toUpperCase(), discount_type: values.discount_type, discount_value: Number(values.discount_value), minimum_order: Number(values.minimum_order || 0), usage_limit: values.usage_limit ? Number(values.usage_limit) : null, expires_at: values.expires_at || null, is_active: form.is_active.checked });
        setFormMessage('couponAdminMessage', error ? error.message : 'Coupon created.', Boolean(error));
        if (!error) window.location.reload();
    });
}

document.querySelectorAll('.admin-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab, .admin-view').forEach(element => element.classList.remove('is-active'));
    tab.classList.add('is-active');
    document.getElementById(`admin-${tab.dataset.tab}`).classList.add('is-active');
}));
document.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => document.querySelector(`[data-tab="${button.dataset.jump}"]`)?.click()));

document.getElementById('signOutButton')?.addEventListener('click', async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.replace('login.html');
});

document.getElementById('adminSignOut')?.addEventListener('click', async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.replace('login.html');
});

function fetchFeaturedProducts() {
    const productGrid = document.getElementById('homeProducts');
    if (!productGrid) return;
    productGrid.innerHTML = '';
        const featured = catalog.filter(product => product.isFeatured).slice(0, 4);
        (featured.length ? featured : catalog.slice(0, 4)).forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p data-price="${product.price}">${formatMoney(product.price)}</p>
            ${productCardActions(product)}
        `;
        productGrid.appendChild(productCard);
    });
    bindAddToCartButtons(productGrid);
}

function renderFeaturedProducts(catalog) {
    const productGrid = document.getElementById('homeProducts');
    if (!productGrid) return;
    productGrid.innerHTML = '';
    const featured = catalog.filter(product => product.isFeatured).slice(0, 4);
    (featured.length ? featured : catalog.slice(0, 4)).forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `<img src="${product.image}" alt="${product.name}"><h3>${product.name}</h3><p data-price="${product.price}">${formatMoney(product.price)}</p>${productCardActions(product)}`;
        productGrid.appendChild(productCard);
    });
    bindAddToCartButtons(productGrid);
}

function mapDatabaseProduct(product) {
    const image = product.product_images?.sort((first, second) => first.sort_order - second.sort_order)[0];
    return {
        id: product.id,
        name: product.name,
        category: product.categories?.name || 'DTT collection',
        price: Number(product.price),
        compareAtPrice: product.compare_at_price ? Number(product.compare_at_price) : null,
        isFeatured: Boolean(product.is_featured),
        image: image?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
        images: [...new Set((product.product_images || []).sort((first, second) => first.sort_order - second.sort_order).map(item => item.image_url))],
        variations: product.product_variations || [],
        description: product.description || 'A considered find from the DTT collection.'
    };
}

async function loadProductsFromSupabase() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient
        .from('products')
        .select('id, name, description, price, compare_at_price, is_featured, categories(name), product_images(image_url, alt_text, sort_order), product_variations(id, name, value, stock, price_adjustment)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (error || !data?.length) return;

    const products = data.map(mapDatabaseProduct);
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price" data-price="${product.price}">${formatMoney(product.price)}</p>
                ${productCardActions(product)}
            </div>`).join('');
            bindAddToCartButtons(productGrid);
    }
    window.DTT_PRODUCTS = products;
    renderFeaturedProducts(products);
}

function renderDeals() {
    const container = document.getElementById('dealsGrid');
    if (!container) return;
        const catalog = window.DTT_PRODUCTS || [];
    const deals = catalog.filter(product => (product.compareAtPrice && product.compareAtPrice > product.price) || product.isFeatured).slice(0, 12);
    if (!deals.length) {
        container.innerHTML = '<div class="empty-state"><p class="eyebrow">Coming soon</p><h1>Fresh offers are on the way.</h1><a href="products.html" class="hero-button">Browse products</a></div>';
        return;
    }
    container.innerHTML = deals.map(product => `<div class="product-card deal-card"><div class="deal-badge">${product.compareAtPrice ? 'Sale' : 'Featured'}</div><img src="${product.image}" alt="${product.name}"><h3>${product.name}</h3><p class="deal-price"><strong>${formatMoney(product.price)}</strong>${product.compareAtPrice ? `<del>${formatMoney(product.compareAtPrice)}</del>` : ''}</p>${productCardActions(product)}</div>`).join('');
    bindAddToCartButtons(container);
}

function renderCategoryProducts() {
    const container = document.getElementById('categoryProducts');
    if (!container) return;
    const category = new URLSearchParams(window.location.search).get('category');
    const catalog = window.DTT_PRODUCTS || PRODUCTS;
    const filtered = category ? catalog.filter(product => product.category.toLowerCase() === category.toLowerCase() || product.category.toLowerCase().replace(/s$/, '') === category.toLowerCase()) : catalog;
    document.getElementById('categoryTitle').textContent = category ? `${category.charAt(0).toUpperCase()}${category.slice(1)} products` : 'All category products';
    if (!filtered.length) {
        container.innerHTML = '<p class="muted-copy">No products are available in this category yet.</p>';
        return;
    }
    container.innerHTML = filtered.map(product => `<div class="product-card"><img src="${product.image}" alt="${product.name}"><h3>${product.name}</h3><p class="price" data-price="${product.price}">${formatMoney(product.price)}</p>${productCardActions(product)}</div>`).join('');
    bindAddToCartButtons(container);
}

function getCart() {
    try {
        return JSON.parse(localStorage.getItem('dttCart') || '[]');
    } catch (error) {
        return [];
    }
}

function addToCart(productId) {
    const cart = getCart();
    cart.push(productId);
    localStorage.setItem('dttCart', JSON.stringify(cart));
    updateCartCount(cart.length);
    const message = document.getElementById('cartMessage');
    if (message) message.textContent = 'Added to your cart.';
    renderCart();
}

function productCardActions(product) {
    return `<div class="product-card-actions"><a href="product.html?id=${product.id}" class="product-button">View details &#8594;</a><button type="button" class="icon-button add-card-button" data-product-id="${product.id}" aria-label="Add ${product.name} to cart" title="Add to cart">&#43;</button></div>`;
}

function bindAddToCartButtons(container) {
    container?.querySelectorAll('.add-card-button').forEach(button => button.addEventListener('click', () => addToCart(Number(button.dataset.productId))));
}

function enhanceStaticProductCards() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.querySelectorAll('.product-card').forEach(card => {
        const link = card.querySelector('a[href*="product.html?id="]');
        if (!link || card.querySelector('.add-card-button')) return;
        const productId = new URL(link.href, window.location.href).searchParams.get('id');
        const product = PRODUCTS.find(item => String(item.id) === productId) || { id: productId, name: card.querySelector('h3')?.textContent || 'product' };
        link.insertAdjacentHTML('afterend', `<button type="button" class="icon-button add-card-button" data-product-id="${product.id}" aria-label="Add ${product.name} to cart" title="Add to cart">&#43;</button>`);
    });
    bindAddToCartButtons(grid);
}

function saveCart(cart) {
    localStorage.setItem('dttCart', JSON.stringify(cart));
    updateCartCount(cart.length);
}

function changeCartQuantity(productId, amount) {
    const cart = getCart();
    const productIndex = cart.indexOf(productId);
    if (productIndex === -1) return;
    if (amount > 0) cart.push(productId);
    if (amount < 0) cart.splice(productIndex, 1);
    saveCart(cart);
    renderCart();
}

function removeFromCart(productId) {
    saveCart(getCart().filter(item => item !== productId));
    renderCart();
}

function renderCart() {
    const container = document.getElementById('orderHistory');
    if (!container) return;
    const catalog = window.DTT_PRODUCTS || PRODUCTS;
    const cart = getCart();
    const quantities = cart.reduce((result, productId) => {
        result[productId] = (result[productId] || 0) + 1;
        return result;
    }, {});
    const items = Object.entries(quantities)
        .map(([id, quantity]) => ({ product: catalog.find(item => String(item.id) === String(id)), quantity }))
        .filter(item => item.product);
    if (!items.length) {
        container.innerHTML = '<div class="cart-empty"><p class="eyebrow">Your cart</p><h2>Nothing here yet.</h2><p>Find something you love and it will appear here.</p><a href="products.html" class="hero-button">Browse products</a></div>';
        return;
    }
    const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
    container.innerHTML = `
        <div class="cart-list">${items.map(({ product, quantity }) => `
            <article class="cart-item">
                <img src="${product.image}" alt="${product.name}">
                <div class="cart-item-info"><p class="eyebrow">${product.category}</p><h3>${product.name}</h3><strong>${formatMoney(product.price)}</strong></div>
                <div class="quantity-control"><button type="button" data-cart-action="decrease" data-product-id="${product.id}" aria-label="Remove one ${product.name}">&#8722;</button><span>${quantity}</span><button type="button" data-cart-action="increase" data-product-id="${product.id}" aria-label="Add one ${product.name}">+</button></div>
                <button type="button" class="remove-item" data-cart-action="remove" data-product-id="${product.id}">Remove</button>
            </article>`).join('')}</div>
        <div class="cart-summary"><div><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div><p>Shipping and taxes calculated at checkout.</p><button type="button" class="primary-button" id="checkoutButton">Proceed to checkout <span aria-hidden="true">&#8594;</span></button><p class="form-message" id="checkoutMessage" role="status"></p></div>`;
    container.querySelectorAll('[data-cart-action]').forEach(button => {
        button.addEventListener('click', () => {
            const productId = Number(button.dataset.productId);
            const action = button.dataset.cartAction;
            if (action === 'remove') removeFromCart(productId);
            if (action === 'increase') changeCartQuantity(productId, 1);
            if (action === 'decrease') changeCartQuantity(productId, -1);
        });
    });
    document.getElementById('checkoutButton').addEventListener('click', async () => {
        window.location.href = 'checkout.html';
    });
}

async function initializeCheckoutPage() {
    const checkoutPage = document.querySelector('.checkout-page');
    if (!checkoutPage || !supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.replace('login.html');
        return;
    }
    const catalog = window.DTT_PRODUCTS || PRODUCTS;
    const quantities = getCart().reduce((result, productId) => {
        result[productId] = (result[productId] || 0) + 1;
        return result;
    }, {});
    const items = Object.entries(quantities)
        .map(([id, quantity]) => ({ product: catalog.find(item => String(item.id) === String(id)), quantity }))
        .filter(item => item.product);
    if (!items.length) {
        window.location.replace('products.html');
        return;
    }
    checkoutItems = items;
    document.getElementById('checkoutEmail').value = session.user.email || '';
    document.getElementById('checkoutPhone').value = session.user.user_metadata?.phone || '';
    document.getElementById('checkoutName').value = session.user.user_metadata?.full_name || '';
    const zoneResult = await supabaseClient.from('delivery_zones').select('state, fee').eq('is_active', true).order('state');
    const stateSelect = document.getElementById('checkoutState');
    if (stateSelect) {
        stateSelect.innerHTML = '<option value="">Select your state</option>' + (zoneResult.data || []).map(zone => `<option value="${zone.state}" data-fee="${zone.fee}">${zone.state} - ${formatMoney(zone.fee)} delivery</option>`).join('');
        stateSelect.addEventListener('change', event => {
            checkoutDeliveryFee = Number(event.target.selectedOptions[0]?.dataset.fee || 0);
            renderCheckoutTotals();
        });
    }
    renderCheckoutTotals();
    const manualPanel = document.getElementById('manualPaymentPanel');
    const manualOption = document.querySelector('input[name="payment_method"][value="manual"]');
    const paymentSubmit = document.querySelector('#checkoutForm > .primary-button');
    if (manualOption) {
        manualOption.closest('.payment-option').classList.toggle('is-unavailable', !manualPaymentEnabled);
        manualOption.closest('.payment-option').title = manualPaymentEnabled ? '' : 'Bank transfer has not been enabled by the store yet.';
        manualOption.addEventListener('change', () => {
            document.getElementById('paymentProof').required = true;
            manualPanel.hidden = false;
            paymentSubmit.hidden = true;
            document.getElementById('bankDetails').innerHTML = `<div class="bank-detail"><span>Bank</span><strong>${escapeHtml(manualPaymentSettings.bank_name || 'Not configured')}</strong></div><div class="bank-detail"><span>Account name</span><strong>${escapeHtml(manualPaymentSettings.bank_account_name || 'Not configured')}</strong></div><div class="bank-detail"><span>Account number</span><strong>${escapeHtml(manualPaymentSettings.bank_account_number || 'Not configured')}</strong></div><p>${escapeHtml(manualPaymentSettings.bank_instructions || 'Make your transfer, then upload your proof of payment.')}</p>${manualPaymentEnabled ? '' : '<p class="form-message is-error">Bank transfer is not enabled yet. Please choose Paystack or contact the store.</p>'}`;
        });
        document.querySelector('input[name="payment_method"][value="paystack"]').addEventListener('change', () => { manualPanel.hidden = true; paymentSubmit.hidden = false; document.getElementById('paymentProof').required = false; });
        document.getElementById('manualPaidButton').addEventListener('click', () => submitManualPayment(session.user, items));
    }
    document.getElementById('applyCoupon').addEventListener('click', applyCheckoutCoupon);
    document.getElementById('checkoutForm').addEventListener('submit', event => placeOrder(event, session.user, items));
}

async function submitManualPayment(user, items) {
    const form = document.getElementById('checkoutForm');
    const message = document.getElementById('manualPaymentMessage');
    const proof = document.getElementById('paymentProof').files[0];
    if (!manualPaymentEnabled) { message.textContent = 'Bank transfer is not enabled by the store yet.'; message.className = 'form-message is-error'; return; }
    if (!form.checkValidity()) { message.textContent = 'Complete your delivery details first.'; message.className = 'form-message is-error'; return; }
    if (!proof) { message.textContent = 'Upload your proof of payment first.'; message.className = 'form-message is-error'; return; }
    if (proof.size > 8 * 1024 * 1024) { message.textContent = 'Proof must be smaller than 8 MB.'; message.className = 'form-message is-error'; return; }
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = couponDiscount(checkoutCoupon, subtotal);
    const total = subtotal - discount + checkoutDeliveryFee;
    const address = { name: form.checkoutName.value.trim(), phone: form.checkoutPhone.value.trim(), email: user.email, address: form.checkoutAddress.value.trim(), city: form.checkoutCity.value.trim(), state: form.checkoutState.value, postal_code: form.checkoutPostalCode.value.trim(), country: form.checkoutCountry.value.trim() };
    const button = document.getElementById('manualPaidButton');
    button.disabled = true;
    try {
        const { data: order, error: orderError } = await supabaseClient.from('orders').insert({ user_id: user.id, total, coupon_id: checkoutCoupon?.id || null, discount_amount: discount, payment_method: 'manual_bank_transfer', payment_status: 'pending', status: 'pending', shipping_address: address }).select('id').single();
        if (orderError) throw orderError;
        const extension = proof.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
        const path = `proofs/${order.id}-${uniqueUploadId()}.${extension}`;
        const upload = await supabaseClient.storage.from('payment-proofs').upload(path, proof, { cacheControl: '3600', upsert: false });
        if (upload.error) throw upload.error;
        const proofUrl = supabaseClient.storage.from('payment-proofs').getPublicUrl(path).data.publicUrl;
        const update = await supabaseClient.from('orders').update({ payment_proof_url: proofUrl }).eq('id', order.id);
        if (update.error) throw update.error;
        await supabaseClient.from('order_items').insert(items.map(item => ({ order_id: order.id, product_id: item.product.id, quantity: item.quantity, unit_price: item.product.price })));
        localStorage.removeItem('dttCart');
        window.location.href = 'account.html?payment=pending';
    } catch (error) { message.textContent = error.message || 'Could not submit your payment proof.'; message.className = 'form-message is-error'; button.disabled = false; }
}

function renderCheckoutTotals() {
    const subtotal = checkoutItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    const discount = couponDiscount(checkoutCoupon, subtotal);
    document.getElementById('checkoutItems').innerHTML = checkoutItems.map(({ product, quantity }) => `<div class="checkout-item"><span>${quantity} x ${product.name}</span><strong>${formatMoney(product.price * quantity)}</strong></div>`).join('') + (discount ? `<div class="checkout-item coupon-result"><span>Coupon discount</span><strong>-${formatMoney(discount)}</strong></div>` : '');
    document.getElementById('checkoutTotal').textContent = formatMoney(subtotal - discount + checkoutDeliveryFee);
    const deliveryLine = document.getElementById('checkoutDeliveryFee');
    if (deliveryLine) deliveryLine.textContent = formatMoney(checkoutDeliveryFee);
}

async function applyCheckoutCoupon() {
    const input = document.getElementById('couponCode');
    const message = document.getElementById('couponMessage');
    const code = input.value.trim().toUpperCase();
    const subtotal = checkoutItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    if (!code) { message.textContent = 'Enter a coupon code.'; message.className = 'form-message is-error'; return; }
    const { data: coupon, error } = await supabaseClient.from('coupons').select('*').eq('code', code).eq('is_active', true).maybeSingle();
    const expired = coupon?.expires_at && new Date(coupon.expires_at) < new Date();
    const belowMinimum = coupon && subtotal < Number(coupon.minimum_order);
    if (error || !coupon || expired || belowMinimum) {
        checkoutCoupon = null;
        message.textContent = belowMinimum ? `Spend at least ${formatMoney(coupon.minimum_order)} to use this coupon.` : 'That coupon is invalid or expired.';
        message.className = 'form-message is-error';
        renderCheckoutTotals();
        return;
    }
    checkoutCoupon = coupon;
    message.textContent = `${coupon.code} applied.`;
    message.className = 'form-message is-success';
    renderCheckoutTotals();
}

async function placeOrder(event, user, items) {
    event.preventDefault();
    const form = event.target;
    const message = document.getElementById('checkoutMessage');
    if (!form.checkValidity()) {
        message.textContent = 'Complete all shipping details before placing your order.';
        message.className = 'form-message is-error';
        return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = couponDiscount(checkoutCoupon, subtotal);
    const total = subtotal - discount + checkoutDeliveryFee;
    const address = {
        name: form.checkoutName.value.trim(),
        phone: form.checkoutPhone.value.trim(),
        email: user.email,
        address: form.checkoutAddress.value.trim(),
        city: form.checkoutCity.value.trim(),
        state: form.checkoutState.value,
        postal_code: form.checkoutPostalCode.value.trim(),
        country: form.checkoutCountry.value.trim()
    };
    if (!paymentsEnabled || !paystackPublicKey) {
        message.textContent = !paystackPublicKey ? 'Add your Paystack public key in Admin > Payments.' : 'Enable payments in Admin > Payments before checkout.';
        message.className = 'form-message is-error';
        button.disabled = false;
        return;
    }
    if (!window.PaystackPop) {
        message.textContent = 'Payment service is unavailable. Please refresh and try again.';
        message.className = 'form-message is-error';
        button.disabled = false;
        return;
    }
    try {
        const handler = window.PaystackPop.setup({
            key: paystackPublicKey,
            email: user.email,
            amount: Math.round(total * 100),
            currency: siteCurrency,
            ref: `DTT-${Date.now()}-${user.id.slice(0, 8)}`,
            metadata: { custom_fields: [{ display_name: 'Customer name', variable_name: 'customer_name', value: address.name }] },
            callback: function (response) {
                message.textContent = 'Payment received. Saving your order...';
                message.className = 'form-message is-success';
                savePaidOrder(user, items, total, discount, address, response.reference, message, button);
            },
            onClose: function () {
                message.textContent = 'Payment window closed. Your order was not placed.';
                message.className = 'form-message is-error';
                button.disabled = false;
            }
        });
        handler.openIframe();
    } catch (error) {
        message.textContent = error.message || 'Paystack could not start. Check your public key and currency.';
        message.className = 'form-message is-error';
        button.disabled = false;
    }
}

async function savePaidOrder(user, items, total, discount, address, paymentReference, message, button) {
    try {
        const { data: order, error: orderError } = await supabaseClient.from('orders').insert({ user_id: user.id, total, coupon_id: checkoutCoupon?.id || null, discount_amount: discount, payment_reference: paymentReference, payment_status: 'paid', status: 'confirmed', shipping_address: address }).select('id').single();
        if (orderError) throw orderError;
        const { error: itemsError } = await supabaseClient.from('order_items').insert(items.map(item => ({ order_id: order.id, product_id: item.product.id, quantity: item.quantity, unit_price: item.product.price })));
        if (itemsError) throw itemsError;
        localStorage.removeItem('dttCart');
        window.location.href = 'account.html?order=success';
    } catch (error) {
        message.textContent = error.message || 'We could not place your order. Please try again.';
        message.className = 'form-message is-error';
        button.disabled = false;
    }
}

function renderProductDetail() {
    const container = document.getElementById('productDetail');
    if (!container) return;
    const productId = Number(new URLSearchParams(window.location.search).get('id'));
    const product = (window.DTT_PRODUCTS || PRODUCTS).find(item => item.id === productId);
    if (!product) {
        container.innerHTML = '<div class="empty-state"><p class="eyebrow">Product unavailable</p><h1>We could not find that piece.</h1><a href="products.html" class="hero-button">Browse products</a></div>';
        return;
    }
    document.title = `DTT | ${product.name}`;
    const gallery = product.images?.length ? product.images : [product.image];
    container.innerHTML = `
        <div class="product-detail-image"><img id="productMainImage" src="${gallery[0]}" alt="${product.name}"></div>
        <div class="product-detail-copy">
            <p class="eyebrow">${product.category}</p>
            <h1>${product.name}</h1>
            <p class="detail-price" data-price="${product.price}">${formatMoney(product.price)}</p>
            <p class="detail-description">${product.description}</p>
            <div class="detail-meta"><span>In stock</span><span>Ships in 2-4 days</span></div>
            ${product.variations?.length ? `<div class="variation-picker"><label for="productVariation">Choose an option</label><select id="productVariation">${product.variations.map(variation => `<option value="${variation.id}">${variation.name}: ${variation.value} (${variation.stock} available)</option>`).join('')}</select></div>` : ''}
            <button type="button" class="primary-button add-to-cart" id="addToCart">Add to cart <span aria-hidden="true">&#8594;</span></button>
            <p class="cart-message" id="cartMessage" role="status" aria-live="polite"></p>
        </div>`;
    let galleryIndex = 0;
    const mainImage = document.getElementById('productMainImage');
    const setGalleryImage = index => {
        galleryIndex = (index + gallery.length) % gallery.length;
        mainImage.src = gallery[galleryIndex];
        container.querySelectorAll('.product-thumbnail').forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === galleryIndex));
    };
    let touchStartX = 0;
    mainImage.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    mainImage.addEventListener('touchend', event => {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 45) setGalleryImage(galleryIndex + (distance < 0 ? 1 : -1));
    }, { passive: true });
    loadProductReviews(product.id);
    document.getElementById('addToCart').addEventListener('click', () => addToCart(product.id));
}

async function loadProductReviews(productId) {
    const container = document.getElementById('productReviews');
    if (!container || !supabaseClient) return;
    const { data: reviews, error: reviewsError } = await supabaseClient.from('reviews').select('rating, title, body, created_at, profiles(full_name)').eq('product_id', productId).order('created_at', { ascending: false });
    if (reviewsError) {
        container.innerHTML = '<p class="muted-copy">Reviews are not available yet. Run product-content-migration.sql in Supabase.</p>';
        return;
    }
    container.innerHTML = reviews?.length ? reviews.map(review => `<article class="review"><div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div><h3>${escapeHtml(review.title || 'Verified purchase')}</h3><p>${escapeHtml(review.body)}</p><span>By ${escapeHtml(review.profiles?.full_name || 'DTT shopper')}</span></article>`).join('') : '<p class="muted-copy">No reviews yet. Be the first verified buyer to share your experience.</p>';
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data: deliveredPurchase, error: purchaseError } = await supabaseClient.from('order_items').select('id, orders!inner(user_id, status)').eq('product_id', productId).eq('orders.user_id', session.user.id).eq('orders.status', 'delivered').maybeSingle();
    if (purchaseError) {
        document.getElementById('reviewFormMount').innerHTML = '<p class="muted-copy">We could not verify purchase eligibility. Make sure product-content-migration.sql has been run.</p>';
        return;
    }
    if (!deliveredPurchase) {
        document.getElementById('reviewFormMount').innerHTML = '<p class="muted-copy">Only customers with a delivered order can review this product.</p>';
        return;
    }
    const { data: existingReview } = await supabaseClient.from('reviews').select('id').eq('product_id', productId).eq('user_id', session.user.id).maybeSingle();
    if (existingReview) return;
    document.getElementById('reviewFormMount').innerHTML = `<form id="reviewForm" class="review-form"><p class="eyebrow">Verified purchase</p><h3>Share your experience</h3><label>Rating<select name="rating"><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Below average</option><option value="1">1 - Poor</option></select></label><label>Title<input name="title" maxlength="100" placeholder="A short summary"></label><label>Review<textarea name="body" rows="4" maxlength="1000" placeholder="Tell other shoppers what you think." required></textarea></label><button class="primary-button" type="submit">Submit review</button><p class="form-message" id="reviewMessage" role="status"></p></form>`;
    document.getElementById('reviewForm').addEventListener('submit', async event => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.target));
        const { error } = await supabaseClient.from('reviews').insert({ product_id: productId, user_id: session.user.id, rating: Number(values.rating), title: values.title.trim(), body: values.body.trim() });
        setFormMessage('reviewMessage', error ? (error.message.includes('row-level') ? 'Only customers with a delivered order can review this product.' : error.message) : 'Review submitted.', Boolean(error));
        if (!error) loadProductReviews(productId);
    });
}

window.onload = async function() {
    await loadSiteSettings();
    fetchFeaturedProducts();
    enhanceStaticProductCards();
    updateCartCount(getCart().length);
    renderCart();
    renderProductDetail();
    renderCategoryProducts();
    renderDeals();
    await loadProductsFromSupabase().then(() => {
        renderProductDetail();
        renderCart();
        renderCategoryProducts();
        renderDeals();
        initializeCheckoutPage();
    });
    initializeAccountPage();
    updateAccountLinks();
    initializeAdminPage();
};