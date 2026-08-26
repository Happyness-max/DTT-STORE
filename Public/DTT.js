/* =========================================
   DTT ONLINE STORE
   MAIN JAVASCRIPT
========================================= */


/* =========================================
   CART
========================================= */

let cart = JSON.parse(
    localStorage.getItem("dttCart")
) || [];


/* Save cart */

function saveCart() {

    localStorage.setItem(
        "dttCart",
        JSON.stringify(cart)
    );

}


/* Update cart count */

function updateCartCount() {

    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) return;

    const totalItems = cart.reduce(
        (total, item) =>
            total + item.quantity,
        0
    );

    cartCount.textContent = totalItems;

}


/* Add product to cart */

function addToCart(product) {

    const existingProduct =
        cart.find(
            item => item.id === product.id
        );

    if (existingProduct) {

        existingProduct.quantity++;

    } else {

        cart.push({
            ...product,
            quantity: 1
        });

    }

    saveCart();

    updateCartCount();

    alert(
        product.name +
        " has been added to your cart."
    );
}


/* Remove product */

function removeFromCart(productId) {

    cart = cart.filter(
        item => item.id !== productId
    );

    saveCart();

    displayCart();

    updateCartCount();

}


/* Increase quantity */

function increaseQuantity(productId) {

    const product =
        cart.find(
            item => item.id === productId
        );

    if (product) {

        product.quantity++;

    }

    saveCart();

    displayCart();

    updateCartCount();

}


/* Decrease quantity */

function decreaseQuantity(productId) {

    const product =
        cart.find(
            item => item.id === productId
        );

    if (!product) return;


    if (product.quantity > 1) {

        product.quantity--;

    } else {

        removeFromCart(productId);

        return;

    }

    saveCart();

    displayCart();

    updateCartCount();

}


/* =========================================
   DISPLAY CART
========================================= */

function displayCart() {

    const cartContainer =
        document.getElementById(
            "cartItems"
        );

    const totalElement =
        document.getElementById(
            "cartTotal"
        );

    if (!cartContainer) return;


    cartContainer.innerHTML = "";


    if (cart.length === 0) {

        cartContainer.innerHTML = `
            <p style="text-align:center;">
                Your cart is empty 🛒
            </p>
        `;

        if (totalElement) {

            totalElement.textContent =
                "₦0";

        }

        return;

    }


    let total = 0;


    cart.forEach(product => {

        const productTotal =
            product.price *
            product.quantity;

        total += productTotal;


        const item =
            document.createElement("div");

        item.className =
            "cart-item";


        item.innerHTML = `

            <div>

                <h3>
                    ${product.name}
                </h3>

                <p>
                    ₦${Number(
                        product.price
                    ).toLocaleString()}
                </p>

            </div>


            <div class="quantity-controls">

                <button
                    onclick="
                    decreaseQuantity(${product.id})
                    "
                >
                    -
                </button>

                <span>
                    ${product.quantity}
                </span>

                <button
                    onclick="
                    increaseQuantity(${product.id})
                    "
                >
                    +
                </button>

            </div>


            <strong>
                ₦${productTotal.toLocaleString()}
            </strong>


            <button
                onclick="
                removeFromCart(${product.id})
                "
                style="
                    border:none;
                    background:none;
                    color:red;
                    cursor:pointer;
                "
            >
                Remove
            </button>

        `;


        cartContainer.appendChild(item);

    });


    if (totalElement) {

        totalElement.textContent =
            "₦" + total.toLocaleString();

    }

}


/* =========================================
   REGISTER
========================================= */

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "name"
                ).value.trim();


            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();


            const phone =
                document.getElementById(
                    "phone"
                ).value.trim();


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            /* Check password */

            if (
                password !==
                confirmPassword
            ) {

                message.textContent =
                    "Passwords do not match.";

                message.style.color =
                    "red";

                return;

            }


            if (password.length < 6) {

                message.textContent =
                    "Password must be at least 6 characters.";

                message.style.color =
                    "red";

                return;

            }


            message.textContent =
                "Creating account...";

            message.style.color =
                "#555";


            try {

                const response =
                    await fetch(
                        "/api/auth/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                name: name,

                                email: email,

                                phone: phone,

                                password: password

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Registration failed."
                    );

                }


                message.textContent =
                    "Account created successfully! 🎉";

                message.style.color =
                    "green";


                registerForm.reset();


                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(error);


                message.textContent =
                    error.message ||
                    "Something went wrong.";

                message.style.color =
                    "red";

            }

        }
    );

}


