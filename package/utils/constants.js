const attrsSplitExp = /(?<=^\S+)\=/,
  openScriptsExp = "{";

export const parseAttrs = function (arr) {
    if (arr === null) return emptyObj;
    const props = {};
    arr.forEach(function (attr) {
      const [prop, val] = attr.split(attrsSplitExp),
        sliced = val.slice(1, -1);
      props[prop] = val[0] === openScriptsExp ? Number(sliced) : sliced;
    });
    return props;
  },
  emptyObj = {},
  emptyStr = "",
  Txt = Text,
  Pro = Promise,
  map = Map,
  defineObjProps = Object.defineProperties,
  arrayFrom = Array.from,
  objKeys = Object.keys,
  isNum = Number.isInteger,
  isArray = Array.isArray,
  isNodeEnv = (function () {
    try {
      if (window) return false;
    } catch {
      return true;
    }
  })();
