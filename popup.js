let startingTime = 0;
let time = startingTime * 60;
let countdownInterval = null;


document.addEventListener("DOMContentLoaded", () => {

  chrome.runtime.sendMessage({ method: "getTimeLeft" }, (response) => {
    console.log("response.timeLeft =", response.timeLeft);
    if (response.timeLeft > 0) {
      startCountdownFrom(response.timeLeft);
    } else {
      updateCountdownUI(0);
      document.getElementById("addSection").style.display = "flex";
      document.getElementById("removeSection").style.display = "flex";
      document.getElementById("timerSection").style.display = "flex";
      document.getElementById("timeLeftSection").style.display = "none";
    }
  });

  function updateCountdownUI(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    document.getElementById("timeLeft").innerHTML = `${minutes}: ${seconds}`;

    if(time == 0){
      document.getElementById("addSection").style.display = "flex";
      document.getElementById("removeSection").style.display = "flex";
      document.getElementById("timerSection").style.display = "flex";
      document.getElementById("timeLeftSection").style.display = "none";
    }
  }

  function startCountdownFrom(timeLeft) {
    let time = timeLeft;

    updateCountdownUI(time);

    countdownInterval = setInterval(() => {
      time--;
      updateCountdownUI(time);

      if (time <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  document.getElementById("add").onclick = () => {
    addPopup()
  };

  document.getElementById("remove").onclick = () => {
    chrome.runtime.sendMessage({ method: "getRules" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting rules:", chrome.runtime.lastError);
      } else {
        console.log("Rules received from background:", response.rules);
        addToDatalist(response.rules);
      }
    });
    removePopup();
  };

  // This function makes the popup for where users can enter what websites they want to block appear
  function addPopup(){
    var websiteToBlock = document.getElementById("addPopup");
    if(websiteToBlock.style.display === "none"){
      websiteToBlock.style.display = "block";
    } else {
      websiteToBlock.style.display = "none";
    }
  }
  
  function removePopup(){
    if(document.getElementById("removePopup").style.display === "none"){
      document.getElementById("removePopup").style.display = "block";
    } else {
      document.getElementById("removePopup").style.display = "none";
    }
  }
  
  document.getElementById("timer").onclick = () => {
    var text = document.getElementById("popup");
    if (text.style.display === "none") {
      text.style.display = "block";
    } else {
      text.style.display = "none";
    }
  };
  
  const urlEntered = document.getElementById("addPopup");
  urlEntered.addEventListener("keydown", function(event){
    if (event.key === "Enter"){
      event.preventDefault();
      
      if(isValidURL(urlEntered.value)){
        urlEntered.style.outline = "3px solid #2ecc71";
        setTimeout(() => {
          urlEntered.style.outline = "";
        }, 1000);
      } else{
        urlEntered.style.outline = "3px solid red";
        setTimeout(() => {
          urlEntered.style.outline = "";
        }, 1000);
      }
      let parsedURL = parseValidURL(urlEntered.value);
      chrome.runtime.sendMessage({ method: "add", url: parsedURL });
      urlEntered.value = ""; // Clearing the input from the input field
    }
  });
  
  document.getElementById("removePopup").addEventListener("keydown", function(event){
    if (event.key === "Enter"){
      event.preventDefault();
      if(isValidURL(document.getElementById("removePopup").value)){
        document.getElementById("removePopup").style.outline = "3px solid #2ecc71";
        setTimeout(() => {
          document.getElementById("removePopup").style.outline = "";
        }, 1000);
      } else{
        document.getElementById("removePopup").style.outline = "3px solid red";
        setTimeout(() => {
          document.getElementById("removePopup").style.outline = "";
        }, 1000);
      }
      let urlToUnblock = document.getElementById("removePopup").value;
      chrome.runtime.sendMessage({ method: "remove", url: urlToUnblock});
      document.getElementById("removePopup").value = ""; // Clearing the input from the input field
    }
  });

  function isValidURL(urlString){
    return URL.canParse(urlString);
  }

  function parseValidURL(urlString){
    if (isValidURL(urlString)){
      const parsedUrl = new URL(urlString);
      console.log(parsedUrl.hostname); 
      return parsedUrl
    }
}
// This function adds all the blocked urls to the drop down menu for choosing a url to remove from the blocked list
  function addToDatalist(rules){
    const datalist = document.getElementById("blockedURLs");
    datalist.innerHTML = "";

    rules.forEach(rule => {
      const url = rule.condition?.urlFilter;
      if(url){
        const option = document.createElement("option");
        option.value = url;
        datalist.appendChild(option);
      }
    });
  }

  // This function adds the functionality to each of the different time buttons
  function addTimeButton(buttonName, amountOfTime){
    document.getElementById(buttonName).addEventListener("click", function(event){
    event.preventDefault(); 
    startingTime = amountOfTime;
    time = startingTime * 60;
    console.log("time =", time);
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
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

  // This function is for starting the timer
  document.getElementById("startTimer").addEventListener("click", function(event){
    event.preventDefault();
    chrome.runtime.sendMessage({method: "startTimer", duration: time});
    startCountdownFrom(time);
    console.log("start timer msg sent");

    // Making all the sections apart from the countdown disappear
    document.getElementById("addSection").style.display = "none";
    document.getElementById("removeSection").style.display = "none";
    document.getElementById("timerSection").style.display = "none";
    document.getElementById("popup").style.display = "none";
    document.getElementById("startTimer").style.display = "none";
  });

  chrome.storage.local.get("timer", ({ timer }) => {
    if (timer && timer.isRunning) {
      // Making all the sections apart from the countdown disappear
      document.getElementById("addSection").style.display = "none";
      document.getElementById("removeSection").style.display = "none";
      document.getElementById("timerSection").style.display = "none";
      document.getElementById("popup").style.display = "none";
      document.getElementById("timeLeftSection").style.display = "flex";
      document.getElementById("startTimer").style.display = "none";
    }
  });
});