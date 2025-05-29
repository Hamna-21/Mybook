document.addEventListener("DOMContentLoaded", function () {
    // Sidebar toggle functionality
    function toggleMenu() {
        const sidebar = document.getElementById("sidebar");
        const content = document.querySelector(".content");

        // Toggle sidebar and content positioning
        sidebar.classList.toggle("active");
        content.classList.toggle("active");
    }

    // Assign toggle function to hamburger menu
    const hamburgerMenu = document.querySelector(".hamburger");
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener("click", toggleMenu);
    } else {
        console.error("Hamburger menu button not found.");
    }

    // Notification icon click functionality (optional)
    const notificationIcon = document.getElementById("notification-icon");
    if (notificationIcon) {
        notificationIcon.addEventListener("click", function () {
            console.log("Notification icon clicked!");
            window.location.href = "Notifications.html"; // Redirect to Notifications.html
        });
    } else {
        console.error("Notification icon not found!");
    }

    // Load the profile picture from localStorage
    const profilePicture = document.getElementById('profile-picture');
    const storedImage = localStorage.getItem('profileImage'); // Get the stored cropped image from localStorage

    if (profilePicture && storedImage) {
        profilePicture.src = storedImage; // Display the cropped image in the circular frame
    }
});
// Function to remove placeholder text when user clicks the textarea
function removePlaceholder() {
    const textarea = document.getElementById('post-textarea');
    if (textarea.value === 'What\'s on your mind today?') {
        textarea.value = '';
    }
}

// Function to restore placeholder text if the textarea is empty
function restorePlaceholder() {
    const textarea = document.getElementById('post-textarea');
    if (textarea.value === '') {
        textarea.value = 'What\'s on your mind today?';
    }
}

// Function to adjust the height of the text area
function adjustHeight(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

// Function to display the uploaded image
function displayImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('uploaded-image');
            const uploadedImageContainer = document.getElementById('uploadedImageContainer');
            uploadedImageContainer.innerHTML = ''; // Clear any existing image
            uploadedImageContainer.appendChild(img); // Add the new image
        }
        reader.readAsDataURL(file);
    }
}




