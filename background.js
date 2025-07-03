console.log("Service worker loaded correctly");

const rules = [];
let nextRuleId = 1;

chrome.declarativeNetRequest.getDynamicRules()
  .then((existingRules) => {
    const existingIds = existingRules.map(rule => rule.id);
    let maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    nextRuleId = maxId + 1;
    console.log(rules);

    chrome.runtime.onMessage.addListener((message) => {
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
        })
        .then(() => {
          console.log("Rule added with ID", nextRuleId);
          rules.push(newRule);
          nextRuleId++;
        })
        .catch((err) => console.error("Failed to add rule:", err));
      } 
      else if (message.method === "remove" && message.url) {
        const ruleToRemove = rules.find(r => {
          return r.condition?.urlFilter === message.url;
        });
        console.log("Rules array =", rules);
        console.log("Message url =", message.url);
        console.log("Rule to remove:", ruleToRemove);
        if (ruleToRemove){
          chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [ruleToRemove.id] })
          .then(() => console.log("Rule removed:", message.url))
          .catch((err) => console.error("Failed to remove rule:", err));
          const index = rules.indexOf(ruleToRemove);
          if (index > -1){
          rules.splice(index, 1);
          }
          console.log(rules);
        } else{
          console.warn("No matching rule found for URL:", message.url);
        }
      }
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === "getRules") {
    chrome.declarativeNetRequest.getDynamicRules()
      .then((dynamicRules) => {
        sendResponse({ rules: dynamicRules });
      })
      .catch((err) => {
        console.error("Error getting rules:", err);
        sendResponse({ rules: [] });
      });
    return true;
  }
});



