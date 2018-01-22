import classes from "../css/styles.css";
import prettifyJSON from "./utils/prettifyJSON";
import { saveToLocalStorage, getSavedState } from "./utils/localstorage";

const listeners = e => {
  const evtobj = window.event ? event : e;
  // Control + p
  if (evtobj.keyCode == 80 && evtobj.ctrlKey) {
    e.preventDefault();
    prettifyJSON(".terminal");
  }
  // Control + s
  if (evtobj.keyCode == 83 && evtobj.ctrlKey) {
    e.preventDefault();
    const text = document.querySelector(".terminal").value;
    saveToLocalStorage(text);
  }
};

const main = () => {
  document.onkeydown = listeners;
  const savedTxt = getSavedState();
  document.querySelector(".terminal").value = savedTxt;
};

export default main;
