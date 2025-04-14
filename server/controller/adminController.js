const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

exports.addUser = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  } else {
    const { name, email, password, address, role } = req.body;

    const validRoles = ['admin', 'user', 'store_owner'];

    if (validRoles.includes(role)) {
      const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (existingUser.rows.length > 0) {
        res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
          'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role',
          [name, email, hashedPassword, address, role]
        );

        const user = newUser.rows[0];

        if (role === 'store_owner') {
          const storeName = req.body.storeName || name + "'s Store";
          const storeEmail = req.body.storeEmail || email;
          const storeAddress = req.body.storeAddress || address;

          const storeResult = await pool.query(
            'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, address',
            [storeName, storeEmail, storeAddress, user.id]
          );

          res.json({
            user: user,
            store: storeResult.rows[0],
            message: 'Store owner added with store'
          });
        } else {
          res.json({
            user: user,
            message: 'User added successfully'
          });
        }
      }
    } else {
      res.status(400).json({ errors: [{ msg: 'Invalid role. Choose admin, user, or store_owner' }] });
    }
  }
};

exports.getUsers = async (req, res) => {
    const { name, email, address, role } = req.query;
  
    let query = 'SELECT id, name, email, address, role FROM users';
    let conditions = [];
    let values = [];
    let index = 1;
  
    if (name) {
      conditions.push(`name ${index}`);
      values.push('%' + name + '%');
      index++;
    }
  
    if (email) {
      conditions.push(`email${index}`);
      values.push('%' + email + '%');
      index++;
    }
  
    if (address) {
      conditions.push(`address ${index}`);
      values.push('%' + address + '%');
      index++;
    }
  
    if (role) {
      conditions.push(`role ${index}`);
      values.push(role);
      index++;
    }
  
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
  
    query += ' ORDER BY name ASC';
  
    const usersData = await pool.query(query, values);
    const users = usersData.rows;
  
    let finalUsers = [];
  
    for (let i = 0; i < users.length; i++) {
      let user = users[i];
  
      if (user.role === 'store_owner') {
        const storeData = await pool.query(
          'SELECT id FROM stores WHERE owner_id = $1',
          [user.id]
        );
  
        if (storeData.rows.length > 0) {
          const storeId = storeData.rows[0].id;
  
          const ratingData = await pool.query(
            'SELECT AVG(rating) as average_rating FROM ratings WHERE store_id = $1',
            [storeId]
          );
  
          user.rating = Number(ratingData.rows[0].average_rating) || 0;
        }
      }
  
      finalUsers.push(user);
    }
  
    res.json(finalUsers);
  };
  