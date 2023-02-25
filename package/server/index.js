import SEOTags from "./seoHTMLTags.js";
import Clues from "./Clues.js";
import $ from "../utils/nodeMethods.js";
import createConnection from "../hooks.js";
import {
  objKeys,
  isNum,
  parseAttrs,
  isArray,
  emptyStr,
} from "../utils/constants.js";

export default resolveComponent;

const { useClues, check } = new Clues();

const scriptNodeExp = /String|Number/,
  Context = function (ctx) {
    this.scripts = ctx.scripts;
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
    return new Context(value).dom;
  }
};

function resolveComponent(component, props, scripts) {
  if (isArray(component)) return component;

  const refreshComponent = (newCtx) => new Context(newCtx).dom,
    runConnection = createConnection(component, props, refreshComponent);

  if (props) {
    const keys = objKeys(props),
      cluesRef = props.clues;
    if (cluesRef !== undefined) {
      const clues = isNum(cluesRef) ? scripts[cluesRef] : cluesRef,
        placeHolder = emptyStr,
        container = (props.clues = {});
      useClues(clues, container, runConnection);
      updateEnabled = check(clues);
      if (!updateEnabled) return placeHolder;
    }

    keys.forEach(function (prop) {
      const val = props[prop];
      if (isNum(val)) props[prop] = scripts[val];
    });
  }

  return runConnection();
}

function resolveElement(dom, scripts, resolveDOM) {
  const [tag, attrs, children] = dom;

  if (SEOTags[tag] !== true)
    return children ? children.map(resolveDOM) : emptyStr;

  const el = $(tag, dom.length),
    setAttr = el.setAttr,
    append = el.append;

  if (tag === "a" && attrs["$:href"] !== undefined) {
    const ref = attrs["$:href"];
    attrs.href = ref;
    delete attrs["$:href"];
  }

  const attrsKeys = objKeys(attrs);
  attrsKeys.forEach(function (attr) {
    const attrValue = attrs[attr];
    if (!isNum(attrValue)) return setAttr(attr, attrValue);
    else if (/^on[A-Z]/.test(attr)) return;
    setAttr(attr, scripts[attrValue]);
  });

  children && append(children.map(resolveDOM));

  return el.self;
}

function resolveNode(node, scripts, resolveChildren) {
  if (!isNum(node)) return node;
  const val = scripts[node];
  if (typeCheck(val, "Object | Array")) return resolveChildren(val);
  else return val;
}
