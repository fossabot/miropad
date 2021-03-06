/* eslint-disable indent */
import storage from "../../../utils/localstorage";
import select from "../../../utils/dom";
import { setPageTitle, resetPageTitle } from "../../../utils/pageTitle";
import hashBrowser from "../../../utils/hashBrowser";
import notify from "../../molecules/notify";
import { url } from "../../../utils/urlManager";
import isJSON from "../../../utils/isJSON";
import ipfs, { retrieveFromIPFS } from "../../../utils/ipfs";

export const getDateCreatedFromTitle = (title) => {
  const titleID = getTitleId(title);
  const note = getNote(titleID);
  const { dateCreated } = note;
  return dateCreated;
};

export const markNoteForDeletion = (id) => {
  const note = getNote(id);
  localStorage.setItem(
    id,
    JSON.stringify({
      title: note.title,
      deleted: true,
      revisions: note.revisions,
    })
  );
};

export const getNote = (titleID = url.getPageId(), revision) => {
  let doc;
  try {
    doc = JSON.parse(storage.get(titleID));
    if (!doc.revisions) {
      throw new Error("This is not a note!");
    }
  } catch (error) {
    return null;
  }

  const newerNote = doc
    ? Object.values(doc.revisions).reduce(
        (acc, note) => (note.dateCreated > acc.dateCreated ? note : acc),
        { dateCreated: 0 }
      )
    : {};

  const noteToReturn = revision ? doc.revisions[revision] : newerNote;

  return titleID
    ? {
        ...doc,
        id: titleID,
        ...(noteToReturn ? noteToReturn : {}),
        numberOfRevisions:
          doc && doc.revisions ? Object.keys(doc.revisions).length : undefined,
        title: doc.title,
      }
    : null;
};

export const setNoteFromHash = async (hash = url.getPageId()) => {
  if (hash) {
    if (ipfs.isValidCid(hash)) {
      retrieveFromIPFS(hash);
    } else {
      const version = url.getSearchParam("v");
      const note = getNote(undefined, version);
      const cid = url.getSearchParam("cid");
      if (note) {
        select("#revisions").html(
          `${note.numberOfRevisions} revision${
            note.numberOfRevisions > 1 ? "s" : ""
          }`
        );
        setPageTitle(note.title);
        select(".terminal").setValue(note.text);
      } else {
        if (cid && ipfs.isValidCid(cid)) {
          retrieveFromIPFS(cid);
        } else {
          notify.error("404 Note not found 🤷‍♂️");
        }
      }
    }
  }
};

export const resetNoteManager = () => {
  location.hash = "";
  resetPageTitle();
  select("#revisions").html("");
  select(".terminal").setValue("");
  select(".logo").removeClass("unsaved");
};

export const getTitle = (note) => {
  const title = note.split("\n")[0].trim().replace("#", "").trim();
  return title;
};

export const getTitleId = (note) => {
  const title = getTitle(note);
  return encodeURIComponent(title.replace(/[^\w\s]/gi, ""));
};

export const updateNote = async (what) => {
  if (what.length) {
    const titleID = getTitleId(what);
    const title = getTitle(what);
    const existingNote = getNote(titleID);
    if (existingNote === null) {
      // new existingNote
      return saveNote(what);
    }
    const { text } = existingNote;
    const hashOfIncomingNote = await hashBrowser(what);
    const hashOfCurrentNote = await hashBrowser(text);

    if (hashOfIncomingNote === hashOfCurrentNote) {
      return;
    }

    const currentNote = storage.get(titleID);
    const note = JSON.parse(currentNote);

    storage.set(
      titleID,
      JSON.stringify({
        title,
        revisions: {
          ...((note && note.revisions) || {}),
          [hashOfIncomingNote]: {
            dateCreated: Date.now(),
            text: what,
          },
        },
      })
    );
  }
};

export const saveNote = async (what, cid) => {
  await storage.saveToDictionary(what);
  if (what.length) {
    const hash = await hashBrowser(what);
    try {
      const title = what.split("\n")[0].trim().replace("#", "").trim();

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
              ...(cid ? { cid: cid } : {}),
            },
          },
        })
      );
      url.set(titleID, {
        v: hash,
        ...(cid ? { cid: cid } : {}),
      });
      storage.set("lastLocalUpdate", new Date());
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

export const getNotes = () =>
  Object.entries(localStorage).reduce((acc, current) => {
    const noteId = current[0];
    const noteBody = isJSON(current[1]) ? JSON.parse(current[1]) : {};
    const hasTitle = Object.prototype.hasOwnProperty.call(noteBody, "title");
    return [
      ...acc,
      ...(hasTitle
        ? [
            {
              id: noteId,
              text: getNote(noteId).text,
              ...noteBody,
            },
          ]
        : []),
    ];
  }, []);

export const search = (q) => {
  if (!q) {
    return undefined;
  }

  const results = getNotes()
    .map(({ id }) => getNote(id))
    .filter(({ text }) => text.toLowerCase().includes(q.toLowerCase()));

  return results[0];
};
