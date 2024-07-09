const { click, button, waitFor, text } = require("taiko");

step("Click <name> button", async function(name) {
	await click(button(name))
	await waitFor(500);
});

step("Wait for <strText> text to exists", async function(strText) {
	await waitFor(async () => (await text(strText).exists()))
});