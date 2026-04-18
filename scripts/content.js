// Check if we are on NotebookLM
if (window.location.hostname === 'notebooklm.google.com') {
    initNotebookLMHelper();
}

// Add message listener for content extraction
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        const content = extractMainContent();
        sendResponse({ content: content });
    }
    return true;
});

function extractMainContent() {
    // Attempt to extract meaningful content
    const article = document.querySelector('article');
    const main = document.querySelector('main');
    let target = article || main || document.body;

    // Simple text cleanup: remove script, style, and nav elements from the clone
    const clone = target.cloneNode(true);
    const toRemove = clone.querySelectorAll('script, style, nav, footer, header, iframe, noscript');
    toRemove.forEach(el => el.remove());

    // Get text and clean up whitespace
    let text = clone.innerText || clone.textContent;
    text = text.replace(/\s+/g, ' ').trim();

    // Limit length to avoid storage issues (sync storage has limits)
    // sync storage is 100KB total, let's use 8000 chars roughly per item or consider local storage
    return text.substring(0, 10000);
}

function initNotebookLMHelper() {
    console.log('NotebookLM Smart Clipper: Helper initialized.');

    // Create a floating helper UI
    const container = document.createElement('div');
    container.id = 'nb-clipper-helper';
    container.innerHTML = `
        <div class="nb-helper-badge">
            <span id="nb-item-count">0</span> items collected
            <button id="nb-import-all">Import All as Text</button>
        </div>
    `;
    document.body.appendChild(container);

    const countSpan = document.getElementById('nb-item-count');
    const importBtn = document.getElementById('nb-import-all');

    // Update count from storage
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.clipQueue) {
            updateCount(changes.clipQueue.newValue);
        }
    });

    chrome.storage.local.get(['clipQueue'], (data) => {
        updateCount(data.clipQueue || []);
    });

    function updateCount(queue) {
        countSpan.textContent = queue.length;
        container.style.display = queue.length > 0 ? 'block' : 'none';
    }

    importBtn.addEventListener('click', () => {
        chrome.storage.local.get(['clipQueue'], (data) => {
            const queue = data.clipQueue || [];
            if (queue.length === 0) return;

            const content = queue.map(item => {
                let text = `### ${item.title}\nURL: ${item.url}\n\n`;
                if (item.snippet) text += `${item.snippet}\n`;
                return text;
            }).join('\n---\n\n');

            // Copy to clipboard
            navigator.clipboard.writeText(content).then(() => {
                alert('All items formatted and copied to clipboard!\n\nUse "Add source" -> "Text" and paste.');
            });
        });
    });
}
