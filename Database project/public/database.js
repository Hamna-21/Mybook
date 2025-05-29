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

const port = 4000;


const corsOptions = {
  origin: 'http://localhost:4000',  // Adjust this to your frontend origin
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
  database: 'Mybook', // Database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.post('/register', (req, res) => {
  const { username, password, email, profilePhoto, coverPhoto, bio } = req.body; // Add bio here

  // Log received values to verify
  console.log('Received email:', email);
  console.log('Received profile photo:', profilePhoto);
  console.log('Received cover photo:', coverPhoto);
  console.log('Received bio:', bio); // Log bio

 // Set default bio if not provided
 const bioToInsert = bio || 'This user has not updated their bio yet.';
  // Call the stored procedure to handle registration logic
  const query = 'CALL RegisterUser(?, ?, ?, ?, ?, ?)';  // Update query to include bio and created_at

  const created_at = new Date(); // Add created_at

  db.query(query, [username, password, email, profilePhoto || null, coverPhoto || null, bio || null], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.status(201).json({ message: 'User registered successfully' });
  });
});
// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const getUserQuery = 'SELECT * FROM user WHERE username = ?';
  db.query(getUserQuery, [username], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user' });
    }

    if (result.length === 0) {
      // Log failed login attempt for nonexistent user
      db.query('INSERT INTO Login_Attempts (user_id, attempt_time, status) VALUES (?, NOW(), ?)', [null, 'FAILURE'], (logErr) => {
        if (logErr) console.error('Error logging login attempt: ', logErr);
      });
      
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result[0];

    // Direct password comparison (hash the password in production!)
    if (password === user.password) {
      // Set session data
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.profilePhoto = user.profile_photo;
      req.session.coverPhoto = user.cover_photo;
      req.session.email = user.email;
      req.session.created_at = user.created_at;
      req.session.bio = user.bio;

      // Set cookie
      res.cookie('username', user.username, { expires: new Date(Date.now() + 86400000), httpOnly: true });

      // Log successful login
      db.query('INSERT INTO Login_Attempts (user_id, attempt_time, status) VALUES (?, NOW(), ?)', [user.id, 'SUCCESS'], (logErr) => {
        if (logErr) console.error('Error logging login attempt: ', logErr);
        
      });

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id:user.id,
          username: user.username,
          profile_photo: user.profile_photo,
          cover_photo: user.cover_photo,
          email: user.email,
          created_at: user.created_at,
          bio: user.bio,
        },
      });
    } else {
      // Log failed login attempt
      db.query('INSERT INTO Login_Attempts (user_id, attempt_time, status) VALUES (?, NOW(), ?)', [user.id, 'FAILURE'], (logErr) => {
        if (logErr) console.error('Error logging login attempt: ', logErr);
      });

      return res.status(401).json({ message: 'Invalid password' });
    }
    
  });
});

// Protected route to fetch user data after login
// Dashboard route
app.post('/dashboard', (req, res) => {
  // Check if user is logged in (session check)
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  // Fetch user data from the database using the stored user ID in session
  const query = 'SELECT username, profile_photo, cover_photo,email,created_at,bio FROM user WHERE id = ?';
  db.query(query, [req.session.userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user data' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result[0];
    res.status(200).json({
      id:user.id,
      username: user.username,
      profile_photo: user.profile_photo,  // Make sure profile_photo is a valid URL or path
      cover_photo: user.cover_photo,      // Same for cover_photo
      email: user.email,
      created_at: user.created_at,
      bio: user.bio,
    });
  });
});

// Route to fetch notifications from the database
app.get('/get-notifications', (req, res) => {
    console.log('Request received at /get-notifications');
    
    // Execute the stored procedure to get notifications
    db.query('CALL get_notifications()', (err, results) => {
        if (err) {
            console.error('Error fetching notifications from database:', err);
            return res.status(500).json({ message: 'Error fetching notifications', error: err.message });
        }

        // Log the fetched notifications
        console.log('Fetched notifications:', results);

        // Return notifications
        const notifications = results[0] || []; // If no data, return empty array
        res.json({
            message: 'Notifications fetched successfully',
            data: notifications
        });
    });
});
app.use(express.static('public')); // Serve frontend files


// Sample route to demonstrate how to search for people based on a query
app.get('/search', (req, res) => {
    const query = req.query.query; // Query string from client-side
    const sql = 'SELECT name, picture_url FROM people WHERE name LIKE ?';

    // Query the database to search for people
    db.query(sql, [`%${query}%`], (error, results) => {
        if (error) {
            console.error('Database query failed:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }
        // Return search results to the client
        res.json({
            message: 'Search results fetched successfully',
            data: results
        });
    });
});

// API endpoint to fetch all user posts
app.get('/getTimelinePosts', (req, res) => { 
  const query = 'CALL GetAllUserPosts()'; // Use the stored procedure

  db.execute(query, (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Failed to fetch posts.' });
      }
      
      // Send the posts from the first result set of the procedure's output
      res.json({ success: true, posts: results[0] });
  });
});


// Search endpoint to get user profiles based on query
app.get('/searchfriend', (req, res) => {
  const searchQuery = req.query.q || ''; // The search query parameter
  const sql = `SELECT id, username, profile_photo 
               FROM user 
               WHERE username LIKE ?`;

  db.query(sql, [`%${searchQuery}%`], (err, results) => {
      if (err) {
          console.error('Error fetching users:', err);
          return res.status(500).send('Error fetching users');
      }
      res.json(results); // Send the result as JSON (user profiles)
  });
});

// Endpoint to send a friend request
app.post('/sendFriendRequest', (req, res) => {
  const { sender_id, receiver_id } = req.body;

  // Check if they are already friends before sending a request
  const checkFriendship = 'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)';
  db.query(checkFriendship, [sender_id, receiver_id, receiver_id, sender_id], (err, rows) => {
      if (err) {
          console.error('Error checking for existing friendship:', err);
          return res.status(500).json({ error: 'Error checking for existing friendship' });
      }

      // If they're already friends, don't allow sending the request
      if (rows.length > 0) {
          return res.status(400).json({ error: 'You are already friends' });
      }

      // Otherwise, send the friend request
      const sql = 'INSERT INTO friendrequests (sender_id, receiver_id, status) VALUES (?, ?, ?)';
      const status = 'Pending'; // Default status for a friend request

      db.query(sql, [sender_id, receiver_id, status], (err, results) => {
          if (err) {
              console.error('Error sending friend request:', err);
              return res.status(500).json({ error: 'An error occurred' });
          }

          res.status(200).json({ message: 'Friend request sent successfully' });
      });
  });
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
app.get('/loginStats2', (_req, res) => {
  const query = 'CALL GetLoginFailed()';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).send({ message: 'Error fetching login stats.' });
    } else {
      console.log('Raw query result:', result); // Log raw result for debugging
          
      if (result && result[0]) {
        const labels = result[0].map(row => row.login_time); // Extract time
        const values = result[0].map(row => row.failed_attempts); // Extract failed attempts count
        
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


const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


