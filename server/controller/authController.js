const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

exports.signupUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, address } = req.body;

    try {
        const existingUserRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (existingUserRes.rows.length > 0) {
            return res.status(400).json({ errors: [{ msg: 'user already exists with that email' }] });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(password, salt);

        const insertUserQuery = `
            INSERT INTO users (name, email, password, address, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const createdUserRes = await pool.query(insertUserQuery, [
            name,
            email,
            hashedPw,
            address,
            'user'
        ]);

        const savedUser = createdUserRes.rows[0];

        const tokenPayload = {
            user: {
                id: savedUser.id,
                role: savedUser.role
            }
        };

        jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('JWT error:', err);
                    throw err;
                }
                res.json({ token });
            }
        );

    } catch (e) {
        console.error('signup error:', e.message);
        res.status(500).send('broke');
    }
};


exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const userQueryRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userQueryRes.rows.length === 0) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const dbUser = userQueryRes.rows[0];

        const passwordsMatch = await bcrypt.compare(password, dbUser.password);

        if (!passwordsMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const loginPayload = {
            user: {
                id: dbUser.id,
                role: dbUser.role
            }
        };

        jwt.sign(
            loginPayload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('JWT issue during login:', err);
                    throw err;
                }

                res.json({
                    token,
                    user: {
                        id: dbUser.id,
                        name: dbUser.name,
                        email: dbUser.email,
                        role: dbUser.role
                    }
                });
            }
        );

    } catch (err) {
        console.error('Login failed:', err.message);
        res.status(500).send('Login error — our bad.');
    }
};