/* =========================================
   LOGIN
========================================= */

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById(
                    "email"
                ).value.trim();


            const password =
                document.getElementById(
                    "password"
                ).value;


            const message =
                document.getElementById(
                    "loginMessage"
                );


            message.textContent =
                "Logging in...";

            message.style.color =
                "#555";


            try {

                const response =
                    await fetch(
                        "/api/auth/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                email: email,

                                password: password

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Login failed."
                    );

                }


                /* Save logged-in user */

                localStorage.setItem(
                    "dttUser",
                    JSON.stringify(data.user)
                );


                /* Save token */

                if (data.token) {

                    localStorage.setItem(
                        "dttToken",
                        data.token
                    );

                }


                message.textContent =
                    "Login successful! 🎉";

                message.style.color =
                    "green";


                setTimeout(
                    function () {

                        window.location.href =
                            "DTT.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(error);


                message.textContent =
                    error.message ||
                    "Invalid email or password.";

                message.style.color =
                    "red";

            }

        }
    );

}


/* =========================================
   PLACE ORDER
========================================= */

const orderForm =
    document.getElementById(
        "orderForm"
    );


if (orderForm) {

    orderForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (cart.length === 0) {

                alert(
                    "Your cart is empty."
                );

                return;

            }


            const fullName =
                document.getElementById(
                    "fullName"
                ).value.trim();


            const phone =
                document.getElementById(
                    "orderPhone"
                ).value.trim();


            const email =
                document.getElementById(
                    "orderEmail"
                ).value.trim();


            const address =
                document.getElementById(
                    "address"
                ).value.trim();


            const noteElement =
                document.getElementById(
                    "orderNote"
                );


            const note =
                noteElement
                    ? noteElement.value.trim()
                    : "";


            const total =
                cart.reduce(
                    (sum, item) =>
                        sum +
                        (
                            item.price *
                            item.quantity
                        ),
                    0
                );


            const orderData = {

                fullName: fullName,

                phone: phone,

                email: email,

                address: address,

                note: note,

                total: total,

                items: cart

            };


            try {

                const response =
                    await fetch(
                        "/api/orders",
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    (
                                        localStorage.getItem(
                                            "dttToken"
                                        ) || ""
                                    )

                            },

                            body:
                                JSON.stringify(
                                    orderData
                                )

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Order could not be placed."
                    );

                }


                alert(
                    "Order placed successfully! 🎉"
                );


                cart = [];

                saveCart();

                updateCartCount();


                orderForm.reset();

                displayCart();


            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "Something went wrong while placing your order."
                );

            }

        }
    );

}


/* =========================================
   LOGGED-IN USER
========================================= */

function showLoggedInUser() {

    const user =
        JSON.parse(
            localStorage.getItem(
                "dttUser"
            )
        );


    const loginLink =
        document.getElementById(
            "loginLink"
        );


    if (
        user &&
        loginLink
    ) {

        loginLink.textContent =
            "Logout";

        loginLink.href =
            "#";

        loginLink.onclick =
            function () {

                logoutUser();

            };

    }

}


/* =========================================
   LOGOUT
========================================= */

function logoutUser() {

    localStorage.removeItem(
        "dttUser"
    );

    localStorage.removeItem(
        "dttToken"
    );

    window.location.href =
        "login.html";

}
/* =========================================
   DTT PRODUCTS
========================================= */

