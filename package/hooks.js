import { isNodeEnv } from "./utils/constants.js";

let currentComponentIndex = null,
  patchEnabled = false,
  isUpdating = false;

const hooksNames = new Set(),
  registeredHooks = {},
  updaters = [];

const pendingEffects = {
    pre: [],
    post: [],
  },
  runPendingEffects = function (target) {
    const effects = pendingEffects[target];
    isNodeEnv || effects.forEach((fn) => fn());
    effects.length = 0;
  };

export const initHook = function (hookName, handler) {
    hooksNames.add(hookName);
    registeredHooks[hookName] = {
      repos: [],
      counter: 0,
    };
    return handler;
  },
  useHook = function (hookName) {
    if (currentComponentIndex === null)
      throw "cannot call " + hookName + " hook outside of component";

    const componentIndex = currentComponentIndex,
      currentHook = registeredHooks[hookName],
      currentRepo = currentHook.repos[componentIndex], // Array
      currentNodeIndex = currentHook.counter++;

    if (isUpdating && currentNodeIndex > currentRepo.length)
      throw "hooks cannot get called inside of (if/loop) blocks";

    return {
      isBusy: isUpdating,
      setVal(val) {
        if (!isUpdating) currentRepo[currentNodeIndex] = val;
        return currentRepo[currentNodeIndex];
      },
      addEffect(timing, fn) {
        pendingEffects[timing].push(fn);
      },
      updateHost() {
        isUpdating = true;
        updaters[componentIndex]();
        isUpdating = false;
      },
    };
  };

export default function (fn, props, callback) {
  const componentIndex = updaters.push(update) - 1;
  hooksNames.forEach(function createHookRepo(hookName) {
    registeredHooks[hookName].repos[componentIndex] = [];
  });

  return update;
  function update() {
    if (patchEnabled) return patchUpdateQueue.add(componentIndex);
    const prevIndex = currentComponentIndex;
    currentComponentIndex = componentIndex;
    const ctx = fn(props);
    currentComponentIndex = prevIndex;
    runPendingEffects("pre");
    const result = callback(ctx);
    runPendingEffects("post");
    resetHooks();
    return result;
  }
}

function resetHooks() {
  hooksNames.forEach(function (hook) {
    registeredHooks[hook].counter = 0;
  });
}

/**
 *
 */

const updateComponentNo = function (num) {
    updaters[num]();
  },
  patchUpdateQueue = new Set(),
  updateQueue = function () {
    isUpdating = true;
    patchUpdateQueue.forEach(updateComponentNo);
    isUpdating = false;
    patchUpdateQueue.clear();
  };
export const usePatch = function (fn) {
  return function () {
    patchEnabled = true;
    fn();
    patchEnabled = false;
    updateQueue();
  };
};
