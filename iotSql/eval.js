const evalInContext = (expr, context) => {
  let [func, fields] = expr.match(/(\w+)\((.*)\)/).slice(1, 3);
  fields = fields
    ? fields.split(",").map((f) => f.trim().replace(/['"]+/g, ""))
    : [];

  try {
    return context[func](...fields);
  } catch (err) {
    debugger;
    console.log(`failed to evaluate: ${expr}`);
    throw err;
  }
};
module.exports = evalInContext;