const products = [

    {
        id: 1,
        name: "Cakes",
        price: 15000,
        category: "Cakes & Pastries",
        image: "images/cake.jpg"
    },

    {
        id: 2,
        name: "Pastries",
        price: 5000,
        category: "Cakes & Pastries",
        image: "images/pastries.jpg"
    },

    {
        id: 3,
        name: "Food Tray",
        price: 10000,
        category: "Food",
        image: "images/food-tray.jpg"
    },

    {
        id: 4,
        name: "Food Bowl",
        price: 8000,
        category: "Food",
        image: "images/food-bowl.jpg"
    },

    {
        id: 5,
        name: "Jewelry",
        price: 7000,
        category: "Jewelry",
        image: "images/jewelry.jpg"
    },

    {
        id: 6,
        name: "Lip Gloss",
        price: 3000,
        category: "Beauty",
        image: "images/lip-gloss.jpg"
    },

    {
        id: 7,
        name: "Hair Accessories",
        price: 2500,
        category: "Accessories",
        image: "images/hair-accessories.jpg"
    },

    {
        id: 8,
        name: "Dresses & Outfits",
        price: 15000,
        category: "Fashion",
        image: "images/outfits.jpg"
    },

    {
        id: 9,
        name: "Perfume",
        price: 10000,
        category: "Beauty",
        image: "images/perfume.jpg"
    },

    {
        id: 10,
        name: "Wrist Watch",
        price: 12000,
        category: "Accessories",
        image: "images/wrist-watch.jpg"
    },

    {
        id: 11,
        name: "Room Decor",
        price: 7000,
        category: "Decor",
        image: "images/room-decor.jpg"
    },

    {
        id: 12,
        name: "Tattoo Stickers",
        price: 2000,
        category: "Accessories",
        image: "images/tattoo.jpg"
    },

    {
        id: 13,
        name: "Money Bouquet",
        price: 20000,
        category: "Gifts",
        image: "images/money-bouquet.jpg"
    },

    {
        id: 14,
        name: "Birthday Gift Package",
        price: 15000,
        category: "Gifts",
        image: "images/gift-package.jpg"
    },

    {
        id: 15,
        name: "Face Mask",
        price: 3000,
        category: "Beauty",
        image: "images/face-mask.jpg"
    },

    {
        id: 16,
        name: "Under Eye Mask",
        price: 2500,
        category: "Beauty",
        image: "images/under-eye-mask.jpg"
    },

    {
        id: 17,
        name: "Lip Mask",
        price: 2500,
        category: "Beauty",
        image: "images/lip-mask.jpg"
    },

    {
        id: 18,
        name: "Mini Fan",
        price: 8000,
        category: "Electronics",
        image: "images/mini-fan.jpg"
    },

    {
        id: 19,
        name: "Fancy Cup",
        price: 6000,
        category: "Home",
        image: "images/fancy-cup.jpg"
    },

    {
        id: 20,
        name: "Tripod",
        price: 12000,
        category: "Electronics",
        image: "images/tripod.jpg"
    },

    {
        id: 21,
        name: "Fancy Mirror",
        price: 9000,
        category: "Home",
        image: "images/mirror.jpg"
    }

];


/* =========================================
   DISPLAY PRODUCTS
========================================= */

function displayProducts() {

    const productGrid =
        document.getElementById(
            "productGrid"
        );

    if (!productGrid) return;


    productGrid.innerHTML = "";


    products.forEach(product => {

        const productCard =
            document.createElement("div");

        productCard.className =
            "product-card";


        productCard.innerHTML = `

            <img
                src="${product.image}"
                alt="${product.name}"
                class="product-image"
                onerror="
                    this.src='images/placeholder.jpg'
                "
            >

            <div class="product-info">

                <small>
                    ${product.category}
                </small>

                <h3>
                    ${product.name}
                </h3>

                <p class="product-price">
                    ₦${product.price.toLocaleString()}
                </p>

                <button
                    class="add-cart"
                    onclick='addToCart(${JSON.stringify(product)})'
                >
                    Add to Cart
                </button>

            </div>

        `;


        productGrid.appendChild(
            productCard
        );

    });

}


/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateCartCount();

        displayCart();

        showLoggedInUser();

    }
);