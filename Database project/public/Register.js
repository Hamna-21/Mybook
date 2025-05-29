require('dotenv').config(); // For environment variables
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit'); // To limit requests
const { check, validationResult } = require('express-validator'); // For validation

const app = express();
app.use(express.json());  // This line should be in your app to parse JSON request bodies
const port = process.env.PORT || 4000;
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiter for login endpoint
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many login attempts, please try again later',
});
app.use('/login', limiter);

// Create MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// Connect to MySQL database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ', err.stack);
        process.exit(1); // Exit if the connection fails
    }
    console.log('Connected to the database');
});

// Registration endpoint
app.post('/register', [
    check('email').isEmail().withMessage('Invalid email format'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, profilePhoto = null, coverPhoto = null } = req.body;

    db.query('SELECT * FROM User WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error checking user existence: ', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            return res.status(400).send('User already exists');
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password: ', err);
                return res.status(500).send('Server error');
            }

            db.query('CALL createUser(?, ?, ?, ?, ?)', [username, email, hashedPassword, profilePhoto, coverPhoto], (err) => {
                if (err) {
                    console.error('Error executing stored procedure: ', err);
                    return res.status(500).send('Server error');
                }

                res.status(200).send('User registered successfully');
            });
        });
    });
});

// Login endpoint
app.post('/login', [
    check('username').notEmpty().withMessage('Username is required'),
    check('password').notEmpty().withMessage('Password is required'),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    db.query('SELECT * FROM User WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error fetching user: ', err);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords: ', err);
                return res.status(500).send('Server error');
            }

            const loginStatus = isMatch ? 'Successful' : 'Failed';

            // Log the login attempt
            db.query('INSERT INTO Login_Attempts (user_id, attempt_time, status) VALUES (?, NOW(), ?)', [user.id, loginStatus], (logErr) => {
                if (logErr) console.error('Error logging login attempt: ', logErr);
            });

            if (isMatch) {
                return res.status(200).json({ message: 'Login successful', user });
            } else {
                return res.status(401).send('Incorrect password');
            }
        });
    });
});

     // Handle unknown routes
app.use((req, res) => {
    res.status(404).send('Route not found');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
