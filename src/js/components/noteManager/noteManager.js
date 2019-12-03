/* eslint-disable indent */
import storage from "../../utils/localstorage";
import select from "../../utils/dom";
import { setPageTitle, resetPageTitle } from "../../utils/pageTitle";
import hashBrowser from "../../utils/hashBrowser";
import notify from "../../notify";
import { url } from "../../utils/urlManager";

export const getCurrentNote = () => {
  const titleID = url.getPageId();
  const doc = JSON.parse(storage.get(titleID));

  const newerNote = doc
    ? Object.values(doc.revisions).reduce(
        (acc, note) => (note.dateCreated > acc.dateCreated ? note : acc),
        { dateCreated: 0 }
      )
    : {};

  return titleID
    ? {
        ...doc,
        id: titleID,
        ...(newerNote ? newerNote : {}),
        numberOfRevisions:
          doc && doc.revisions ? Object.keys(doc.revisions).length : undefined,
        title: doc.title
      }
    : null;
};

export const setNoteFromHash = () => {
  const note = getCurrentNote();
  if (note) {
    select("#revisions").html(
      `${note.numberOfRevisions} revision${
        note.numberOfRevisions > 1 ? "s" : ""
      }`
    );
    setPageTitle(note.title);
    select(".terminal").setValue(note.text);
  } else {
    select(".terminal").setValue("");
  }
};

export const resetNoteManager = () => {
  location.hash = "";
  resetPageTitle();
  select("#revisions").html("");
  select(".logo").removeClass("unsaved");
};

export const saveNote = async (what, cid) => {
  await storage.saveToDictionary(what);
  if (what.length) {
    const hash = await hashBrowser(what);
    try {
      const title = what
        .split("\n")[0]
        .trim()
        .replace("#", "")
        .trim();

      setPageTitle(title);
      const titleID = encodeURIComponent(title.replace(/[^\w\s]/gi, ""));
      const currentNote = storage.get(titleID);
      const note = JSON.parse(currentNote);
      storage.set(
        titleID,
        JSON.stringify({
          title,
          revisions: {
            ...((note && note.revisions) || {}),
            [hash]: {
              dateCreated: Date.now(),
              text: what,
              ...(cid ? { cid: cid } : {})
            }
          }
        })
      );
      url.set(titleID, {
        v: hash,
        ...(cid ? { cid: cid } : {})
      });
      notify.success("👌 Note saved!");
    } catch (e) {
      notify.error(
        `😱 Something went wrong while trying to save to local storage ${e}`
        ); // eslint-disable-line
    }
  } else {
      notify.warning("😕 Nothing to save!"); // eslint-disable-line
  }
};
