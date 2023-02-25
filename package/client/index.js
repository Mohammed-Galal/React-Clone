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

export default resolveComponent;

const { changeRoute, addListener, check, useClues } = new Clues(
  JSON.stringify({ id: 1 })
);

const scriptNodeExp = /String|Number/,
  Context = function (ctx) {
    this.cachedRoots = new Map();
    this.scripts = ctx.scripts.map(reShapeScript);
    this.components = ctx.components;
    this.dom = this.resolveDOM(ctx.dom);
  },
  proto = Context.prototype;

proto.resolveDOM = function (dom) {
  const typeOfDom = dom.constructor.name,
    self = this,
    scripts = self.scripts;

  if (scriptNodeExp.test(typeOfDom))
    return resolveNode(dom, scripts, resolveChildren);

  const tag = dom[0],
    attrs = (dom[1] = parseAttrs(dom[1])),
    children = dom[2];

  if (tag === "fragment") return children.map(resolveDOM);
  else if (isNum(tag)) {
    const components = self.components;
    if (children) attrs.Children = children.map(resolveDOM);
    return resolveComponent(components[tag], attrs, scripts);
  } else return resolveElement(dom, scripts, resolveDOM);

  function resolveDOM(c) {
    return self.resolveDOM(c);
  }

  function resolveChildren(value) {
    if (isArray(value)) return value.map(resolveChildren);
    return self.resolveChildren(value);
  }
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

function resolveComponent(component, props, scripts) {
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
      const clues = isNum(cluesRef) ? scripts[cluesRef].value : cluesRef,
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

function resolveElement([tag, attrs, children], scripts, resolveDOM) {
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
        changeRoute(isDynaimc ? scripts[ref].value : ref);
      });
    }

    const attrsKeys = objKeys(attrs);

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

    children && append(children.map(resolveDOM));
  });

  return el.self;
}

function resolveNode(node, scripts, resolveChildren) {
  if (!isNum(node)) return new Txt(node);

  const script = scripts[node];

  const placeHolder = new Txt(),
    currentNode = $(getCurrentNode(script.value));
  script.deps.push(update);

  return currentNode.self;

  function update() {
    currentNode.replaceWith(getCurrentNode(script.value));
  }

  function getCurrentNode(val) {
    if (typeCheck(val, "Object | Array")) return resolveChildren(val);
    placeHolder.textContent = val || "";
    return placeHolder;
  }
}

const attrsSplitExp = /(?<=^\S+)\=/,
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
