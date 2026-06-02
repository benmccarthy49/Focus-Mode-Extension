console.log("Service worker loaded correctly");

let rules = [];
let nextRuleId = 1;
let activeTimerTimeoutId = null;

function normalizeHostname(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).hostname;
  } catch {
    const withoutProtocol = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    const hostname = withoutProtocol.split("/")[0];
    return hostname.match(/^[a-zA-Z0-9.-]+$/) ? hostname : null;
  }
}

function buildRule(id, hostname) {
  return {
    id,
    action: { type: "block" },
    condition: {
      urlFilter: `||${hostname}^`,
      resourceTypes: ["main_frame"]
    }
  };
}

function activateRules() {
  const dynamicRules = rules.map((rule) => buildRule(rule.id, rule.hostname));
  if (dynamicRules.length === 0) {
    console.log("No rules to activate.");
    return Promise.resolve();
  }
  return chrome.declarativeNetRequest.updateDynamicRules({
    addRules: dynamicRules,
    removeRuleIds: []
  }).then(() => {
    console.log("Focus session started: rules activated");
  }).catch((err) => console.error("Failed to activate rules:", err));
}

function deactivateRules() {
  return chrome.declarativeNetRequest.getDynamicRules().then((existingRules) => {
    const idsToRemove = existingRules.map((r) => r.id);
    if (idsToRemove.length === 0) {
      console.log("No active rules to deactivate.");
      return;
    }
    return chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: idsToRemove });
  }).then(() => {
    console.log("Focus session ended: rules deactivated");
  }).catch((err) => console.error("Failed to deactivate rules:", err));
}

function getTimeLeft(timer) {
  if (!timer || !timer.isRunning) return 0;
  const now = Date.now();
  const endTime = timer.startTime + timer.duration * 1000;
  return Math.max(0, Math.floor((endTime - now) / 1000));
}

function scheduleTimerEnd(durationSeconds) {
  if (activeTimerTimeoutId) {
    clearTimeout(activeTimerTimeoutId);
  }
  activeTimerTimeoutId = setTimeout(() => {
    deactivateRules();
    chrome.storage.local.set({ timer: { isRunning: false } });
    console.log("Rules deactivated and timer not running");
  }, durationSeconds * 1000);
}

function loadStoredRules() {
  chrome.storage.local.get(["rules", "timer"], (result) => {
    rules = result.rules || [];
    const ids = rules.map((rule) => rule.id);
    nextRuleId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

    const timer = result.timer;
    const timeLeft = getTimeLeft(timer);
    if (timer && timer.isRunning && timeLeft > 0) {
      activateRules();
      scheduleTimerEnd(timeLeft);
    } else if (timer && timer.isRunning) {
      deactivateRules();
      chrome.storage.local.set({ timer: { isRunning: false } });
    }
  });
}

loadStoredRules();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === "add" && message.url) {
    const hostname = normalizeHostname(message.url);
    if (!hostname) {
      return;
    }
    if (rules.some((rule) => rule.hostname === hostname)) {
      return;
    }
    const newRule = { id: nextRuleId, hostname };
    rules.push(newRule);
    nextRuleId += 1;
    chrome.storage.local.set({ rules });

    chrome.storage.local.get("timer", ({ timer }) => {
      if (timer && timer.isRunning) {
        chrome.declarativeNetRequest.updateDynamicRules({ addRules: [buildRule(newRule.id, hostname)] })
          .then(() => console.log("Rule added during active session:", hostname))
          .catch((err) => console.error("Failed to add rule during active session:", err));
      }
    });
  } else if (message.method === "remove" && message.url) {
    const hostname = normalizeHostname(message.url);
    if (!hostname) {
      return;
    }
    const ruleToRemove = rules.find((r) => r.hostname === hostname);
    if (!ruleToRemove) {
      console.warn("No matching rule found for URL:", hostname);
      return;
    }
    rules = rules.filter((r) => r.id !== ruleToRemove.id);
    chrome.storage.local.set({ rules });

    chrome.storage.local.get("timer", ({ timer }) => {
      if (timer && timer.isRunning) {
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [ruleToRemove.id] })
          .then(() => console.log("Rule removed during active session:", hostname))
          .catch((err) => console.error("Failed to remove rule during active session:", err));
      }
    });
  } else if (message.method === "getRules") {
    sendResponse({ rules });
    return true;
  } else if (message.method === "startTimer") {
    activateRules();
    const duration = Number(message.duration) || 0;
    const startTime = Date.now();
    chrome.storage.local.set({ timer: { isRunning: true, startTime, duration } });
    scheduleTimerEnd(duration);
  } else if (message.method === "getTimeLeft") {
    chrome.storage.local.get("timer", ({ timer }) => {
      const timeLeft = getTimeLeft(timer);
      if (timeLeft === 0 && timer && timer.isRunning) {
        deactivateRules();
        chrome.storage.local.set({ timer: { isRunning: false } });
      }
      sendResponse({ timeLeft });
    });
    return true;
  }
});



