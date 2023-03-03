import $ from "../utils/nodeMethods.js";
import Clues from "./Clues.js";
import createConnection from "../hooks.js";
import {
  Pro,
  Txt,
  arrayFrom,
  objKeys,
  isNum,
  parseAttrs,
  defineObjProps,
  isArray,
} from "../utils/constants.js";

export default resolveComponent;

const emptyFN = new Function(),
  { changeRoute, addListener, check, useClues } = new Clues(
    JSON.stringify({ id: 1 })
  );

const Context = function (ctx) {
    this.cachedRoots = new Map();
    this.scripts = ctx.scripts;
    this.updateFunctions = [];
    this.components = ctx.components;
    this.updateQueue = new Set();
    this.dom = resolveDOM.apply(this, [ctx.dom]);
  },
  proto = Context.prototype;

proto.updateScripts = function (newScripts) {
  const self = this,
    oldScripts = this.scripts;
  newScripts.forEach(function (item, ind) {
    if (item === oldScripts[ind]) return;
    oldScripts[ind] = item;
    self.updateQueue.add(ind);
  });
  self.updateQueue.forEach((ind) => self.updateFunctions[ind]());
};

proto.resolveChildren = function resolveChildren(value) {
  if (value.cacheAs === undefined) return new Context(value).dom;
  const roots = this.cachedRoots,
    key = value.cacheAs;
  roots.has(key)
    ? roots.get(key).updateScripts(value.scripts)
    : roots.set(key, new Context(value));
  return roots.get(key).dom;
};

const scriptNodeExp = /String|Number/;
function resolveDOM(dom) {
  const typeOfDom = dom.constructor.name,
    self = this,
    scripts = self.scripts;

  if (scriptNodeExp.test(typeOfDom)) {
    if (typeOfDom === "String") return new Txt(dom);
    const placeHolder = new Txt(),
      currentNode = $(getCurrentNode(scripts[dom]));
    self.updateFunctions.push(function () {
      currentNode.replaceWith(getCurrentNode(scripts[dom]));
    });
    return currentNode.self;
    function getCurrentNode(val) {
      const valType = val.constructor.name;
      if (valType === "Array") return val.map((ctx) => new Context(ctx).dom);
      else if (valType === "Object") return new Context(val).dom;
      placeHolder.textContent = val || "";
      return placeHolder;
    }
  }

  const tag = dom[0],
    attrs = (dom[1] = parseAttrs(dom[1])),
    children = dom[2];

  if (tag === "fragment") return children.map(resolveDOM, self);
  else if (isNum(tag)) {
    const components = self.components;
    if (children) attrs.Children = children.map(resolveDOM);
    return resolveComponent(
      components[tag],
      attrs,
      scripts,
      self.updateFunctions
    );
  } else {
    const el = $(document.createElement(tag)),
      on = el.on,
      append = el.append,
      setAttr = el.setAttr;

    new Pro(function () {
      if (tag === "a" && attrs["$:href"] !== undefined) {
        const ref = attrs["$:href"],
          isDynaimc = isNum(ref);
        attrs.href = ref;
        delete attrs["$:href"];

        on("click", function (e) {
          e.preventDefault();
          changeRoute(isDynaimc ? scripts[ref] : ref);
        });
      }

      const attrsKeys = objKeys(attrs);
      attrsKeys.forEach(function (attr) {
        const attrValue = attrs[attr];
        if (!isNum(attrValue)) return setAttr(attr, attrValue);
        else if (/^on[A-Z]/.test(attr)) {
          on(attr.slice(2).toLowerCase(), function () {
            scripts[attrValue].apply(el, arrayFrom(arguments));
          });
          self.updateFunctions.push(emptyFN);
        } else {
          setAttr(attr, scripts[attrValue]);
          self.updateFunctions.push(function () {
            setAttr(attr, scripts[attrValue]);
          });
        }
      });

      children && append(children.map(resolveDOM, self));
    });

    return el.self;
  }
}

function resolveComponent(component, props, scripts, updateFunctions) {
  if (isArray(component)) return component;

  let updateEnabled = true,
    currentEl = null;

  const cached = new Map(),
    refreshComponent = function (newCtx) {
      if (updateEnabled === false) return currentEl.self;
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
      const clues = isNum(cluesRef) ? scripts[cluesRef] : cluesRef,
        placeHolder = new Txt(),
        container = (props.clues = {});

      useClues(clues, container, runConnection);

      addListener(function () {
        const isMatched = check(clues),
          result = isMatched ? runConnection() : placeHolder;
        currentEl.replaceWith(result);
        updateEnabled = isMatched;
      });

      updateEnabled = check(clues);
      if (!updateEnabled) {
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
          return scripts[val];
        },
      };

      updateFunctions.push(
        typeof scripts[val] === "function" ? runConnection : emptyFN
      );
    });

    defineObjProps(props, getters);
  }

  return runConnection();
}
