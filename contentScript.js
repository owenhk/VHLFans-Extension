class Question {
    constructor(selector, type, question, options) {
        this.selector = selector;
        this.type = type;
        this.question = question;
        this.options = options;
    }
}

class Input {
    constructor(questions, lesson_id, lesson_name, unit) {
        this.questions = questions;
        this.lesson_id = lesson_id;
        this.lesson_name = lesson_name;
        this.unit = unit;
    }

    to_dict() {
        return {
            questions: this.questions,
            lesson_id: this.lesson_id,
            lesson_name: this.lesson_name,
            unit: this.unit,
        }
    }
}

// Initialize audio player and UI elements
let audioPlayer = null;
let overlay = null;
let messageBox = null;
let cheatButton = null;

// Function to add the "Cheat with VHLFans" button to the activity header
function addCheatButton() {
    // Select the header container and the <hr> element
    const headerContainer = document.querySelector('.c-activity-header');
    const hrElement = document.querySelector('.c-activity-header__rule');

    // Apply flex styles to the header container to align items vertically centered
    if (headerContainer) {
        headerContainer.style.display = 'flex';
        headerContainer.style.alignItems = 'center'; // Centers items vertically
    }

    // Create the button with our custom class
    cheatButton = document.createElement('button');
    cheatButton.className = 'vhl-fans-button';
    cheatButton.textContent = 'This lesson has a VHLFans ;) ✌️';
    cheatButton.style.margin = '0 8px';

    // Insert the button before the <hr> element
    if (headerContainer && hrElement) {
        headerContainer.insertBefore(cheatButton, hrElement);

        // Add click event listener
        cheatButton.addEventListener('click', startCheating);
    } else {
        // Fallback if we can't find the header container or hr element
        const activityHeaderToolbar = document.querySelector('.c-activity-header__toolbar');

        if (activityHeaderToolbar) {
            // Insert the button at the beginning of the toolbar
            activityHeaderToolbar.insertBefore(cheatButton, activityHeaderToolbar.firstChild);

            // Add click event listener
            cheatButton.addEventListener('click', startCheating);
        } else {
            // Try to find any header or navigation element
            const headerElement = document.querySelector('header, nav');

            if (headerElement) {
                // Insert at the beginning
                headerElement.insertBefore(cheatButton, headerElement.firstChild);

                // Add click event listener
                cheatButton.addEventListener('click', startCheating);
            } else {
                // Fallback if we can't find any suitable container - add button to the top of the page
                cheatButton.style.position = 'fixed';
                cheatButton.style.top = '10px';
                cheatButton.style.right = '10px';
                cheatButton.style.zIndex = '10000';

                document.body.appendChild(cheatButton);
                cheatButton.addEventListener('click', startCheating);
            }
        }
    }
}

// Create overlay and message elements
function createUIElements() {
    // Create overlay for pulsing effect
    overlay = document.createElement('div');
    overlay.id = 'vhl-extension-overlay';
    document.body.appendChild(overlay);

    // Create message box
    messageBox = document.createElement('div');
    messageBox.id = 'vhl-extension-message';
    messageBox.style.display = 'none';
    document.body.appendChild(messageBox);

    // Create audio player
    audioPlayer = document.createElement('audio');
    audioPlayer.id = 'vhl-extension-audio';
    audioPlayer.controls = false;
    document.body.appendChild(audioPlayer);
}

// Show a message in the message box
function showMessage(message) {
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.style.display = 'block';

        // Hide message after 5 seconds
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 10000);
    }
}

