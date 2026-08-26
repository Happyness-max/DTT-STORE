const express = require("express");
const jwt = require("jsonwebtoken");

const db = require("../db");

const router = express.Router();


/* =========================================
   AUTHENTICATION MIDDLEWARE
========================================= */

function authenticateToken(req, res, next) {

    const authHeader =
        req.headers.authorization;


    const token =
        authHeader &&
        authHeader.split(" ")[1];


    if (!token) {

        return res.status(401).json({
            message:
                "Please login before placing an order."
        });

    }


    try {

        const user =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        req.user = user;

        next();


    } catch (error) {

        return res.status(403).json({
            message:
                "Invalid or expired login session."
        });

    }

}


/* =========================================
   CREATE ORDER
========================================= */

router.post(
    "/",
    authenticateToken,
    async (req, res) => {

        const connection =
            await db.getConnection();


        try {

            const {
                fullName,
                phone,
                email,
                address,
                note,
                total,
                items
            } = req.body;


            if (
                !fullName ||
                !phone ||
                !address ||
                !items ||
                items.length === 0
            ) {

                connection.release();

                return res.status(400).json({
                    message:
                        "Please provide all order details."
                });

            }


            await connection.beginTransaction();


            /* Create order */

            const [orderResult] =
                await connection.execute(
                    `INSERT INTO orders
                    (
                        user_id,
                        full_name,
                        phone,
                        email,
                        address,
                        note,
                        total
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        req.user.id,
                        fullName,
                        phone,
                        email || null,
                        address,
                        note || null,
                        total
                    ]
                );


            const orderId =
                orderResult.insertId;


            /* Save products */

            for (const item of items) {

                await connection.execute(
                    `INSERT INTO order_items
                    (
                        order_id,
                        product_id,
                        product_name,
                        price,
                        quantity
                    )
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        item.id,
                        item.name,
                        item.price,
                        item.quantity
                    ]
                );

            }


            await connection.commit();


            connection.release();


            res.status(201).json({

                message:
                    "Order placed successfully.",

                orderId: orderId

            });


        } catch (error) {

            await connection.rollback();

            connection.release();

            console.error(error);

            res.status(500).json({
                message:
                    "Failed to save order."
            });

        }

    }
);


/* =========================================
   GET MY ORDERS
========================================= */

router.get(
    "/my-orders",
    authenticateToken,
    async (req, res) => {

        try {

            const [orders] =
                await db.execute(
                    `SELECT *
                     FROM orders
                     WHERE user_id = ?
                     ORDER BY created_at DESC`,
                    [req.user.id]
                );


            res.json(orders);


        } catch (error) {

            console.error(error);

            res.status(500).json({
                message:
                    "Failed to retrieve orders."
            });

        }

    }
);


module.exports = router;