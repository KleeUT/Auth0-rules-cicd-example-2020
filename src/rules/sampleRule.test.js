const sampleRule = require("./sampleRule.js");
describe(sampleRule, () => {
  it("should pass return null as error", () => {
    expect.hasAssertions();
    const context = {
      request: {
        query: {
          scope: "",
        },
      },
    };
    const user = {};
    const callback = (err) => {
      expect(err).toBeNull();
    };

    sampleRule(user, context, callback);
  });
});