// Start the cheating process
function startCheating() {
    // Disable the button during processing
    cheatButton.disabled = true;

    // Show loading message
    showMessage('Getting loading music...');

    // Get loading song from API
    chrome.runtime.sendMessage(
        { action: "getLoadingSong" },
        (response) => {
            if (!response || !response.success) {
                console.error("Failed to get loading song:", response?.error);
                showMessage('Failed to get loading music. Try again.');
                cheatButton.disabled = false;
                return;
            }

            // Show loading message
            showMessage('Hold tight, gathering page info.');

            // Get questions from the page
            const input = prepPageForExport();

            // Show sending message
            showMessage('Running VargasOS, this might take ~20 seconds.');

            // Now that we're ready to send the request, play the loading song and show the overlay
            const songUrl = response.data.loading_song;
            playAudio(songUrl);

            // Add blue pulsing effect
            overlay.classList.add('pulsing-blue');
            overlay.style.display = 'block';

            // Send questions to API
            sendRequest(input);
        }
    );
}

// Helper function to wait for an element to appear in the DOM
async function waitForElement(selector) {
    return new Promise((resolve) => {
        // First check if the element already exists
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        // If not, set up a MutationObserver to watch for it
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        // Start observing the document body for changes
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });

        // Set a timeout to stop watching after 2 seconds
        setTimeout(() => {
            observer.disconnect();
            // If element wasn't found, resolve with null
            resolve(document.querySelector(selector));
        }, 2000);
    });
}

// Play audio from URL
function playAudio(url) {
    if (audioPlayer) {
        try {
            // Remove any existing click listeners to prevent the audio glitch
            const oldPlayOnClick = window.vhlPlayOnClickHandler;
            if (oldPlayOnClick) {
                document.removeEventListener('click', oldPlayOnClick);
            }

            audioPlayer.src = url;
            audioPlayer.loop = true;

            // Store the handler on the window object so we can remove it later
            window.vhlPlayOnClickHandler = function playOnClick() {
                const playPromise = audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log("Audio is playing.");
                    }).catch(error => {
                        console.error("Failed to play audio:", error);
                    });
                }
            };

            // Add the click handler with once:true to ensure it's removed after first click
            document.addEventListener('click', window.vhlPlayOnClickHandler, { once: true });

            // Try to play immediately, but don't worry if it fails
            audioPlayer.play().catch(error => {
                console.log("Autoplay prevented, will play on next user interaction");
            });
        } catch (error) {
            console.error("Error setting up audio:", error);
            // Continue without audio
        }
    }
}

// Stop audio playback
function stopAudio() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        // Remove any click event listeners to prevent audio from coming back
        const oldPlayOnClick = window.vhlPlayOnClickHandler;
        if (oldPlayOnClick) {
            document.removeEventListener('click', oldPlayOnClick);
            window.vhlPlayOnClickHandler = null;
        }
    }
}

