const express = require("express");
const mid = express();
const cors = require("cors");
require('dotenv').config();

mid.use(cors());
mid.use(express.json());

const credentialsRoutes = require('./route/credroutes');
const systemAdministrator = require('./route/saroutes');
const storeRoutes = require('./route/storeroutes');
const rateRoutes = require('./route/rateroutes');
const userRoutes = require('./route/userroutes');

mid.use('/api/creds', credentialsRoutes);
mid.use('/api/administrator', systemAdministrator);
mid.use('/api/stores', storeRoutes);
mid.use('/api/users', userRoutes);
mid.use('/api/ratings', rateRoutes);

const PORT = process.env.PORT;

mid.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});