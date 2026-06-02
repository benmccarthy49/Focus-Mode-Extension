let startingTime = 0;
let time = startingTime * 60;
let countdownInterval = null;

function normalizeInput(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let hostname = null;
  try {
    hostname = new URL(trimmed).hostname;
  } catch {
    hostname = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  }

  if (!hostname || !hostname.match(/^[a-zA-Z0-9.-]+$/)) {
    return null;
  }

  return hostname.replace(/^www\./i, "");
}

function setInputFeedback(input, valid) {
  input.style.outline = valid ? "3px solid #2ecc71" : "3px solid red";
  setTimeout(() => {
    input.style.outline = "";
  }, 1000);
}

function updateCountdownUI(timeLeft) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById("timeLeft").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  if (timeLeft === 0) {
    document.getElementById("addSection").style.display = "flex";
    document.getElementById("removeSection").style.display = "flex";
    document.getElementById("timerSection").style.display = "flex";
    document.getElementById("popup").style.display = "none";
    document.getElementById("timeLeftSection").style.display = "none";
    document.getElementById("startTimer").style.display = "none";
  }
}

function startCountdownFrom(timeLeft) {
  let currentTime = timeLeft;
  updateCountdownUI(currentTime);

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    currentTime -= 1;
    updateCountdownUI(currentTime);
    if (currentTime <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ method: "getTimeLeft" }, (response) => {
    if (response && response.timeLeft > 0) {
      startCountdownFrom(response.timeLeft);
      document.getElementById("addSection").style.display = "none";
      document.getElementById("removeSection").style.display = "none";
      document.getElementById("timerSection").style.display = "none";
      document.getElementById("popup").style.display = "none";
      document.getElementById("timeLeftSection").style.display = "flex";
      document.getElementById("startTimer").style.display = "none";
    } else {
      updateCountdownUI(0);
      document.getElementById("addSection").style.display = "flex";
      document.getElementById("removeSection").style.display = "flex";
      document.getElementById("timerSection").style.display = "flex";
      document.getElementById("timeLeftSection").style.display = "none";
    }
  });

  document.getElementById("add").onclick = addPopup;

  document.getElementById("remove").onclick = () => {
    chrome.runtime.sendMessage({ method: "getRules" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting rules:", chrome.runtime.lastError);
      } else {
        addToDatalist(response.rules || []);
      }
    });
    removePopup();
  };

  function addPopup() {
    const websiteToBlock = document.getElementById("addPopup");
    websiteToBlock.style.display = websiteToBlock.style.display === "none" ? "block" : "none";
  }

  function removePopup() {
    const removeInput = document.getElementById("removePopup");
    removeInput.style.display = removeInput.style.display === "none" ? "block" : "none";
  }

  document.getElementById("timer").onclick = () => {
    const popup = document.getElementById("popup");
    popup.style.display = popup.style.display === "none" ? "block" : "none";
  };

  const addInput = document.getElementById("addPopup");
  addInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      const hostname = normalizeInput(addInput.value);
      setInputFeedback(addInput, !!hostname);
      if (hostname) {
        chrome.runtime.sendMessage({ method: "add", url: hostname });
        addInput.value = "";
      }
    }
  });

  const removeInput = document.getElementById("removePopup");
  removeInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      const hostname = normalizeInput(removeInput.value);
      setInputFeedback(removeInput, !!hostname);
      if (hostname) {
        chrome.runtime.sendMessage({ method: "remove", url: hostname });
        removeInput.value = "";
      }
    }
  });

  function addToDatalist(rules) {
    const datalist = document.getElementById("blockedURLs");
    datalist.innerHTML = "";
    rules.forEach((rule) => {
      if (rule.hostname) {
        const option = document.createElement("option");
        option.value = rule.hostname;
        datalist.appendChild(option);
      }
    });
  }

  function addTimeButton(buttonName, amountOfTime) {
    document.getElementById(buttonName).addEventListener("click", function (event) {
      event.preventDefault();
      startingTime = amountOfTime;
      time = startingTime * 60;
      document.getElementById("timeLeft").textContent = `${startingTime}:00`;
      document.getElementById("timeLeftSection").style.display = "flex";
      document.getElementById("startTimer").style.display = "flex";
    });
  }

  addTimeButton("1min", 1);
  addTimeButton("2mins", 2);
  addTimeButton("5mins", 5);
  addTimeButton("10mins", 10);
  addTimeButton("20mins", 20);
  addTimeButton("30mins", 30);
  addTimeButton("45mins", 45);
  addTimeButton("60mins", 60);

  document.getElementById("startTimer").addEventListener("click", function (event) {
    event.preventDefault();
    chrome.runtime.sendMessage({ method: "startTimer", duration: time });
    startCountdownFrom(time);
    document.getElementById("addSection").style.display = "none";
    document.getElementById("removeSection").style.display = "none";
    document.getElementById("timerSection").style.display = "none";
    document.getElementById("popup").style.display = "none";
    document.getElementById("timeLeftSection").style.display = "flex";
    document.getElementById("startTimer").style.display = "none";
  });
});