// Function to autofill a custom dropdown
async function autofillDropdown(buttonId, targetOptionText, question) {
    try {
        console.log(`Autofilling dropdown with buttonId: ${buttonId}, targetOptionText: ${targetOptionText}`);

        // Find the dropdown wrapper element
        const dropdownWrapper = document.querySelector(`.js-activity-dropdown-wrapper[data-button-id="${buttonId}"]`);
        if (!dropdownWrapper) {
            console.error("Dropdown wrapper not found for button:", buttonId);
            return false;
        }

        // Get the button element
        const dropdownButton = document.getElementById(buttonId);
        if (!dropdownButton) {
            console.error("Dropdown button not found:", buttonId);
            return false;
        }

        // Find the button text element
        const dropdownButtonText = dropdownButton.querySelector('.c-dropdown-disclosure__button-text');
        if (!dropdownButtonText) {
            console.error("Dropdown button text element not found");
            return false;
        }

        // Get the hidden select element ID from the question, wrapper's data attributes, or construct it
        let selectId = question?.selectId;
        if (!selectId) {
            selectId = dropdownWrapper.getAttribute('data-name');
            if (!selectId) {
                // Try to construct the ID based on common patterns
                const containerId = dropdownWrapper.closest('[id]')?.id;
                if (containerId) {
                    selectId = `${containerId}_1`;
                }
            }
        }

        // Find the hidden select element
        const hiddenSelect = selectId ? document.getElementById(selectId) : null;
        if (!hiddenSelect) {
            console.error("Hidden select element not found");
            return false;
        }

        // Get list data from the question or parse it from the wrapper
        let listData = question?.rawListData;
        if (!listData) {
            const listDataAttr = dropdownWrapper.getAttribute('data-list-data');
            if (!listDataAttr) {
                console.error("No data-list-data attribute found on dropdown wrapper");
                return false;
            }

            try {
                listData = JSON.parse(listDataAttr);
                console.log("Parsed list data:", listData);
            } catch (e) {
                console.error("Failed to parse data-list-data:", e);
                return false;
            }
        }

        // Find the target option in the list data by text
        // The API always sends back the exact text match, never the ID
        let targetIndex = -1;
        let targetValue = null;

        // Try exact match first
        targetIndex = listData.findIndex(item => item.text === targetOptionText);
        console.log(`Searching for exact match: "${targetOptionText}"`);

        // If no exact match, try case-insensitive match
        if (targetIndex === -1) {
            console.log("No exact match found, trying case-insensitive match");
            const lowerTargetText = targetOptionText.toLowerCase();
            targetIndex = listData.findIndex(item => item.text.toLowerCase() === lowerTargetText);
        }

        if (targetIndex === -1) {
            console.error("Target option not found in list data:", targetOptionText);
            return false;
        }

        // Get the value (ID) corresponding to the matched text
        targetValue = listData[targetIndex].value.toString();
        console.log(`Found matching option at index ${targetIndex} with value ${targetValue}`);

        // 1. Update visual representation
        // Update button text
        dropdownButtonText.textContent = targetOptionText;

        // Update aria-label
        dropdownButton.setAttribute('aria-label', targetOptionText);

        // 2. Update hidden select element
        console.log(`Setting hidden select value to ${targetValue}`);
        hiddenSelect.value = targetValue;
        hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // 3. Update data-selected-index
        console.log(`Setting data-selected-index to ${targetIndex}`);
        dropdownWrapper.dataset.selectedIndex = targetIndex.toString();

        // 4. Update Vue.js component state by triggering a click on the button and then on the correct option
        // This ensures the Vue.js component's internal state is updated
        console.log("Opening dropdown to update Vue.js component state");
        dropdownButton.click();

        // Wait for the listbox to appear
        const listbox = await waitForElement('.c-listbox__list');
        if (listbox) {
            console.log("Listbox found, updating aria-selected attributes");
            // Update aria-selected attributes
            const listItems = listbox.querySelectorAll('.c-listbox__item');

            // Find the item with the matching value attribute
            let targetItem = null;
            for (const item of listItems) {
                const itemValue = item.getAttribute('value');
                if (itemValue === targetValue) {
                    targetItem = item;
                    break;
                }
            }

            // If we found the target item, click it to ensure Vue.js state is updated
            if (targetItem) {
                console.log("Found target item in listbox, clicking it");
                targetItem.click();
                return true;
            }

            // If we didn't find the target item by value, update aria-selected attributes manually
            console.log("Target item not found by value, updating aria-selected attributes manually");
            listItems.forEach((item, index) => {
                if (index === targetIndex) {
                    item.setAttribute('aria-selected', 'true');
                } else {
                    item.setAttribute('aria-selected', 'false');
                }
            });

            // Close the dropdown
            console.log("Closing dropdown");
            document.body.click();
        } else {
            console.warn("Listbox not found after clicking button");
        }

        return true;
    } catch (e) {
        console.error("Autofill dropdown failed:", e);
        return false;
    }
}

