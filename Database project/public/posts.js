// Import required modules
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

// Load environment variables from .env file
dotenv.config();
import axios from 'axios';


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

const port = 5000;


const corsOptions = {
  origin: 'http://localhost:5000',  // Adjust this to your frontend origin
  credentials: true,               // Allow cookies or authentication tokens
};




// Initialize Express app
const app = express();

app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,          // Only send over HTTPS
    httpOnly: true,        // Prevent client-side JavaScript from accessing
    sameSite: 'lax',       // Helps mitigate CSRF attacks
  }  // false is okay for development; true when using HTTPS
}));

axios.defaults.withCredentials = true;

app.use('/login', limiter);

// Middleware setup
app.use(morgan('dev')); // Logging middleware
app.use(express.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Enable CORS for all routes

// MySQL connection setup
const db = mysql.createConnection({
    host: '127.0.0.1', // Database host
    user: 'root',      // Your MySQL username
    password: 'hamnamushtaq@21', // Use environment variable for security
    database: 'Mybook' // Database name
});


app.get('/getTimelinePosts', (req, res) => {
    const query = 'SELECT * FROM posts ORDER BY created_at DESC'; // Query to fetch all posts
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err); // Log the error
            return res.status(500).json({ success: false, error: 'Failed to fetch posts.' });
        }
        console.log('Fetched posts:', results); // Log the fetched posts for debugging
        res.json({ success: true, posts: results });
    });
  });
  



// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});




























