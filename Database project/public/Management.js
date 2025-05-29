import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import session from 'express-session';
import path from 'path';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import multer from 'multer';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: '127.0.0.1', // Database host
    user: 'root',      // Your MySQL username
    password: 'hamnamushtaq@21', // Use environment variable for security
  database: 'Mybook', // Database name // Replace with your database name
});

db.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to MySQL database.');
    }
});

// Delete User Endpoint
app.post('/deleteUser', (req, res) => {
    const { username, email } = req.body;

    const query = 'CALL DeleteUser(?, ?)';
    db.query(query, [username, email], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Error deleting user.' });
        } else {
            res.send({ message: result[0][0].message });
        }
    });
});

// Register User Endpoint
app.post('/registerUser', (req, res) => {
    const { username, email, password } = req.body;

    const query = 'CALL RegisterUser(?, ?, ?)';
    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Error registering user.' });
        } else {
            res.send({ message: result[0][0].message });
        }
    });
});

// Login Stats Endpoint
app.get('/loginStats', (_req, res) => {
    const query = 'CALL GetLoginStats()';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).send({ message: 'Error fetching login stats.' });
        } else {
            console.log('Raw query result:', result); // Log raw result for debugging
            
            if (result && result[0]) {
                const labels = result[0].map(row => row.login_time); // Extract time
                const values = result[0].map(row => row.active_users); // Extract counts

                console.log('Labels:', labels);
                console.log('Values:', values);

                res.send({ labels, values });
            } else {
                console.log('No data returned.');
                res.send({ labels: [], values: [] }); // Handle empty result
            }
        }
    });
});


// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
