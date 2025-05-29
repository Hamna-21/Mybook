const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

// Initialize Express app
const app = express();

// Set up multer for handling file uploads
const upload = multer({
    dest: 'uploads/', // specify upload folder
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).single('profile-image'); // 'profile-image' is the name of the input field for image

// Middleware to parse application/x-www-form-urlencoded and JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (like images)
app.use(express.static('uploads'));

// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost', // Database host
    user: 'root',      // Your MySQL username
    password: 'your_password',      // Your MySQL password
    database: 'Db_project' // Database name
});

// Connect to the MySQL database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// POST endpoint to save personal information
app.post('/save-personal-info', upload, (req, res) => {
    const { 'first-name': firstName, 'last-name': lastName, email, phone, occupation, status } = req.body;

    // Log the received data for debugging
    console.log('Received Data:', req.body);
    console.log('Received File:', req.file);

    // Ensure all required fields are filled
    if (!firstName || !lastName || !email || !phone || !req.file) {
        return res.status(400).send('Missing required fields or file');
    }

    // Insert the data into MySQL database
    const query = 'INSERT INTO personal_info (first_name, last_name, email, phone, occupation, status, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)';

    const values = [
        firstName,
        lastName,
        email,
        phone,
        occupation,
        status,
        req.file.path // Saving the file path in the database
    ];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error saving data to database:', err);
            return res.status(500).send('Error saving data');
        }

        // Return a success message
        res.send('Data saved successfully!');
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
