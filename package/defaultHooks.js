import { useHook, initHook } from "./hooks.js";
import { isArray } from "./utils/constants.js";

export const useState = initHook("useState", function (val) {
    const currentNode = useHook("useState"),
      defaultValue = currentNode.setVal(val);
    return [
      defaultValue,
      function (newVal) {
        if (newVal === defaultValue) return;
        currentNode.setVal(newVal);
        currentNode.updateHost();
      },
    ];
  }),
  useLayoutEffect = initHook("useLayoutEffect", function (fn, deps) {
    const currentHook = useHook("useEffect"),
      oldDeps = currentHook.setVal(deps),
      isUpdating = currentHook.isBusy;

    if (
      !isUpdating ||
      !isArray(deps) ||
      (deps.length > 0 && isDiffrentArr(oldDeps, deps))
    )
      currentHook.addEffect("pre", function () {
        currentHook.setVal(deps);
        fn();
      });
  }),
  useEffect = initHook("useEffect", function (fn, deps) {
    const currentHook = useHook("useEffect"),
      oldDeps = currentHook.setVal(deps),
      isUpdating = currentHook.isBusy;

    if (
      !isUpdating ||
      !isArray(deps) ||
      (deps.length > 0 && isDiffrentArr(oldDeps, deps))
    )
      currentHook.addEffect("post", function () {
        currentHook.setVal(deps);
        fn();
      });
  });

function isDiffrentArr(arr1, arr2) {
  let defaultVal = true;

  arr1.forEach(function (e, i) {
    if (defaultVal) defaultVal = e !== arr2[i];
  });

  return defaultVal;
}
