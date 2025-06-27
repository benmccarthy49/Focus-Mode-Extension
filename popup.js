var now = new Date().getTime();


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("add").onclick = () => {
    chrome.runtime.sendMessage({ method: "add" });
  };

  document.getElementById("remove").onclick = () => {
    chrome.runtime.sendMessage({ method: "remove" });
  };

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

  document.getElementById("1min").addEventListener("click", function(event){
    event.preventDefault(); 
    document.getElementById("timeLeft").innerHTML = "Time Left: 1" ;
  });

  
  document.getElementById("2mins").addEventListener("click", function(event){
    event.preventDefault();
    document.getElementById("timeLeft").innerHTML = "Time Left: 2" ;
  });
});