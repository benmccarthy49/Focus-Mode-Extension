console.log("Service worker loaded correctly");

const rules = [];

chrome.runtime.onMessage.addListener((message) => {
  if (message.method === "add" && message.url) {

    const newRule = {
      "id" : rules.length + 1,
      "action": {
        "type": "block"
      },
      "condition": {
      "urlFilter": message.url,
      "resourceTypes": ["main_frame"]
      }
    };

    rules.push(newRule);

    chrome.declarativeNetRequest.updateDynamicRules({ 
      removeRuleIds: rules.map(r => r.id)
    })
    .then(() => {
      return chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules
      });
    })
      .then(() => console.log("Rule added"))
      .catch((err) => console.error("Failed to add rule:", err));
  } 
  else if (message.method === "remove") {
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1, 2] })
      .then(() => console.log("Rule removed"))
      .catch((err) => console.error("Failed to remove rule:", err));
  }
});