// Completely refactored function to extract questions from the page
function prepPageForExport() {
    // Prep basic information about the lesson
    const unit = document.querySelector("meta[name='VHL.lesson_name']")?.content || '';
    const longLessonId = document.querySelector("meta[name='VHL.concept_name']");
    let lessonId = "";
    if (longLessonId) {
        const rawContent = longLessonId.content;
        lessonId = rawContent.split("<br/>")[0].trim();
    }
    const lessonName = document.querySelector("meta[name='VHL.activity_title']")?.content || document.title || '';

    // Array to store all questions
    const questions = [];

    // Process table questions first (each cell is a separate question)
    processTableQuestions(questions);

    // Process regular fill-in-the-blank questions
    processFillInTheBlankQuestions(questions);

    // Process dropdown questions
    processDropdownQuestions(questions);

    // Process multiple choice questions
    processMultipleChoiceQuestions(questions);

    // Process open-ended questions
    processOpenEndedQuestions(questions);

    // If no questions were found, try a more generic approach
    if (questions.length === 0) {
        processGenericQuestions(questions);
    }

    // Ensure all questions have valid selectors
    const validQuestions = questions.filter(q => q.selector && q.selector.trim() !== '');

    return new Input(
        validQuestions,
        lessonId,
        lessonName,
        unit
    );
}

// Process table questions (each cell is a separate question)
function processTableQuestions(questions) {
    document.querySelectorAll("table.c-table--content, table.c-table, table.activity-table").forEach((table) => {
        // Find the parent question container to get context
        const questionContainer = table.closest("div.questions.u-dis-inline-block, div.answersblank");

        // Get column headers
        const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());

        // Process each row
        table.querySelectorAll("tbody tr").forEach((row) => {
            // Get row header (first cell)
            const rowHeader = row.querySelector("td:first-child")?.textContent.trim() || '';
            if (!rowHeader) return; // Skip if no row header

            // Process each cell with an input (skip the first cell which is the row header)
            row.querySelectorAll("td:not(:first-child)").forEach((cell, cellIndex) => {
                // Find input elements in this cell
                const inputs = cell.querySelectorAll("input[type='text'], textarea");

                // Get column header for this cell (add 1 to cellIndex because we're skipping the first cell)
                const columnHeader = headers[cellIndex + 1] || '';

                inputs.forEach((input) => {
                    if (!input.id) return; // Skip if no ID

                    // Use the input's ID as the selector (this is crucial for autofill)
                    const selector = input.id;

                    // Get the question text - for table cells, combine column header and row header
                    // Format: "Column Header Row Header" (e.g., "tú disfrutar")
                    const questionText = `${columnHeader} ${rowHeader}`.trim();

                    // Create and add the question
                    questions.push(new Question(
                        selector,
                        "fill_in_the_blanks",
                        questionText,
                        null
                    ));
                });
            });
        });
    });
}

// Process regular fill-in-the-blank questions
function processFillInTheBlankQuestions(questions) {
    // Find all question containers
    document.querySelectorAll("div.questions.u-dis-inline-block, div.answersblank").forEach((container) => {
        if (!container.id) return; // Skip if no ID

        // Check if this is a fill-in-the-blank question
        const inputs = container.querySelectorAll("input[type='text']");
        if (inputs.length === 0) return; // Skip if no text inputs

        // Get the whole question element
        const wholeQuestion = document.getElementById(`${container.id}_whole_question`);
        if (!wholeQuestion) return; // Skip if no whole question element

        // Extract the actual question text
        let questionText = "";

        // Try to get the question text from the screen reader label
        const label = document.getElementById(`a11y_label_${container.id}`);
        if (label) {
            const fullSentenceSpan = label.querySelector("span[lang='en']:nth-of-type(2)");
            if (fullSentenceSpan && fullSentenceSpan.textContent.includes("Full sentence")) {
                // Get the text content after "Full sentence, question: "
                const fullText = fullSentenceSpan.nextSibling?.textContent?.trim();
                if (fullText) questionText = fullText;
            }
        }

        // If we couldn't get the question text from the label, try the whole question div
        if (!questionText) {
            // Get the text content, excluding any screen reader text
            const screenReaderSpans = Array.from(wholeQuestion.querySelectorAll("span.u-screen-reader-only"));
            let text = wholeQuestion.textContent.trim();

            // Remove screen reader text
            screenReaderSpans.forEach(span => {
                text = text.replace(span.textContent, "");
            });

            // Clean up the text
            questionText = text.replace(/\s+/g, ' ').trim();
        }

        // If we still don't have a question text, use the container ID
        if (!questionText) {
            questionText = container.id;
        }

        // For each input, create a separate question
        inputs.forEach((input) => {
            // Use the input's ID as the selector if available, otherwise use the container ID
            const selector = input.id || container.id;

            // Create and add the question
            questions.push(new Question(
                selector,
                "fill_in_the_blanks",
                questionText,
                null
            ));
        });
    });
}

