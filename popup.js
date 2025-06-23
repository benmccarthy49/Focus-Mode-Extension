document.getElementById("add").onclick = () => {
  chrome.runtime.sendMessage({ method: "add" });
}

document.getElementById("remove").onclick = () => {
  chrome.runtime.sendMessage({ method: "remove" });
}