const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const authenticateToken = require('../middleware/authenticateToken');
dotenv.config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

router.post('/rinex', authenticateToken, async (req, res) => {
  
});

router.post('/features', authenticateToken, async (req, res) => {
  
});

router.post('/interpolation', authenticateToken, async (req, res) => {
  
});

router.post('/error', authenticateToken, async (req, res) => {
  
});

module.exports = router;
