const { pool } = require('../db');
const { validationResult } = require('express-validator');

exports.getAllStores = async (req, res) => {
    const { name, address } = req.query;
    let query = `
        SELECT s.id, s.name, s.email, s.address, 
            COALESCE(AVG(r.rating), 0) as average_rating 
        FROM stores s 
        LEFT JOIN ratings r ON s.id = r.store_id
    `;
    let conditions = [];
    let values = [];
    let i = 1;

    if (name) {
        conditions.push(`s.name ILIKE $${i}`);
        values.push(`%${name}%`);
        i++;
    }

    if (address) {
        conditions.push(`s.address ILIKE $${i}`);
        values.push(`%${address}%`);
        i++;
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY s.id, s.name, s.email, s.address ORDER BY s.name ASC';

    const storeResult = await pool.query(query, values);
    const stores = storeResult.rows;

    if (req.user && req.user.role === 'user') {
        let storeList = [];
        for (let j = 0; j < stores.length; j++) {
            let store = stores[j];
            let rateRes = await pool.query(
                'SELECT rating FROM ratings WHERE user_id = $1 AND store_id = $2',
                [req.user.id, store.id]
            );
            let userRating = null;
            if (rateRes.rows.length > 0) {
                userRating = rateRes.rows[0].rating;
            }
            storeList.push({ ...store, user_rating: userRating });
        }
        return res.json(storeList);
    } else {
        res.json(stores);
    }
};

exports.addStore = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, address, owner_id } = req.body;

    if (owner_id) {
        const ownerRes = await pool.query(
            'SELECT id, role FROM users WHERE id = $1',
            [owner_id]
        );
        if (ownerRes.rows.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }
        if (ownerRes.rows[0].role !== 'store_owner') {
            return res.status(400).json({ message: 'User is not a store owner' });
        }
    }

    const insertRes = await pool.query(
        'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, address',
        [name, email, address, owner_id]
    );

    res.status(201).json({
        store: insertRes.rows[0],
        message: 'Store added successfully'
    });
};
