export const emptyObj = {},
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
