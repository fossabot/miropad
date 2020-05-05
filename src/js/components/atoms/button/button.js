import { isArray } from '../../../utils/isArray';

export const button = (els, fn) => {
  const elements = isArray(els) ? els : [els]
  const button = document.createElement("button");
  elements.forEach(element => {
    button.appendChild(element);
  });
  button.onclick = (e) => fn(e);

  return button;
};
