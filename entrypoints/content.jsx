export default defineContentScript({
  matches: ['*://*.twitter.com/*', '*://*.x.com/*'],
  main() {
    console.log('Twitter Auto-Follow Extension Active');

    // Function to generate a random delay between 300 to 700 milliseconds
    const followDelay = () => Math.random() * (700 - 300) + 300;

    // Set to track visited avatars to avoid following the same user multiple times
    const visitedAvatars = new Set();

    // Helper function to pause execution for a given time in milliseconds
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Function to activate the 'For You' tab on Twitter
    const activateForYouTab = async () => {
      const forYouTab = [...document.querySelectorAll('span')]
        .find(tab => tab.innerText === 'For you'); // Find the 'For You' tab
      if (forYouTab) {
        console.log("Switching to 'For You' tab...");
        forYouTab.click(); // Click the tab to activate it
        await wait(2000); // Wait for content to load
        console.log("'For You' tab is now active.");
      } else {
        console.error("For You tab not found.");
      }
    };

    // Function to follow a user based on their avatar element
    const followUser = async (avatar) => {
      visitedAvatars.add(avatar); // Mark this avatar as visited
      await avatar.scrollIntoView({ block: "center", behavior: "smooth" }); // Scroll to the avatar
      await wait(500); // Reduced wait for scrolling to complete
      avatar.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); // Hover over the avatar
      console.log("Hovered over profile avatar...");
      await wait(1000); // Keep hover for 1 second
      const followButton = [...document.querySelectorAll('button')]
        .find(btn => btn.textContent.trim() === 'Follow'); // Find the Follow button
      if (followButton) {
        followButton.click(); // Click Follow button
        console.log("Clicked Follow button");
      } else {
        console.log("No Follow button found or already followed.");
      }
      avatar.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })); // Mouse out to close the pop-up
      await wait(followDelay()); // Reduced delay between following each user
    };

    // Main function to follow all users on the screen
    const followAllUsers = async (button) => {
      button.innerText = 'Following...'; // Change button text to 'Following...'
      await activateForYouTab(); // Ensure 'For You' tab is active
      while (true) {
        const feedColumn = document.querySelector('main[role="main"]'); // Select the main feed column
        let userAvatars = [...(feedColumn?.querySelectorAll('div.css-175oi2r div.r-172uzmj.r-1pi2tsx') || [])]
          .filter(avatar => !visitedAvatars.has(avatar)); // Get unvisited avatars

        console.log("Initial Avatar List:", userAvatars);
        // Follow each user avatar found
        while (userAvatars.length) {
          await followUser(userAvatars.shift()); // Follow the first user and remove them from the list
        }

        console.log("Scrolling down for more profiles...");
        await wait(2000); // Reduced wait for new profiles to load
        let newAvatars = [...(feedColumn?.querySelectorAll('div.css-175oi2r div.r-172uzmj.r-1pi2tsx') || [])]
          .filter(avatar => !visitedAvatars.has(avatar)); // Check for new unvisited avatars

        // If no new avatars are found, attempt smaller scroll increments
        if (!newAvatars.length) {
          console.log("No new avatars found. Attempting incremental scroll...");
          for (let i = 0; i < 3; i++) { // Reduced number of incremental scrolls
            window.scrollBy({ top: 300, behavior: 'smooth' }); // Scroll down
            await wait(1000); // Reduced wait between small scrolls
            newAvatars = [...(feedColumn?.querySelectorAll('div.css-175oi2r div.r-172uzmj.r-1pi2tsx') || [])]
              .filter(avatar => !visitedAvatars.has(avatar)); // Re-check for new avatars
            if (newAvatars.length) {
              console.log("New avatars found after incremental scroll.");
              break; // Exit the loop if new avatars are found
            }
          }
          // Stop following if no new avatars are found after scrolling
          if (!newAvatars.length) {
            console.log("No avatars found after incremental scroll. Stopping the follow process.");
            break;
          }
        }
      }
      button.innerText = 'Follow All'; // Revert button text back to 'Follow All' after completing the process
    };

    // Function to create a floating button for following all users
    const createFloatingButton = () => {
      const button = document.createElement('button');
      button.innerText = 'Follow All'; // Button label
      // Set button styles
      Object.assign(button.style, {
        position: 'fixed', 
        top: '20px', 
        right: '20px',
        padding: '10px 15px', 
        backgroundColor: '#1DA1F2', 
        color: 'white',
        border: 'none', 
        borderRadius: '5px', 
        fontSize: '16px',
        cursor: 'pointer', 
        zIndex: '9999', 
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)'
      });
      button.onclick = () => {
        console.log("Follow All button clicked. Starting follow process...");
        followAllUsers(button); // Start following process when button is clicked
      };
      document.body.appendChild(button); // Add button to the document
    };

    // Create the floating button if it doesn't already exist
    if (!document.getElementById('follow-all-button')) {
      createFloatingButton(); // Call the function to create the button
    }
  },
});
