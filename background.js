// Save shopping items to local storage
function saveItems(items) {
    chrome.storage.local.set({ shoppingItems: items }, function () {
        console.log('All shopping items have been saved.');
    });
}

function fetchFavicon(url, callback) {
    // Use Google's favicon service to get the website's favicon
    const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`;

    // Pass the generated URL to the callback function 
    callback(faviconUrl);
}

// Import shopping items from local storage that were saved previously
function importItems() {
    chrome.storage.local.get(['shoppingItems'], function (result) {
        const shoppingItems = result.shoppingItems || [];
        saveItems(shoppingItems);
    });
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        importItems();
    }
});

/*
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "keepPopupOpen") {
        chrome.windows.getCurrent((window) => {
            chrome.windows.update(window.id, { focused: true });
        });
    }
}); */
