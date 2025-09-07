document.addEventListener("DOMContentLoaded", () => {
  const quoteDisplay = document.getElementById("quoteDisplay");
  const newQuoteBtn = document.getElementById("newQuote");
  const newQuoteText = document.getElementById("newQuoteText");
  const newQuoteCategory = document.getElementById("newQuoteCategory");
  const importFile = document.getElementById("importFile");
  const exportBtn = document.getElementById("exportBtn");
  const categoryFilter = document.getElementById("categoryFilter");
  const addQuoteBtn = document.getElementById("addQuoteBtn");

  let quotes = JSON.parse(localStorage.getItem("quotes") || "[]");
  let selectedCategory = localStorage.getItem("selectedCategory") || "all";

  function showRandomQuote() {
    let filteredQuotes = quotes;
    if (selectedCategory !== "all") {
      filteredQuotes = quotes.filter(q => q.category === selectedCategory);
    }
    if (filteredQuotes.length === 0) {
      quoteDisplay.textContent = "No quotes available for this category.";
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    quoteDisplay.textContent = `"${quote.text}" - ${quote.category}`;
    sessionStorage.setItem("lastQuote", JSON.stringify(quote));
  }

  function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
    if (!text || !category) {
      alert("Please enter both quote text and category.");
      return;
    }
    const newQ = { text, category };
    quotes.push(newQ);
    localStorage.setItem("quotes", JSON.stringify(quotes));
    newQuoteText.value = "";
    newQuoteCategory.value = "";
    populateCategories();
    showRandomQuote();
  }

  function populateCategories() {
    const categories = [...new Set(quotes.map(q => q.category))];
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
    categoryFilter.value = selectedCategory;
  }

  function filterQuotes() {
    selectedCategory = categoryFilter.value;
    localStorage.setItem("selectedCategory", selectedCategory);
    showRandomQuote();
  }

  function exportToJsonFile() {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      localStorage.setItem("quotes", JSON.stringify(quotes));
      populateCategories();
      showRandomQuote();
      alert("Quotes imported successfully!");
    };
    fileReader.readAsText(event.target.files[0]);
  }

  async function fetchQuotesFromServer() {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();
    return data.slice(0, 5).map(d => ({ text: d.title, category: "server" }));
  }

  async function postQuotesToServer() {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      body: JSON.stringify(quotes),
      headers: { "Content-Type": "application/json" }
    });
  }

  async function syncQuotes() {
    const serverQuotes = await fetchQuotesFromServer();
    serverQuotes.forEach(sq => {
      if (!quotes.some(q => q.text === sq.text && q.category === sq.category)) {
        quotes.push(sq);
      }
    });
    localStorage.setItem("quotes", JSON.stringify(quotes));
    populateCategories();
    showRandomQuote();
    await postQuotesToServer();

    // Notification
    const notification = document.createElement("div");
    notification.textContent = "Quotes synced with server!";
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.backgroundColor = "#4caf50";
    notification.style.color = "white";
    notification.style.padding = "10px 20px";
    notification.style.borderRadius = "8px";
    notification.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.2)";
    notification.style.zIndex = "1000";
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  newQuoteBtn.addEventListener("click", showRandomQuote);
  addQuoteBtn.addEventListener("click", addQuote);
  categoryFilter.addEventListener("change", filterQuotes);
  exportBtn.addEventListener("click", exportToJsonFile);
  importFile.addEventListener("change", importFromJsonFile);

  populateCategories();
  showRandomQuote();
  setInterval(syncQuotes, 30000);
});