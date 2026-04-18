document.addEventListener('DOMContentLoaded', async () => {
    const pageTitle = document.getElementById('page-title');
    const pageUrl = document.getElementById('page-url');
    const clipBtn = document.getElementById('clip-btn');
    const syncBtn = document.getElementById('sync-btn');
    const clearBtn = document.getElementById('clear-btn');
    const queueList = document.getElementById('queue-list');
    const queueCountBadge = document.getElementById('queue-count');
    const notebookUrlInput = document.getElementById('notebook-url');

    let currentTab = null;

    // Load settings from local storage
    chrome.storage.local.get(['notebookUrl', 'clipQueue'], (data) => {
        if (data.notebookUrl) {
            notebookUrlInput.value = data.notebookUrl;
        }
        updateQueueUI(data.clipQueue || []);
    });

    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        currentTab = tab;
        pageTitle.textContent = tab.title;
        pageUrl.textContent = tab.url;
    }

    // Clip button
    clipBtn.addEventListener('click', async () => {
        if (!currentTab) return;

        showStatus('Extracting...');

        // Request content from content script
        chrome.tabs.sendMessage(currentTab.id, { action: 'extractContent' }, (response) => {
            const content = (response && response.content) ? response.content : "";

            chrome.storage.local.get(['clipQueue'], (data) => {
                const queue = data.clipQueue || [];
                // Check if already in queue (optional, might want multiple snippets)
                const existingIndex = queue.findIndex(item => item.url === currentTab.url && !item.snippet);

                const newItem = {
                    title: currentTab.title,
                    url: currentTab.url,
                    snippet: content, // Now saving full content as snippet
                    timestamp: Date.now()
                };

                if (existingIndex === -1) {
                    queue.push(newItem);
                } else {
                    queue[existingIndex] = newItem; // Update if exists
                }

                chrome.storage.local.set({ clipQueue: queue }, () => {
                    updateQueueUI(queue);
                    showStatus('Saved Content!');
                });
            });
        });
    });

    // Sync button
    syncBtn.addEventListener('click', () => {
        const url = notebookUrlInput.value;
        if (!url || !url.includes('notebooklm.google.com')) {
            alert('Please set a valid NotebookLM URL first.');
            return;
        }

        chrome.storage.local.get(['clipQueue'], (data) => {
            const queue = data.clipQueue || [];
            if (queue.length === 0) {
                alert('No items to sync.');
                return;
            }

            // Format all items for clipboard
            const textToCopy = queue.map(item => {
                let text = `### ${item.title}\nURL: ${item.url}\n\n`;
                if (item.snippet) text += `${item.snippet}\n`;
                return text;
            }).join('\n---\n\n');

            navigator.clipboard.writeText(textToCopy).then(() => {
                // Save target URL
                chrome.storage.local.set({ notebookUrl: url });

                // Open NotebookLM
                chrome.tabs.create({ url: url });
            });
        });
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
        chrome.storage.local.set({ clipQueue: [] }, () => {
            updateQueueUI([]);
        });
    });

    // Update notebook URL on change
    notebookUrlInput.addEventListener('change', () => {
        chrome.storage.local.set({ notebookUrl: notebookUrlInput.value });
    });

    function updateQueueUI(queue) {
        queueCountBadge.textContent = queue.length;
        queueList.innerHTML = '';

        queue.slice().reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'queue-item';
            div.innerHTML = `
                <div class="queue-item-title">${item.title}</div>
                <div class="queue-item-url">${item.url}</div>
            `;
            queueList.appendChild(div);
        });
    }

    function showStatus(text) {
        const originalText = clipBtn.innerText;
        clipBtn.innerText = text;
        clipBtn.disabled = true;
        setTimeout(() => {
            clipBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Collect Current Page`;
            clipBtn.disabled = false;
        }, 1500);
    }
});
