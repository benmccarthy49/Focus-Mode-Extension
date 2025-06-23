console.log("Service worker loaded correctly");
const rule =
{
  "id": 1,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "bbc.co.uk",
    "resourceTypes": ["main_frame"]
  }
};


chrome.runtime.onMessage.addListener((message) => {
  if (message.method === "add") {
    chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule] })
      .then(() => console.log("Rule added"))
      .catch((err) => console.error("Failed to add rule:", err));
  } else if (message.method === "remove") {
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1] })
      .then(() => console.log("Rule removed"))
      .catch((err) => console.error("Failed to remove rule:", err));
  }
});