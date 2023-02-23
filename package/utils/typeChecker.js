import { objKeys } from "./constants.js";

export default function typeCheck(val, type) {
  const targetedType = type.constructor.name;
  if (val === null) throw "the value is not defined";
  let defaulVal = true;
  if (targetedType === "Object") {
    objKeys(type).forEach(function (prop) {
      if (defaulVal) defaulVal = typeCheck(val[prop], type[prop]);
    });
  } else if (targetedType === "Array") {
    val.forEach(function (item, ind) {
      if (defaulVal) defaulVal = typeCheck(item, type[ind]);
    });
  } else if (targetedType === "String")
    defaulVal = new RegExp(type.replace(/\s+/g, ""), "i").test(
      val.constructor.name
    );
  return defaulVal;
}

// console.log(typeCheck([["nud"]], ["Array", ["Number"]]));
// console.log(
//   typeCheck(
//     {
//       id: { inner: 21 },
//     },
//     {
//       id: {
//         inner: "Number",
//       },
//     }
//   )
// );
