function setupIntegrationTests() {
    return {
        describe: Number(process.env.RUN_INTEGRATION_TESTS) === 1 ? describe : describe.skip,
        it: Number(process.env.RUN_INTEGRATION_TESTS) === 1 ? it : it.skip
    };
}

module.exports = {
    integration: setupIntegrationTests()
};
