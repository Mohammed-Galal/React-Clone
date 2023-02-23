import $ from "../utils/nodeMethods.js";
import Clues from "./Clues.js";
import typeCheck from "../utils/typeChecker.js";
import createConnection from "../hooks.js";
import {
  Pro,
  Txt,
  arrayFrom,
  objKeys,
  isNum,
  emptyObj,
  defineObjProps,
  isArray,
} from "../utils/constants.js";

const { addListener, check, useClues } = new Clues(JSON.stringify({ id: 1 }));

export default resolveComponent;
function resolveComponent(component, props, scripts) {
  const typeOfComponent = component.constructor.name;

  if (typeOfComponent === "Array") return component;
  else if (typeOfComponent === "Object") return new Context(component).dom;

  let updateLocked = false,
    currentEl = null;

  const cached = new Map(),
    refreshComponent = function (newCtx) {
      if (updateLocked) return currentEl.self;
      const key = newCtx.key;
      cached.has(key)
        ? cached.get(key).updateScripts(newCtx.scripts)
        : cached.set(key, new Context(newCtx));
      const newDOM = cached.get(key).dom;
      currentEl ? currentEl.replaceWith(newDOM) : (currentEl = $(newDOM));
      return newDOM;
    },
    runConnection = createConnection(component, props, refreshComponent);

  if (props) {
    const cluesRef = props.clues;
    if (cluesRef !== undefined) {
      const clues = isNum(cluesRef) ? scripts[cluesRef].value : cluesRef,
        placeHolder = new Txt(),
        container = (props.clues = {});

      useClues(clues, container, runConnection);

      addListener(function () {
        const isMatched = check(clues),
          result = isMatched ? runConnection() : placeHolder;
        currentEl.replaceWith(result);
        updateLocked != isMatched;
      });

      updateLocked != check(clues);
      if (updateLocked) {
        currentEl = $(placeHolder);
        return placeHolder;
      }
    }

    const keys = objKeys(props),
      getters = {};
    keys.forEach(function (prop) {
      const val = props[prop];
      if (isNum(val) === false) return;
      delete props[prop];
      getters[prop] = {
        enumerable: true,
        get() {
          return scripts[val].value;
        },
      };

      typeof scripts[val] === "function" ||
        scripts[val].deps.push(runConnection);
    });

    defineObjProps(props, getters);
  }

  return runConnection();
}

const proto = Context.prototype;
function Context(ctx) {
  this.cachedRoots = new Map();
  this.scripts = ctx.scripts.map(reShapeScript);
  this.components = ctx.components;
  this.dom = this.resolveDOM(ctx.dom);
}

proto.updateScripts = function (newScripts) {
  const oldScripts = this.scripts;
  if (oldScripts === newScripts) return;
  newScripts.forEach(function (item, ind) {
    const oldScript = oldScripts[ind];
    if (item === oldScript.value) return;
    oldScript.value = item;
    oldScript.deps.forEach((fn) => fn());
  });
};

proto.resolveDOM = function resolveDOM(dom) {
  const self = this;
  if (typeCheck(dom, "String | Number")) return self.resolveNode(dom);
  else if (dom[0] === "fragment") return dom[2].map(resolveDOM, self);
  else return self.resolveElement(dom);
};

proto.resolveElement = function (domArr) {
  const scripts = this.scripts,
    tag = domArr[0],
    attrs = parseAttrs(domArr[1], scripts),
    children = domArr[2];

  if (isNum(tag)) {
    const components = this.components;
    if (children) attrs.Children = children.map(this.resolveDOM, this);
    return resolveComponent(components[tag], attrs, scripts);
  }

  const self = this,
    attrsKeys = objKeys(attrs),
    el = $(document.createElement(tag)),
    on = el.on,
    append = el.append,
    setAttr = el.setAttr;

  new Pro(function () {
    attrsKeys.forEach(function (attr) {
      const attrValue = attrs[attr];
      if (!isNum(attrValue)) return setAttr(attr, attrValue);

      const script = scripts[attrValue];

      if (/^on[A-Z]/.test(attr))
        return on(attr.slice(2).toLowerCase(), function () {
          script.value.apply(el, arrayFrom(arguments));
        });

      setAttr(attr, script.value);

      script.deps.push(function () {
        setAttr(attr, script.value);
      });
    });

    children && append(children.map(self.resolveDOM, self));
  });

  return el.self;
};

proto.resolveNode = function (node) {
  if (!isNum(node)) return new Txt(node);

  const self = this,
    scripts = self.scripts,
    script = scripts[node];

  const placeHolder = new Txt(),
    currentNode = $(getCurrentNode(script.value));
  script.deps.push(update);

  return currentNode.self;

  function update() {
    currentNode.replaceWith(getCurrentNode(script.value));
  }

  function getCurrentNode(val) {
    if (typeCheck(val, "Object | Array")) return self.resolveChildren(val);
    placeHolder.textContent = val || "";
    return placeHolder;
  }
};

proto.resolveChildren = function resolveChildren(value) {
  if (isArray(value)) return value.map(resolveChildren, this);
  else if (value.cacheAs === undefined) return new Context(value).dom;
  const roots = this.cachedRoots,
    key = value.cacheAs;
  roots.has(key)
    ? roots.get(key).updateScripts(value.scripts)
    : roots.set(key, new Context(value));
  return roots.get(key).dom;
};

const attrsSplitExp = /(?<=\S+)\=/,
  openScriptsExp = "{";
function parseAttrs(arr) {
  if (arr === null) return emptyObj;
  const props = {};

  arr.forEach(function (attr) {
    const [prop, val] = attr.split(attrsSplitExp),
      sliced = val.slice(1, -1);
    props[prop] = val[0] === openScriptsExp ? Number(sliced) : sliced;
  });

  return props;
}

function reShapeScript(val) {
  return { value: val, deps: [] };
}
