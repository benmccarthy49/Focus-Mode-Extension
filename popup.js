var now = new Date().getTime();
let startingTime = 0;
let time = startingTime * 60;
let countdownInterval = null;


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("add").onclick = () => {
    chrome.runtime.sendMessage({ method: "add" });
    addPopup()
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

  document.getElementById("remove").onclick = () => {
    chrome.runtime.sendMessage({ method: "remove" });
    removePopup();
  };

  function removePopup(){
    var websiteToRemove = document.getElementById("removePopup");
    if(websiteToRemove.style.display === "none"){
      websiteToRemove.style.display = "block";
    } else {
      websiteToRemove.style.display = "none";
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
  
  document.getElementById("timeLeft").innerHTML = now;

  const timeEntered = document.getElementById("selectTime")

  timeEntered.addEventListener("keydown", function(event){
    if (event.key === "Enter") {
      event.preventDefault();

      const time = timeEntered.value;
      document.getElementById("timeLeft").innerHTML = time;
      console.log("Selected time:",time);
    }
  });

  function updateCountdown(){
    const minutes = Math.floor(time / 60);
    let seconds = time % 60;

    document.getElementById("timeLeft").innerHTML = `${minutes}: ${seconds}` 
    if (time > 0){
      time--;
    } else{
      clearInterval(countdownInterval);
    }

    if(time == 0){
      document.getElementById("addSection").style.display = "flex";
      document.getElementById("removeSection").style.display = "flex";
      document.getElementById("timerSection").style.display = "flex";
      document.getElementById("timeLeftSection").style.display = "none";
    }
  }

  // This function adds the functionality to each of the different time buttons
  function addTimeButton(buttonName, amountOfTime){
    document.getElementById(buttonName).addEventListener("click", function(event){
    event.preventDefault(); 
    startingTime = amountOfTime;
    time = startingTime * 60;
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

    var addSection = document.getElementById("addSection");
    addSection.style.display = "none";

    var removeSection = document.getElementById("removeSection");
    removeSection.style.display = "none";

    var timerSection = document.getElementById("timerSection");
    timerSection.style.display = "none";

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    var text = document.getElementById("popup")
    text.style.display = "none";

    countdownInterval = setInterval(updateCountdown, 1000);

    document.getElementById("startTimer").style.display = "none";
  });
});