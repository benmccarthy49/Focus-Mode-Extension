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
    console.log("Form loaded");
    // text.classList.toggle("hide");
    // text.classList.toggle("show");
    if (text.style.display === "none") {
    text.style.display = "block";
    } else {
      text.style.display = "none";
    }
  }
});