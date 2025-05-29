app.post('/addPost', (req, res) => {
    // Log the data received from the client
    console.log('Received Data:', req.body);

    const { user_id, content, media_url } = req.body;

    // Validate the data
    if (!user_id || !content) {
        console.error('Validation Error: Missing user_id or content');
        return res.json({ success: false, message: 'User ID and content are required.' });
    }

    // Insert data into the database
    const query = 'INSERT INTO posts (user_id, content, media_url) VALUES (?, ?, ?)';
    db.query(query, [user_id, content, media_url || null], (err, result) => {
        if (err) {
            console.error('Database Error:', err);
            return res.json({ success: false, error: err });
        }
        console.log('Post added successfully:', result);
        res.json({ success: true, message: 'Post added successfully.', postId: result.insertId });
    });
});
// Handle the post button click event
postButton.addEventListener('click', async (e) => {
    e.preventDefault();

    // Get the content of the post
    const postContent = textarea.value.trim();
    if (!postContent) {
        alert("Post cannot be empty!");
        return;
    }

    // Get logged-in user information
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
        alert('User not logged in.');
        return;
    }

    let mediaUrl = null;

    // Handle image upload
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        mediaUrl = await uploadFile(file); // Upload and get URL
    }

    // Handle video upload
    if (videoInput.files.length > 0) {
        const file = videoInput.files[0];
        mediaUrl = await uploadFile(file); // Upload and get URL
    }

    // Prepare post data
    const postData = {
        user_id: userData.id,
        username: userData.username,
        profile_photo: userData.profile_photo,
        content: postContent,
        media_url: mediaUrl || null, // Include media URL if available
        
    };

    // Send post data to the server
    try {
        const response = await fetch('http://localhost:4000/addPost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
            
        });

        const data = await response.json();
        if (data.success) {
            alert('Post added successfully!');
            textarea.value = ''; // Clear textarea
            fileInput.value = ''; // Clear file input
            videoInput.value = ''; // Clear video input
            fetchPosts(); // Refresh posts
        } else {
            alert('Failed to add post.');
        }
    } catch (error) {
        console.error('Error adding post:', error);
        alert('Error adding post.');
    }
});

app.get('/getTimelinePosts', (req, res) => {
  // You can pass a userId dynamically from the request (e.g., req.query or req.body)
  const userId = req.query.userId;  // Assuming you pass the user ID in the query string

  // Ensure userId is provided
  if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  const query = 'CALL GetPostsByUserId(?)';

  db.query(query, [userId], (err, results) => {
      if (err) {
          console.error('Error fetching posts:', err);
          return res.status(500).json({ success: false, error: 'Failed to fetch posts.' });
      }

      // results[0] contains the result of the stored procedure
      if (results[0].length === 0) {
          return res.status(404).json({ success: false, message: 'No posts found for this user.' });
      }

      res.json({ success: true, posts: results[0] });
  });
});
// Get __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Save files to "uploads" directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage });

// File upload endpoint
app.post('/upload', (req, res) => {
  const file = req.files.file; // Assuming you're using something like `express-fileupload`

  // Upload logic (e.g., save to a directory or cloud storage)
  const fileUrl = `http://localhost:4000/uploads/${file.name}`; // Example URL
  res.json({ success: true, fileUrl });
});

