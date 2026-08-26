const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../db");

const router = express.Router();


/* =========================================
   REGISTER
========================================= */

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            password
        } = req.body;


        if (
            !name ||
            !email ||
            !phone ||
            !password
        ) {

            return res.status(400).json({
                message: "Please fill all fields."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });

        }


        /* Check if email already exists */

        const [existingUsers] =
            await db.execute(
                "SELECT id FROM users WHERE email = ?",
                [email]
            );


        if (existingUsers.length > 0) {

            return res.status(409).json({
                message:
                    "An account with this email already exists."
            });

        }


        /* Hash password */

        const hashedPassword =
            await bcrypt.hash(password, 10);


        /* Save user */

        const [result] =
            await db.execute(
                `INSERT INTO users
                (name, email, phone, password)
                VALUES (?, ?, ?, ?)`,
                [
                    name,
                    email,
                    phone,
                    hashedPassword
                ]
            );


        res.status(201).json({

            message:
                "Account created successfully.",

            user: {
                id: result.insertId,
                name,
                email,
                phone
            }

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Server error while creating account."
        });

    }

});


/* =========================================
   LOGIN
========================================= */

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required."
            });

        }


        /* Find user */

        const [users] =
            await db.execute(
                "SELECT * FROM users WHERE email = ?",
                [email]
            );


        if (users.length === 0) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });

        }


        const user = users[0];


        /* Check password */

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });

        }


        /* Create JWT */

        const token =
            jwt.sign(
                {
                    id: user.id,
                    email: user.email
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }
            );


        res.json({

            message:
                "Login successful.",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Server error while logging in."
        });

    }

});


module.exports = router;