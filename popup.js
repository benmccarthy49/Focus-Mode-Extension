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
  }

  
  document.getElementById("1min").addEventListener("click", function(event){
    event.preventDefault(); 
    startingTime = 1;
    time = startingTime * 60;
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
    var timeLeftSection = document.getElementById("timeLeftSection")
    timeLeftSection.style.display = "block";
  });
  
  
  document.getElementById("2mins").addEventListener("click", function(event){
    event.preventDefault();
    startingTime = 2;
    time = startingTime * 60;
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
    var timeLeftSection = document.getElementById("timeLeftSection")
    timeLeftSection.style.display = "block";
  });
  
  document.getElementById("5mins").addEventListener("click", function(event){
    event.preventDefault();
    startingTime = 5;
    time = startingTime * 60;
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
    var timeLeftSection = document.getElementById("timeLeftSection")
    timeLeftSection.style.display = "block";
  });
  
  document.getElementById("10mins").addEventListener("click", function(event){
    event.preventDefault();
    startingTime = 10;
    time = startingTime * 60;
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
    var timeLeftSection = document.getElementById("timeLeftSection")
    timeLeftSection.style.display = "block";
  });
  
  document.getElementById("20mins").addEventListener("click", function(event){
    event.preventDefault();
    startingTime = 20;
    time = startingTime * 60;
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
    var timeLeftSection = document.getElementById("timeLeftSection")
    timeLeftSection.style.display = "block";
  });
  
  document.getElementById("30mins").addEventListener("click", function(event){
    event.preventDefault();
    startingTime = 30;
    time = startingTime * 60;
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
    var timeLeftSection = document.getElementById("timeLeftSection")
    timeLeftSection.style.display = "block";
  });
  
  document.getElementById("45mins").addEventListener("click", function(event){
    event.preventDefault();
    startingTime = 45;
    time = startingTime * 60;
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
    var timeLeftSection = document.getElementById("timeLeftSection")
    timeLeftSection.style.display = "block";
  });
  
  document.getElementById("60mins").addEventListener("click", function(event){
    event.preventDefault();
    startingTime = 60;
    time = startingTime * 60;
    document.getElementById("timeLeft").innerHTML = `${startingTime}: ${0}`;
    var timeLeftSection = document.getElementById("timeLeftSection")
    timeLeftSection.style.display = "block";
  });
  
  document.getElementById("startTimer").addEventListener("click", function(event){
    event.preventDefault();

    var addSection = document.getElementById("addSection");
    addSection.style.display = 'none';

    var removeSection = document.getElementById("removeSection");
    removeSection.style.display = 'none';

    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(updateCountdown, 1000);
  });
});