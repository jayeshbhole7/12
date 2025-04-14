const { pool } = require('../db');
const { validationResult } = require('express-validator');

exports.submitRating = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { store_id, rating } = req.body;
    const user_id = req.user.id;
    
    const store = await pool.query('SELECT id FROM stores WHERE id = $1', [store_id]);
    if (store.rows.length === 0) {
        return res.status(404).json({ message: 'Store not found' });
    }

    const rated = await pool.query('SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2', [user_id, store_id]);
    if (rated.rows.length > 0) {
        await pool.query('UPDATE ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND store_id = $3', [rating, user_id, store_id]);
        return res.json({ message: 'Rating updated successfully' });
    } else {
        await pool.query('INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)', [user_id, store_id, rating]);
        return res.status(201).json({ message: 'Rating submitted successfully' });
    }
};

exports.getStoreRatings = async (req, res) => {
    const { store_id } = req.params;
    
    if (req.user.role === 'store_owner') {
        const check = await pool.query('SELECT id FROM stores WHERE id = $1 AND owner_id = $2', [store_id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(403).json({ message: 'You do not have access to this store' });
        }
    }

    const rateRes = await pool.query(
        `SELECT r.id, r.rating, r.created_at, r.updated_at, u.id as user_id, u.name as user_name, u.email as user_email 
        FROM ratings r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.store_id = $1 
        ORDER BY r.created_at DESC`, 
        [store_id]
    );
    
    const avg = await pool.query('SELECT AVG(rating) as average_rating FROM ratings WHERE store_id = $1', [store_id]);
    
    res.json({
        ratings: rateRes.rows,
        average_rating: Number(avg.rows[0].average_rating) || 0,
        total_ratings: rateRes.rows.length
    });
};

exports.getAllRatings = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
    }
    
    const ratingsResult = await pool.query(
        `SELECT r.id, r.rating, r.created_at, s.name as store_name, u.name as user_name 
        FROM ratings r
        JOIN stores s ON r.store_id = s.id
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC`
    );
    
    res.json(ratingsResult.rows);
};