// Process dropdown questions
function processDropdownQuestions(questions) {
    // Find all dropdown wrappers
    document.querySelectorAll(".js-activity-dropdown-wrapper, select").forEach((dropdown) => {
        // Find the parent question container
        const container = dropdown.closest("div.questions.u-dis-inline-block, div.answersblank");
        if (!container || !container.id) return; // Skip if no container or no ID

        // Get the whole question element
        const wholeQuestion = document.getElementById(`${container.id}_whole_question`);
        if (!wholeQuestion) return; // Skip if no whole question element

        // Try to get the clean question text from the screen reader label
        let questionText = "";
        const labelElement = document.getElementById(`${container.id}_whole_question_label`);
        if (labelElement && labelElement.textContent) {
            questionText = labelElement.textContent.trim().replace(/\s+/g, ' ');
        } else {
            // Fallback to the whole question text, but try to clean it up
            questionText = wholeQuestion.textContent.trim().replace(/\s+/g, ' ');

            // Remove any text that appears after "blank" as it might contain dropdown options
            const blankIndex = questionText.indexOf("blank");
            if (blankIndex !== -1) {
                const endIndex = questionText.indexOf(".", blankIndex);
                if (endIndex !== -1) {
                    questionText = questionText.substring(0, endIndex + 1);
                }
            }
        }

        // Extract options and raw list data
        let options = null;
        let rawListData = null;
        const rawData = dropdown.getAttribute("data-list-data");
        if (rawData) {
            try {
                rawListData = JSON.parse(rawData);
                options = rawListData.map(opt => opt.text);
            } catch (e) {
                console.error("Failed to parse dropdown data:", e);
            }
        } else if (dropdown.tagName === 'SELECT') {
            options = Array.from(dropdown.options).map(opt => opt.textContent.trim());
        }

        // If we still don't have options, try to find a select element within the container
        let selectElement = null;
        if (!options) {
            selectElement = container.querySelector("select");
            if (selectElement) {
                options = Array.from(selectElement.options).map(opt => opt.textContent.trim());
            }
        }

        // Store the button ID if available (for custom dropdowns)
        const buttonId = dropdown.getAttribute("data-button-id");

        // Get the select element ID
        let selectId = dropdown.getAttribute("data-name");
        if (!selectId && selectElement) {
            selectId = selectElement.id;
        }
        if (!selectId) {
            // Try to construct the ID based on common patterns
            selectId = `${container.id}_1`;
        }

        // Create and add the question with additional metadata
        const question = new Question(
            container.id, // Use the container ID as the selector
            "drop_down",
            questionText,
            options
        );

        // Add custom properties for dropdown handling
        question.buttonId = buttonId;
        question.isCustomDropdown = !!buttonId;
        question.rawListData = rawListData;
        question.selectId = selectId;

        questions.push(question);
    });
}


// Process multiple choice questions
function processMultipleChoiceQuestions(questions) {
    // Find all question containers with radio buttons
    document.querySelectorAll("div.questions.u-dis-inline-block, div.answersblank").forEach((container) => {
        if (!container.id) return; // Skip if no ID

        // Check if this is a multiple choice question
        const radioButtons = container.querySelectorAll("input[type='radio']");
        if (radioButtons.length === 0) return; // Skip if no radio buttons

        // Get the whole question element
        const wholeQuestion = document.getElementById(`${container.id}_whole_question`);
        if (!wholeQuestion) return; // Skip if no whole question element

        // Extract the question text
        let questionText = wholeQuestion.textContent.trim().replace(/\s+/g, ' ');

        // Extract options
        const optionsElements = container.querySelectorAll('.answer_blank label span, label span');
        const options = Array.from(optionsElements).map(el => el.textContent.trim());

        // Create and add the question
        questions.push(new Question(
            container.id, // Use the container ID as the selector
            "multiple_choice",
            questionText,
            options
        ));
    });
}

