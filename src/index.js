import {
  useEffect,
  useLayoutEffect,
  usePatch,
  useState,
} from "../package/index.js";

const temp = Array(4)
  .fill()
  .map((i, ind) => ({
    cacheAs: ind,
    scripts: ["/" + ind],
    components: [],
    dom: ["a", ["$:href={0}"], ["some temp Link", 0]],
  }));

export default () => ({
  key: 0,
  scripts: [temp],
  components: [],
  dom: ["fragment", ["id={0}", "className={1}"], [0]],
});

function Test({ someAttr }) {
  const [x, setX] = useState(1);

  function resetState() {
    setX(x + 1);
  }

  useEffect(function () {
    console.log("EFFECT");
  }, []);

  return x > 7
    ? {
        key: 1,
        components: [],
        scripts: [x % 2 === 0 ? temp : "", resetState],
        dom: [
          "span",
          ["key='12'", "onClick={1}"],
          ["this1212r12r is test Child", 0],
        ],
      }
    : {
        key: 2,
        components: [],
        scripts: [x % 2 === 0 ? temp : "", resetState],
        dom: [
          "del",
          ["key='12'", "onClick={1}"],
          ["this1212r12r is test Child", 0],
        ],
      };
}

function child({ clues, Children }) {
  const [id, setId] = clues.id;

  console.log(id);

  return {
    key: 1,
    scripts: [() => setId(id + 1)],
    components: [Children],
    dom: ["div", ["onClick={0}"], [[0, [], []]]],
  };
}

function N({ clues }) {
  const [id, setId] = clues.id;

  return {
    key: 2,
    scripts: [id],
    components: [],
    dom: ["h1", [], ["H!", 0]],
  };
}
