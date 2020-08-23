(() => {
  function rule(user, context, callback) {
    // TODO: implement your rule  
    console.log("IMPORT");
    console.log("Context -> ", context);
    console.log(context.request.query.scope);
    return callback(null, user, context);
  }
  if (module) {
    module.exports = rule;
  } else {
    return rule;
  }
})() // prettier-ignore
