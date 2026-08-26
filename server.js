const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();


const app = express();


/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


/* =========================================
   FRONTEND
========================================= */

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =========================================
   API ROUTES
========================================= */

const authRoutes =
    require("./routes/auth");

const orderRoutes =
    require("./routes/orders");

const productRoutes =
    require("./routes/products");


app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/orders",
    orderRoutes
);


app.use(
    "/api/products",
    productRoutes
);


/* =========================================
   HOME PAGE
========================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "DTT.html"
        )
    );

});


/* =========================================
   TEST API
========================================= */

app.get("/api", (req, res) => {

    res.json({
        message:
            "DTT backend is working successfully."
    });

});


/* =========================================
   ERROR HANDLER
========================================= */

app.use(
    (err, req, res, next) => {

        console.error(err);

        res.status(500).json({
            message:
                "Something went wrong on the server."
        });

    }
);


/* =========================================
   START SERVER
========================================= */

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `DTT server running at http://localhost:${PORT}`
        );

    }
);