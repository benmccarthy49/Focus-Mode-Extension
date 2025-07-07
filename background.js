console.log("Service worker loaded correctly");

let rules = [];
let nextRuleId = 1;

function activateRules() {
  chrome.storage.local.get(["rules"], (result) => {
    const storedRules = result.rules || [];
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: storedRules,
      removeRuleIds: [] // Just add
    }).then(() => {
      console.log("Focus session started: rules activated");
    }).catch((err) => console.error("Failed to activate rules:", err));
  });
}

function deactivateRules() {
  chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
    const idsToRemove = rules.map(r => r.id);
    return chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: idsToRemove
    });
  }).then(() => {
    console.log("Focus session ended: rules deactivated");
    console.log("Rules deactivated", rules);
  }).catch((err) => console.error("Failed to deactivate rules:", err));
}

// Load rules from storage on startup
chrome.storage.local.get(["rules"], (result) => {
  console.log("Result =", result);
  rules = result.rules || [];
  console.log(rules);
  const existingIds = rules.map(rule => rule.id);
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  nextRuleId = maxId + 1;

  // Sync with declarativeNetRequest
  chrome.declarativeNetRequest.getDynamicRules().then((existingRules) => {
    const existingRuleIds = existingRules.map(r => r.id);
    const missingRules = rules.filter(r => !existingRuleIds.includes(r.id));
    if (missingRules.length > 0) {
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: missingRules
      }).then(() => {
        console.log("Synced missing rules to DNR.");
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === "add" && message.url) {
    const newRule = {
      id: nextRuleId,
      action: { type: "block" },
      condition: {
        urlFilter: message.url,
        resourceTypes: ["main_frame"]
      }
    };

    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [newRule]
    }).then(() => {
      console.log("Rule added with ID", nextRuleId);
      rules.push(newRule);
      nextRuleId++;
      chrome.storage.local.set({ rules }); // Save updated rules
      console.log("Rule added array =", rules);
    }).catch(err => console.error("Failed to add rule:", err));
  }

  else if (message.method === "remove" && message.url) {
    const ruleToRemove = rules.find(r => r.condition?.urlFilter === message.url);
    if (ruleToRemove) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleToRemove.id]
      }).then(() => {
        console.log("Rule removed:", message.url);
        rules = rules.filter(r => r.id !== ruleToRemove.id);
        chrome.storage.local.set({ rules }); // Save updated rules
        console.log(rules);
      }).catch(err => console.error("Failed to remove rule:", err));
    } else {
      console.log(rules);
      console.warn("No matching rule found for URL:", message.url);
    }
  }

  else if (message.method === "getRules") {
    chrome.storage.local.get("rules", (result) => {
      const storedRules = result.rules || [];
      sendResponse({ rules: storedRules });
    });
    return true;
  }

  else if (message.method === "clear"){
    chrome.declarativeNetRequest.getDynamicRules()
     .then((rules) => {
      const ruleIds = rules.map(rule => rule.id);
      return chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
    })
      .then(() => {
        console.log("All dynamic rules cleared.");
        console.log(rules);
      })
      .catch((err) => {
        console.error("Failed to clear dynamic rules:", err);
      });
    }

    else if (message.method === "startTimer") {
      activateRules();
      console.log("msg recieved");
      const duration = message.duration 
      console.log(duration);
      const startTime = Date.now();
    
      chrome.storage.local.set({
        timer: {
          isRunning: true,
          startTime,
          duration
        }
      });
    
      // Optional: stop blocking when timer ends
      setTimeout(() => {
        deactivateRules();
        chrome.storage.local.set({ timer: { isRunning: false } });
        console.log("Rules deactivated and timer not running");
      }, duration * 1000);
    }
    
    else if (message.method === "getTimeLeft") {
      chrome.storage.local.get("timer", ({ timer }) => {
        if (!timer || !timer.isRunning) {
          sendResponse({ timeLeft: 0 });
          deactivateRules();
          return;
        }
    
        const now = Date.now();
        const endTime = timer.startTime + timer.duration * 1000;
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        console.log("time left =", timeLeft);

        sendResponse({ timeLeft });
      });
    
      return true; // keep message channel open for async `sendResponse`
    }
});



