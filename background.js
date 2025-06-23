console.log("Service worker loaded correctly");
const rule1 =
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

const rule2 = 
{
  "id": 2,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "skysports.com",
    "resourceTypes": ["main_frame"]
  }
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.method === "add") {
    chrome.declarativeNetRequest.updateDynamicRules({ 
      removeRuleIds: [1, 2]
    })
    .then(() => {
      return chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [rule1, rule2]
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

