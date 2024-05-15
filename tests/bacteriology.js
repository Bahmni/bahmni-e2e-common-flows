const { click, waitFor, text, timeField,toRightOf,scrollTo,$, scrollDown,within } = require("taiko");
var date = require("./util/date");
var fileExtension = require("./util/fileExtension");
var taikoHelper = require("./util/taikoHelper");

step("Choose Bacteriology", async function() {
	await click("Bacteriology")
    await waitFor(async () => (await text("consultation note").exists()))
});

step("Enter Date of Sample Collection", async function() {
    var startDate = date.yesterday();
    await timeField({type:"date"},toRightOf("Date of Sample Collection")).select(startDate);
});

step("Enter type of sample <sampleType>", async function(sampleType) {
	await click(sampleType)
});

step("Enter Bacteriology results", async function() {
    var observationFormValues = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/consultation/observations/Bacteriology.json`))

    await taikoHelper.executeConfigurations(observationFormValues.ObservationFormDetails,observationFormValues.ObservationFormName,true)
});

step("Verify bacteriology details", async function () {
    var observationFormValues = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/consultation/observations/Bacteriology.json`))
    await scrollTo($("//SPAN[contains(normalize-space(),'Blood') and @class='specimen-info']"))
    await click($("//SPAN[contains(normalize-space(),'Blood') and @class='specimen-info']"))
    await taikoHelper.verifyConfigurations(observationFormValues.ObservationFormDetails,observationFormValues.ObservationFormName)
});