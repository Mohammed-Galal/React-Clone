import $ from "./utils/nodeMethods.js";
import resolveComponent from "./client/index.js";
import rootContainer from "../src/index.js";
("use strict");

export { initHook, useHook, usePatch } from "./hooks.js";
export * from "./defaultHooks.js";

const body = document.body,
  append = $(body).append;
body.innerHTML = "";
new Promise((res) => res(resolveComponent(rootContainer))).then(append);
