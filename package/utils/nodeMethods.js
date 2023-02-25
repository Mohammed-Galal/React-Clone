import { isArray, isNodeEnv } from "./constants.js";

export default (function () {
  if (isNodeEnv) {
    return function (el, domLen) {
      const attrs = [],
        children = [],
        obj = {
          setAttr(attr, val) {
            attrs.push(attr + "=" + val);
          },
          append(child) {
            isArray(child) ? child.map(obj.append) : children.push(child);
          },
          get self() {
            return (
              "<" +
              el +
              " " +
              attrs.join(emptyStr) +
              (domLen > 2 ? ">" + children.join(emptyStr) + "</" + tag : "/") +
              ">"
            );
          },
        };

      return obj;
    };
  } else {
    const Events = {
      connect: new Event("connect"),
      disconnect: new Event("disconnect"),
    };

    return function $(el) {
      const obj = {
        get self() {
          return el;
        },

        on(evType, evHandler) {
          el.addEventListener(evType, evHandler);
        },

        setAttr(attrName, attrValue) {
          el[attrName] = attrValue;
        },

        append(node) {
          if (isArray(node)) return node.forEach(obj.append);
          el.appendChild(node);
          node.dispatchEvent(Events.connect);
        },

        replaceWith(nodes) {
          const targetNode = isArray(el) ? getLastNode(el) : el,
            parent = targetNode.parentNode,
            nextNode = targetNode.nextSibling;

          if (isArray(el) || el !== nodes) {
            removeNode(parent, el);
            nextNode === null
              ? $(parent).append(nodes)
              : before(parent, nextNode, nodes);
            el = nodes;
          }

          return obj;
        },
      };

      return obj;
    };

    function removeNode(parent, nodes) {
      if (parent === null) return;
      (function pre(node) {
        if (isArray(node)) return node.forEach(pre);
        node.dispatchEvent(Events.disconnect);
        parent.removeChild(node);
      })(nodes);
    }

    function before(parent, targetNode, nodes) {
      if (parent === null) return;
      (function pre(node) {
        if (isArray(node)) return node.forEach(pre);
        parent.insertBefore(node, targetNode);
        node.dispatchEvent(Events.connect);
      })(nodes);
    }
  }
})();

function getLastNode(nodeList) {
  const result = nodeList[nodeList.length - 1];
  return isArray(result) ? getLastNode(result) : result;
}
