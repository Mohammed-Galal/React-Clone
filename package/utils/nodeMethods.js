import { isArray, isNodeEnv } from "./constants.js";

export default (function () {
  if (isNodeEnv) {
  } else {
    const Events = {
      connect: new Event("connect"),
      disconnect: new Event("disconnect", { cancelable: true }),
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
