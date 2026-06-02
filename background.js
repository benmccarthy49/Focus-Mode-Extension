console.log("Service worker loaded correctly");

let rules = [];
let nextRuleId = 1;
let activeTimerTimeoutId = null;
let storageLoaded = null;

function normalizeHostname(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let hostname = null;
  try {
    hostname = new URL(trimmed).hostname;
  } catch {
    const withoutProtocol = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    hostname = withoutProtocol.split("/")[0];
  }

  if (!hostname || !hostname.match(/^[a-zA-Z0-9.-]+$/)) {
    return null;
  }

  return hostname.replace(/^www\./i, "");
}

function buildRule(id, hostname) {
  return {
    id,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `||${hostname}^`,
      resourceTypes: ["main_frame"]
    }
  };
}

function migrateRules(storedRules) {
  const seenHostnames = new Set();
  const migratedRules = [];

  (storedRules || []).forEach((storedRule) => {
    const rawValue = typeof storedRule === "string"
      ? storedRule
      : storedRule && (storedRule.hostname || storedRule.url);
    const hostname = normalizeHostname(rawValue);

    if (!hostname || seenHostnames.has(hostname)) {
      return;
    }

    seenHostnames.add(hostname);
    migratedRules.push({
      id: migratedRules.length + 1,
      hostname
    });
  });

  return migratedRules;
}

function urlMatchesBlockedRule(url) {
  const hostname = normalizeHostname(url);
  if (!hostname) return false;

  return rules.some((rule) => (
    hostname === rule.hostname || hostname.endsWith(`.${rule.hostname}`)
  ));
}

function redirectBlockedTabs() {
  return chrome.tabs.query({}).then((tabs) => {
    const blockedPageUrl = chrome.runtime.getURL("blocked.html");
    const tabsToRedirect = tabs.filter((tab) => tab.id && urlMatchesBlockedRule(tab.url));

    return Promise.all(tabsToRedirect.map((tab) => chrome.tabs.update(tab.id, {
      url: blockedPageUrl
    })));
  });
}

function isTimerRunning() {
  return chrome.storage.local.get("timer").then(({ timer }) => getTimeLeft(timer) > 0);
}

function redirectTabIfBlocked(tabId, url) {
  if (!tabId || !urlMatchesBlockedRule(url)) {
    return Promise.resolve();
  }

  return isTimerRunning().then((running) => {
    if (!running) {
      return null;
    }

    return chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL("blocked.html")
    });
  });
}

function activateRules() {
  const dynamicRules = rules.map((rule) => buildRule(rule.id, rule.hostname));
  if (dynamicRules.length === 0) {
    console.log("No rules to activate.");
    return Promise.resolve();
  }
  return chrome.declarativeNetRequest.getDynamicRules().then((existingRules) => {
    const idsToRemove = existingRules.map((rule) => rule.id);
    return chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: idsToRemove,
      addRules: dynamicRules
    });
  }).then(() => chrome.declarativeNetRequest.getDynamicRules()).then((activeRules) => {
    console.log("Focus session started: rules activated", activeRules);
  }).catch((err) => {
    console.error("Failed to activate rules:", err);
    throw err;
  });
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
  storageLoaded = chrome.storage.local.get(["rules", "timer"]).then((result) => {
    rules = migrateRules(result.rules);
    const ids = rules.map((rule) => rule.id);
    nextRuleId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    chrome.storage.local.set({ rules });

    const timer = result.timer;
    const timeLeft = getTimeLeft(timer);
    if (timer && timer.isRunning && timeLeft > 0) {
      activateRules().then(redirectBlockedTabs);
      scheduleTimerEnd(timeLeft);
    } else if (timer && timer.isRunning) {
      deactivateRules();
      chrome.storage.local.set({ timer: { isRunning: false } });
    }
  }).catch((err) => {
    console.error("Failed to load stored rules:", err);
  });
}

loadStoredRules();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab.url;

  storageLoaded.then(() => redirectTabIfBlocked(tabId, url)).catch((err) => {
    console.error("Failed to redirect blocked tab:", err);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  storageLoaded.then(() => {
    if (message.method === "add" && message.url) {
      const hostname = normalizeHostname(message.url);
      if (!hostname) {
        sendResponse({ ok: false, error: "Invalid website" });
        return;
      }
      if (rules.some((rule) => rule.hostname === hostname)) {
        sendResponse({ ok: true, rules });
        return;
      }
      const newRule = { id: nextRuleId, hostname };
      rules.push(newRule);
      nextRuleId += 1;
      chrome.storage.local.set({ rules }).then(() => chrome.storage.local.get("timer")).then(({ timer }) => {
        if (timer && timer.isRunning) {
          return activateRules().then(redirectBlockedTabs);
        }
        return null;
      }).then(() => sendResponse({ ok: true, rules }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
    } else if (message.method === "remove" && message.url) {
      const hostname = normalizeHostname(message.url);
      if (!hostname) {
        sendResponse({ ok: false, error: "Invalid website" });
        return;
      }
      const ruleToRemove = rules.find((r) => r.hostname === hostname);
      if (!ruleToRemove) {
        console.warn("No matching rule found for URL:", hostname);
        sendResponse({ ok: true, rules });
        return;
      }
      rules = rules.filter((r) => r.id !== ruleToRemove.id);
      chrome.storage.local.set({ rules }).then(() => chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleToRemove.id]
      })).then(() => sendResponse({ ok: true, rules }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
    } else if (message.method === "getRules") {
      sendResponse({ rules });
    } else if (message.method === "startTimer") {
      const duration = Number(message.duration) || 0;
      if (duration <= 0) {
        sendResponse({ ok: false, error: "Choose a timer length first" });
        return;
      }
      const startTime = Date.now();
      activateRules().then(redirectBlockedTabs).then(() => chrome.storage.local.set({
        timer: { isRunning: true, startTime, duration }
      })).then(() => {
        scheduleTimerEnd(duration);
        sendResponse({ ok: true });
      }).catch((err) => sendResponse({ ok: false, error: err.message }));
    } else if (message.method === "getTimeLeft") {
      chrome.storage.local.get("timer", ({ timer }) => {
        const timeLeft = getTimeLeft(timer);
        if (timeLeft === 0 && timer && timer.isRunning) {
          deactivateRules();
          chrome.storage.local.set({ timer: { isRunning: false } });
        }
        sendResponse({ timeLeft });
      });
    }
  }).catch((err) => sendResponse({ ok: false, error: err.message }));
  return true;
});



