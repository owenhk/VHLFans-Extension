// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Get loading song
    if (request.action === "getLoadingSong") {
        fetch("https://app.vhlfans.owensucksat.life/get_some_fun", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
            .then(response => {
                // Check if the response is ok before trying to parse it as JSON
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Server responded with ${response.status}: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data });
            })
            .catch(error => {
                console.error("Loading song API request failed:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // keeps the message channel open for async response
    }

    // Send questions and get answers
    else if (request.action === "sendRequest") {
        const request_data = request.input;

        fetch("https://app.vhlfans.owensucksat.life/cheat_engine/classic_cheat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request_data)
        })
            .then(response => {
                // Check if the response is ok before trying to parse it as JSON
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Server responded with ${response.status}: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data });
            })
            .catch(error => {
                console.error("API request failed:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // keeps the message channel open for async response
    }
});
