chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "clipSelection",
        title: "Clip selection to NotebookLM",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "clipSelection") {
        const text = info.selectionText;
        const pageUrl = tab.url;
        const pageTitle = tab.title;

        chrome.storage.local.get(['clipQueue'], (data) => {
            const queue = data.clipQueue || [];
            queue.push({
                title: `Highlight from ${pageTitle}`,
                url: pageUrl,
                snippet: text,
                timestamp: Date.now()
            });
            chrome.storage.local.set({ clipQueue: queue }, () => {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '../icons/icon128.png',
                    title: 'Clipped!',
                    message: 'Selection added to Notebook queue.'
                });
            });
        });
    }
});
