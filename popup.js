document.addEventListener('DOMContentLoaded', function () {
    const addButton = document.getElementById('add-button');
    const autoFillButton = document.getElementById('auto-fill-button');
    const searchInput = document.getElementById('search-input');
    const sortOptions = document.getElementById('sort-options');

    // Event Listeners
    addButton.addEventListener('click', addItem);
    autoFillButton.addEventListener('click', autoFillAll);
    searchInput.addEventListener('input', filterBySearch);
    sortOptions.addEventListener('change', sortItems);

    function extractItemDetails() {
        let title = document.querySelector('meta[property="og:title"]')?.content || document.title;
        let url = window.location.href;
        let price = document.querySelector('meta[property="product:price:amount"]')?.content || '';
        if (!price) {
            const priceElement = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen');
            if (priceElement) {
                price = priceElement.textContent.replace(/[^0-9.]/g, '');
            }
        }
        return { title, url, price };
    }

    function autoFillAll() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs.length) return console.error("No active tab found");
            
            const currentTab = tabs[0];
            if (!currentTab.url.startsWith("http")) {
                console.warn("Cannot inject script on non-HTTP pages.")
                return;
            }
            
            chrome.scripting.executeScript(
                {
                    target: { tabId: currentTab.id },
                    function: extractItemDetails
                },
                (injectionResults) => {
                    for (const frameResult of injectionResults) {
                        const { title, url, price } = frameResult.result;
                        document.getElementById('item-title').value = title;
                        document.getElementById('item-url').value = url;
                        document.getElementById('item-price').value = price;
                    }
                }
            );
        });
    }

    function addItem() {
        const titleInput = document.getElementById('item-title');
        const urlInput = document.getElementById('item-url');
        const priceInput = document.getElementById('item-price');
        const categoryInput = document.getElementById('item-category');
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        const price = priceInput.value.trim();
        const category = categoryInput.value;

        if (title && url && price) {
            const item = { title, url, price, category, dateAdded: new Date().toISOString() };

            chrome.storage.sync.get(['shoppingItems'], function (result) {
                const shoppingItems = result.shoppingItems || [];
                shoppingItems.push(item);
                chrome.storage.sync.set({ shoppingItems: shoppingItems }, function () {
                    addItemToList(item);
                    titleInput.value = '';
                    urlInput.value = '';
                    priceInput.value = '';
                    categoryInput.value = '';
                });
            });
        }
    }

    // Retrieves the favicon used on the page
    function fetchFavicon(url, callback) {
        const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`;
        callback(faviconUrl);
    }

    function addItemToList(item) {
        const itemsList = document.getElementById('items');

        const listItem = document.createElement('li');

        const link = document.createElement('a');
        const price = document.createElement('span');
        const category = document.createElement('span');
        const favicon = document.createElement('img');
        const removeButton = document.createElement('button');

        link.href = item.url;
        link.textContent = item.title;
        link.target = '_blank';

        price.textContent = `Price: ${item.price}`;
        category.textContent = `Category: ${item.category}`;

        // Checking if an item has a favicon URL stored.
        if (item.faviconUrl) {
            favicon.src = item.faviconUrl;

        // If not, fetch the favicon using a function 
        } else {
            fetchFavicon(item.url, function (faviconUrl) {
                favicon.src = faviconUrl;
            });
        }

        favicon.className = 'favicon';
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove-button';

        removeButton.addEventListener('click', function () {
            removeItem(item);
            itemsList.removeChild(listItem);
        });

        listItem.appendChild(favicon);
        listItem.appendChild(link);
        listItem.appendChild(price);
        listItem.appendChild(category);
        listItem.appendChild(removeButton);
        itemsList.appendChild(listItem);
    }

    function removeItem(item) {
        chrome.storage.sync.get(['shoppingItems'], function (result) {
            const shoppingItems = result.shoppingItems || [];
            const filteredItems = shoppingItems.filter(i => i.url !== item.url);
            chrome.storage.sync.set({ shoppingItems: filteredItems });
        });
    }

    var acc = document.getElementsByClassName("accordion");
        var i;
        
    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
        });
    }

    function sortItems() {
        const sortOption = document.getElementById('sort-options').value;

        chrome.storage.sync.get(['shoppingItems'], function (result) {
            const shoppingItems = result.shoppingItems || [];

            switch (sortOption) {
                case 'alphabetical':
                    shoppingItems.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'date-added':
                    shoppingItems.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                    break;
                case 'price':
                    shoppingItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    break;
            }

            chrome.storage.sync.set({ shoppingItems: shoppingItems }, function () {
                const itemsList = document.getElementById('items');
                itemsList.innerHTML = '';
                shoppingItems.forEach(item => addItemToList(item));
            });
        });
    }

    function filterBySearch() {
        const searchInput = document.getElementById('search-input').value.toLowerCase();
        const itemsList = document.getElementById('items');
        const items = itemsList.getElementsByTagName('li');

        for (let i = 0; i < items.length; i++) {
            const link = items[i].getElementsByTagName('a')[0];
            const textValue = link.textContent || link.innerText;
            items[i].style.display = textValue.toLowerCase().includes(searchInput) ? '' : 'none';
        }
    }

    // Load saved theme preference
    chrome.storage.sync.get(['theme'], function (result) {
        const theme = result.theme || 'light-theme';
        document.body.classList.add(theme);
        themeToggle.checked = theme === 'dark-theme';
    });

    // Load shopping items on startup
    chrome.storage.sync.get(['shoppingItems'], function (result) {
        const shoppingItems = result.shoppingItems || [];
        shoppingItems.forEach(item => addItemToList(item));
    });

});