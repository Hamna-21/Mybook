import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request body

// Database connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'yourpassword', // Replace with your DB password
    database: 'mybook' // Replace with your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Search endpoint to get user profiles based on query
app.get('/search', (req, res) => {
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

// Endpoint to accept a friend request
app.post('/acceptFriendRequest', (req, res) => {
    const { request_id } = req.body;

    const sql = 'UPDATE friendrequests SET status = ? WHERE id = ?';
    const status = 'Accepted';

    db.query(sql, [status, request_id], (err, results) => {
        if (err) {
            console.error('Error accepting friend request:', err);
            return res.status(500).json({ error: 'An error occurred while accepting the friend request' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // After accepting the request, add the friend to the friends table
        const getRequest = 'SELECT sender_id, receiver_id FROM friendrequests WHERE id = ?';
        db.query(getRequest, [request_id], (err, result) => {
            if (err || !result[0]) {
                return res.status(500).json({ error: 'Error retrieving friend request details' });
            }

            const { sender_id, receiver_id } = result[0];

            // Check if the friendship already exists before inserting
            const checkFriendship = 'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)';
            db.query(checkFriendship, [sender_id, receiver_id, receiver_id, sender_id], (err, rows) => {
                if (err) {
                    console.error('Error checking for existing friendship:', err);
                    return res.status(500).json({ error: 'Error checking for existing friendship' });
                }

                // If no existing friendship, insert the new friendship
                if (rows.length === 0) {
                    const insertFriend = 'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)';
                    db.query(insertFriend, [sender_id, receiver_id, receiver_id, sender_id], (err) => {
                        if (err) {
                            console.error('Error adding friend:', err);
                            return res.status(500).json({ error: 'Error adding friend to the friends list' });
                        }

                        res.status(200).json({ message: 'Friend request accepted and friends list updated' });
                    });
                } else {
                    res.status(200).json({ message: 'Friendship already exists' });
                }
            });
        });
    });
});

// Endpoint to reject a friend request
app.post('/rejectFriendRequest', (req, res) => {
    const { request_id } = req.body;

    const sql = 'UPDATE friendrequests SET status = ? WHERE id = ?';
    const status = 'Rejected';

    db.query(sql, [status, request_id], (err, results) => {
        if (err) {
            console.error('Error rejecting friend request:', err);
            return res.status(500).json({ error: 'An error occurred while rejecting the friend request' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        res.status(200).json({ message: 'Friend request rejected' });
    });
});

// Endpoint to fetch pending friend requests for the logged-in user
app.get('/friendRequests', (req, res) => {
    const userId = req.query.userId;

    const sql = `SELECT fr.id AS request_id, u.id AS sender_id, u.username, u.profile_photo 
                 FROM friendrequests fr 
                 JOIN user u ON u.id = fr.sender_id 
                 WHERE fr.receiver_id = ? AND fr.status = 'Pending'`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching friend requests:', err);
            return res.status(500).json({ error: 'An error occurred' });
        }
        res.json(results); // Send the result as JSON (friend requests)
    });
});

// Endpoint to fetch friends list for the logged-in user
app.get('/friends', (req, res) => {
    const userId = req.query.userId;

    const sql = `SELECT u.id, u.username, u.profile_photo
                 FROM friends f
                 JOIN user u ON u.id = f.friend_id
                 WHERE f.user_id = ?`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching friends:', err);
            return res.status(500).json({ error: 'An error occurred' });
        }
        res.json(results); // Send the result as JSON (friends list)
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
