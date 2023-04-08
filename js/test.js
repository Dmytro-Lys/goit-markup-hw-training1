console.log(("b" + "a" + + "a" + "a").toLowerCase());
const b = 1;
(function (x) {
  const a = x;
  delete a;
  console.log(a);
})(b);