// Process open-ended questions
function processOpenEndedQuestions(questions) {
    // Find all question containers with textareas
    document.querySelectorAll("div.questions.u-dis-inline-block, div.answersblank").forEach((container) => {
        if (!container.id) return; // Skip if no ID

        // Check if this is an open-ended question
        const textareas = container.querySelectorAll("textarea");
        if (textareas.length === 0) return; // Skip if no textareas

        // Get the whole question element
        const wholeQuestion = document.getElementById(`${container.id}_whole_question`);
        if (!wholeQuestion) return; // Skip if no whole question element

        // Extract the question text
        let questionText = wholeQuestion.textContent.trim().replace(/\s+/g, ' ');

        // Create and add the question
        questions.push(new Question(
            container.id, // Use the container ID as the selector
            "open_ended",
            questionText,
            null
        ));
    });
}

// Generic approach to find any questions that might have been missed
function processGenericQuestions(questions) {
    // Look for any input fields or textareas
    document.querySelectorAll("input[type='text'], textarea").forEach((input) => {
        if (!input.id) return; // Skip if no ID

        // Try to find a parent container with an ID
        let container = input.closest("div.questions.u-dis-inline-block, div.answersblank");
        if (!container || !container.id) {
            // If no container found, use the input itself
            const selector = input.id;
            const questionText = input.getAttribute("aria-label") || input.name || input.id;

            // Create and add the question
            questions.push(new Question(
                selector,
                input.tagName === 'TEXTAREA' ? "open_ended" : "fill_in_the_blanks",
                questionText,
                null
            ));
        }
    });

    // Look for any select elements
    document.querySelectorAll("select").forEach((select) => {
        if (!select.id) return; // Skip if no ID

        const selector = select.id;
        const questionText = select.getAttribute("aria-label") || select.name || select.id;
        const options = Array.from(select.options).map(opt => opt.textContent.trim());

        // Create and add the question
        questions.push(new Question(
            selector,
            "drop_down",
            questionText,
            options
        ));
    });
}

// Helper function to determine the question type
function determineQuestionType(questionDiv) {
    // Check for dropdown
    if (questionDiv.querySelector(".js-activity-dropdown-wrapper, select")) {
        return "drop_down";
    }

    // Check for multiple choice
    if (questionDiv.querySelector("input[type='radio']")) {
        return "multiple_choice";
    }

    // Check for open-ended (textarea)
    if (questionDiv.querySelector("textarea")) {
        return "open_ended";
    }

    // Default to fill in the blanks
    return "fill_in_the_blanks";
}

// Helper function to extract the question text
function extractQuestionText(questionDiv) {
    // Try to get the question text from the screen reader label
    const labelId = `a11y_label_${questionDiv.id}`;
    const label = document.getElementById(labelId);

    if (label) {
        // Try to get the full sentence from the screen reader text
        const fullSentenceSpan = label.querySelector("span[lang='en']:nth-of-type(2)");
        if (fullSentenceSpan && fullSentenceSpan.textContent.includes("Full sentence")) {
            // Get the text content after "Full sentence, question: "
            const fullText = fullSentenceSpan.nextSibling?.textContent?.trim() || "";
            if (fullText) return fullText;
        }
    }

    // If we couldn't get the question text from the label, try the whole question div
    const wholeQuestionId = `${questionDiv.id}_whole_question`;
    const wholeQuestion = document.getElementById(wholeQuestionId);

    if (wholeQuestion) {
        // Get the text content, excluding any screen reader text
        const screenReaderSpans = Array.from(wholeQuestion.querySelectorAll("span.u-screen-reader-only"));
        let text = wholeQuestion.textContent.trim();

        // Remove screen reader text
        screenReaderSpans.forEach(span => {
            text = text.replace(span.textContent, "");
        });

        // Clean up the text
        text = text.replace(/\s+/g, ' ').trim();
        if (text) return text;
    }

    // If all else fails, just return the ID as the question text
    return questionDiv.id;
}

