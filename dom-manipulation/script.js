document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const quoteDisplay = document.getElementById("quoteDisplay");
  const newQuoteBtn = document.getElementById("newQuote");
  const newQuoteText = document.getElementById("newQuoteText");
  const newQuoteCategory = document.getElementById("newQuoteCategory");
  const importFile = document.getElementById("importFile");
  const categoryFilter = document.getElementById("categoryFilter");
  const notification = document.getElementById("notification");

  // Initialize quotes array - load from localStorage or use default quotes
  let quotes = JSON.parse(localStorage.getItem("quotes")) || [
    { text: "The only way to do great work is to love what you do.", category: "motivation" },
    { text: "Life is what happens when you're busy making other plans.", category: "life" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "innovation" },
    { text: "Your time is limited, don't waste it living someone else's life.", category: "life" }
  ];

  // Get selected category from localStorage or default to "all"
  let selectedCategory = localStorage.getItem("selectedCategory") || "all";

  // Show notification function
  function showNotification(message, type = "info") {
    notification.textContent = message;
    notification.className = type;
    notification.style.display = "block";
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }

  // Show random quote function
  function showRandomQuote() {
    // Filter quotes based on selected category
    let filteredQuotes = quotes;
    if (selectedCategory !== "all") {
      filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    }
    
    // Check if there are quotes available
    if (filteredQuotes.length === 0) {
      quoteDisplay.textContent = "No quotes available for this category.";
      return;
    }
    
    // Get random quote
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    
    // Display quote
    quoteDisplay.innerHTML = `"${quote.text}" - <em>${quote.category}</em>`;
    
    // Store last quote in session storage
    sessionStorage.setItem("lastQuote", JSON.stringify(quote));
    
    showNotification("New quote displayed!", "success");
  }

  // Add quote function - must be global for onclick handler
  window.addQuote = function() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
    
    // Validate input
    if (!text || !category) {
      showNotification("Please enter both quote text and category.", "error");
      return;
    }
    
    // Create new quote object
    const newQuote = { text, category };
    
    // Add to quotes array
    quotes.push(newQuote);
    
    // Save to localStorage
    localStorage.setItem("quotes", JSON.stringify(quotes));
    
    // Clear form inputs
    newQuoteText.value = "";
    newQuoteCategory.value = "";
    
    // Update categories dropdown
    populateCategories();
    
    // Show the new quote if it matches current filter
    if (selectedCategory === "all" || selectedCategory === category) {
      showRandomQuote();
    }
    
    showNotification(`Quote added to "${category}" category!`, "success");
  };

  // Populate categories dropdown
  function populateCategories() {
    // Get unique categories from quotes
    const categories = [...new Set(quotes.map(q => q.category))];
    
    // Clear existing options
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    // Add category options
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      categoryFilter.appendChild(option);
    });
    
    // Set selected category
    categoryFilter.value = selectedCategory;
  }

  // Filter quotes by category
  function filterQuotes() {
    selectedCategory = categoryFilter.value;
    localStorage.setItem("selectedCategory", selectedCategory);
    showRandomQuote();
    
    const categoryName = selectedCategory === "all" ? "all categories" : selectedCategory;
    showNotification(`Showing quotes from: ${categoryName}`, "info");
  }

  // Export quotes to JSON file
  window.exportToJsonFile = function() {
    if (quotes.length === 0) {
      showNotification("No quotes to export!", "error");
      return;
    }
    
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "quotes.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showNotification("Quotes exported successfully!", "success");
  };

  // Import quotes from JSON file
  function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
      try {
        const importedQuotes = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedQuotes)) {
          throw new Error("Invalid file format");
        }
        
        // Add imported quotes to existing quotes
        let importCount = 0;
        importedQuotes.forEach(quote => {
          if (quote.text && quote.category) {
            // Check for duplicates (optional)
            const isDuplicate = quotes.some(q => 
              q.text === quote.text && q.category === quote.category
            );
            
            if (!isDuplicate) {
              quotes.push(quote);
              importCount++;
            }
          }
        });
        
        // Save to localStorage
        localStorage.setItem("quotes", JSON.stringify(quotes));
        
        // Update UI
        populateCategories();
        showRandomQuote();
        
        showNotification(`Imported ${importCount} quotes successfully!`, "success");
        
      } catch (error) {
        showNotification("Error importing file. Please check the file format.", "error");
      }
    };
    
    fileReader.readAsText(file);
    // Reset file input
    event.target.value = "";
  }

  // Fetch quotes from server (mock API)
  async function fetchQuotesFromServer() {
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts");
      const data = await response.json();
      
      // Convert posts to quote format (using first 5 posts)
      return data.slice(0, 5).map(post => ({
        text: post.title,
        category: "server"
      }));
    } catch (error) {
      console.error("Error fetching quotes from server:", error);
      return [];
    }
  }

  // Post quotes to server (mock)
  async function postQuotesToServer() {
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify({ quotes: quotes }),
        headers: { "Content-Type": "application/json" }
      });
      return response.ok;
    } catch (error) {
      console.error("Error posting quotes to server:", error);
      return false;
    }
  }

  // Sync quotes with server
  window.syncQuotes = async function() {
    showNotification("Syncing with server...", "info");
    
    try {
      // Fetch quotes from server
      const serverQuotes = await fetchQuotesFromServer();
      
      // Add new server quotes to local quotes
      let syncCount = 0;
      serverQuotes.forEach(serverQuote => {
        const isDuplicate = quotes.some(q => 
          q.text === serverQuote.text && q.category === serverQuote.category
        );
        
        if (!isDuplicate) {
          quotes.push(serverQuote);
          syncCount++;
        }
      });
      
      // Save to localStorage
      localStorage.setItem("quotes", JSON.stringify(quotes));
      
      // Update UI
      populateCategories();
      showRandomQuote();
      
      // Post current quotes to server
      await postQuotesToServer();
      
      // Show sync notification
      const syncMessage = syncCount > 0 
        ? `Synced ${syncCount} new quotes from server!`
        : "All server quotes already exist locally.";
      showNotification(syncMessage, "success");
      
    } catch (error) {
      showNotification("Failed to sync with server.", "error");
      console.error("Sync error:", error);
    }
  };

  // Event listeners
  newQuoteBtn.addEventListener("click", showRandomQuote);
  categoryFilter.addEventListener("change", filterQuotes);
  importFile.addEventListener("change", importFromJsonFile);

  // Initialize the application
  populateCategories();
  showRandomQuote();
  
  // Save quotes to localStorage on first load if they don't exist
  if (!localStorage.getItem("quotes")) {
    localStorage.setItem("quotes", JSON.stringify(quotes));
  }
  
  // Optional: Auto-sync every 30 seconds (commented out to avoid spam)
  // setInterval(syncQuotes, 30000);
});
