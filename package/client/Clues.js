import { isArray } from "../utils/constants.js";

export default function Clues(json) {
  const listeners = [],
    data = JSON.parse(json),
    stores = {
      // storeName: {
      //   subscribers: [],
      //   _set(newVal) {
      //     data[storeName] = newVal;
      //   },
      // },
    };

  let activeClues = Object.keys(data);

  this.changeRoute = function (str) {};

  this.addListener = function (fn) {
    listeners.push(fn);
  };

  this.check = function check(keywords) {
    return isArray(keywords)
      ? keywords.map(check).every(Boolean)
      : activeClues.indexOf(keywords) > -1;
  };

  this.useClues = function (clues, container, updateFN) {
    initStore(clues);
    isArray(clues) ? clues.forEach(use) : use(clues);
    function use(clue) {
      stores[clue].subscribers.push(updateFN);
      Object.defineProperty(container, clue, {
        get() {
          return [data[clue], stores[clue]._set];
        },
      });
    }
  };

  function initStore(clue) {
    if (isArray(clue)) return clue.forEach(initStore);
    else if (stores[clue] !== undefined) return;
    Object.freeze(data[clue]);
    stores[clue] = {
      subscribers: [],
      _set(newVal) {
        data[clue] = newVal;
        stores[clue].subscribers.forEach((fn) => fn());
      },
    };
  }
}