// Helper function to extract options for dropdown or multiple choice questions
function extractOptions(questionDiv, questionType) {
    if (questionType === "drop_down") {
        const dropdown = questionDiv.querySelector(".js-activity-dropdown-wrapper");
        const rawData = dropdown?.getAttribute("data-list-data");
        if (rawData) {
            try {
                return JSON.parse(rawData).map(opt => opt.text);
            } catch (e) {
                console.error("Failed to parse dropdown data:", e);
            }
        }

        // Try to get options from select element
        const select = questionDiv.querySelector("select");
        if (select) {
            return Array.from(select.options).map(opt => opt.textContent.trim());
        }
    }
    else if (questionType === "multiple_choice") {
        const optionsElements = questionDiv.querySelectorAll('.answer_blank label span, label span');
        return Array.from(optionsElements).map(el => el.textContent.trim());
    }

    return null;
}

// Send questions to API and handle the response
async function sendRequest(input) {
    chrome.runtime.sendMessage(
        {
            action: "sendRequest",
            input: {
                questions: input.questions,
                lesson_id: input.lesson_id,
                lesson_name: input.lesson_name,
                unit: input.unit
            }
        },
        async (response) => {
            // Stop audio regardless of success or failure
            stopAudio();

            if (!response || !response.success) {
                console.error("Failed to get response:", response?.error);
                showMessage('Failed to get answers. Try again!');

                // Remove pulsing effect
                overlay.classList.remove('pulsing-blue');
                overlay.style.display = 'none';

                // Update button text
                cheatButton.textContent = 'Try again!';
                cheatButton.disabled = false;
                return;
            }

            // Show success message
            showMessage('Got answers! Filling in...');

            // Change pulsing to green
            overlay.classList.remove('pulsing-blue');
            overlay.classList.add('pulsing-green');

            const data = response.data;
            let filledCount = 0;

            // Process each question and fill in answers
            for (const q of data.answers) {
                if (!q.selector || !q.answer) continue;

                const element = document.getElementById(q.selector);
                if (!element) continue;

                if (q.type === "drop_down") {
                    // First try to handle custom dropdown if we have a button ID
                    if (q.buttonId) {
                        try {
                            // Make sure we have the additional properties from the original question
                            const originalQuestion = input.questions.find(origQ => origQ.selector === q.selector);

                            // Pass the selectId and rawListData to the autofillDropdown function if available
                            if (originalQuestion && originalQuestion.selectId) {
                                q.selectId = originalQuestion.selectId;
                            }

                            if (originalQuestion && originalQuestion.rawListData) {
                                q.rawListData = originalQuestion.rawListData;
                            }

                            // Use the autofillDropdown function
                            // The API always sends back the exact text match, never the ID
                            const filled = await autofillDropdown(q.buttonId, q.answer, q);
                            if (filled) {
                                filledCount++;
                                continue; // Skip to next question if successful
                            }
                        } catch (error) {
                            console.error("Error handling custom dropdown:", error);
                            // Fall through to the standard approach
                        }
                    }

                    // If we get here, either the custom dropdown handling failed or wasn't applicable
                    // Fall back to the original approach

                    // Try to find the select element - it might have a different ID than the container
                    let select = element.querySelector("select");

                    // If not found directly, try to find it by ID pattern (container_id + "_1")
                    if (!select) {
                        select = document.getElementById(`${q.selector}_1`);
                    }

                    // If still not found, try a more general approach to find any select in the container
                    if (!select) {
                        select = element.querySelector("[id^='" + q.selector + "_']");
                    }

                    // If still not found, try to find any select element with an ID that contains the selector
                    if (!select) {
                        const allSelects = document.querySelectorAll("select");
                        for (const s of allSelects) {
                            if (s.id && s.id.includes(q.selector)) {
                                select = s;
                                break;
                            }
                        }
                    }

                    if (!select) continue;

                    // The API always sends back the exact text match, never the ID
                    let optionFound = false;

                    // Try to match by text
                    if (!optionFound) {
                        // Find the option that matches the answer text
                        for (const option of select.options) {
                            if (option.textContent.trim() === q.answer) {
                                select.value = option.value;
                                select.dispatchEvent(new Event("change", { bubbles: true }));
                                filledCount++;
                                optionFound = true;
                                break;
                            }
                        }
                    }

                    // If still no match, try a case-insensitive match
                    if (!optionFound) {
                        const lowerAnswer = q.answer.toLowerCase();
                        for (const option of select.options) {
                            if (option.textContent.trim().toLowerCase() === lowerAnswer) {
                                select.value = option.value;
                                select.dispatchEvent(new Event("change", { bubbles: true }));
                                filledCount++;
                                optionFound = true;
                                break;
                            }
                        }
                    }
                }
                else if (q.type === "open_ended" || q.type === "fill_in_the_blanks") {
                    // Check if the element is the input itself
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.value = q.answer;
                        element.dispatchEvent(new Event("input", { bubbles: true }));
                        element.dispatchEvent(new Event("change", { bubbles: true }));
                        filledCount++;
                    } else {
                        // Otherwise, look for an input within the element
                        const input = element.querySelector("input[type='text'], textarea");
                        if (input) {
                            input.value = q.answer;
                            input.dispatchEvent(new Event("input", { bubbles: true }));
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            filledCount++;
                        }
                    }
                }
                else if (q.type === "multiple_choice") {
                    const options = element.querySelectorAll("input[type='radio']");
                    const labels = element.querySelectorAll("label");

                    // First try to find an exact match
                    let found = false;
                    for (let i = 0; i < labels.length; i++) {
                        if (labels[i].textContent.trim() === q.answer && options[i]) {
                            options[i].checked = true;
                            options[i].dispatchEvent(new Event("change", { bubbles: true }));
                            filledCount++;
                            found = true;
                            break;
                        }
                    }

                    // If no exact match, try a more flexible approach
                    if (!found) {
                        // Try to match by label text containing the answer
                        for (let i = 0; i < labels.length; i++) {
                            if (labels[i].textContent.trim().includes(q.answer) && options[i]) {
                                options[i].checked = true;
                                options[i].dispatchEvent(new Event("change", { bubbles: true }));
                                filledCount++;
                                found = true;
                                break;
                            }
                        }
                    }

                    // If still not found, try to match by case-insensitive comparison
                    if (!found) {
                        const lowerAnswer = q.answer.toLowerCase();
                        for (let i = 0; i < labels.length; i++) {
                            if (labels[i].textContent.trim().toLowerCase() === lowerAnswer && options[i]) {
                                options[i].checked = true;
                                options[i].dispatchEvent(new Event("change", { bubbles: true }));
                                filledCount++;
                                break;
                            }
                        }
                    }

                    // If we still haven't found a match, try a different approach with spans inside labels
                    if (!found) {
                        const spans = element.querySelectorAll("label span");
                        for (let i = 0; i < spans.length; i++) {
                            if (spans[i].textContent.trim() === q.answer) {
                                // Find the associated radio button
                                const label = spans[i].closest("label");
                                if (label) {
                                    const radioId = label.getAttribute("for");
                                    if (radioId) {
                                        const radio = document.getElementById(radioId);
                                        if (radio) {
                                            radio.checked = true;
                                            radio.dispatchEvent(new Event("change", { bubbles: true }));
                                            filledCount++;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Show completion message
            showMessage(`Filled in ${filledCount} answers!`);

            // Re-enable button
            cheatButton.disabled = false;

            // Remove green pulsing after 3 seconds
            setTimeout(() => {
                overlay.classList.remove('pulsing-green');
                overlay.style.display = 'none';
            }, 3000);
        }
    );
}

// Initialize the extension when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createUIElements();
    addCheatButton();
});

// If the page is already loaded, initialize now
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createUIElements();
    addCheatButton();
}
