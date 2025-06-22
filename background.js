document.getElementById('toggleButton').addEventListener('click', function() {
    chrome.action.isEnabled({tabId: tab.id}, function(enabled) {
        if (enabled) {
            chrome.action.disable();
        } else{
            chrome.action.enable();
        }
    });
});