const {
    click,
    button,
    text,
    press,
    write,
    waitFor,
    below,
    into,
    above,
    highlight,
    checkBox,
    toLeftOf,
    fileField,
    timeField,
    attach,
    image,
    $,
    within,
    textBox,
    dropDown,
} = require('taiko');
var assert = require("assert");
var fileExtension = require("../util/fileExtension");
var date = require("../util/date");
var users = require("../util/users")
const taikoHelper = require("../util/taikoHelper");
const { link } = require('fs');
const path = require('path');

step("start patient search", async function () {
    await click(button({ "aria-label": "Search Patient" }))
});

step("enter the patient name in lablite", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    await write(patientIdentifierValue, { "placeholder": "Search for a patient by name or identifier number" });
    await click(button("Search"))
});

step("Select the patient in lablite search result", async function () {
    var patientFirstName = gauge.dataStore.scenarioStore.get("patientFirstName");
    var patientMiddleName = gauge.dataStore.scenarioStore.get("patientMiddleName");
    var patientLastName = gauge.dataStore.scenarioStore.get("patientLastName");
    assert.ok(await text("Found 1 patient").exists())
    await click(`${patientFirstName} ${patientMiddleName} ${patientLastName}`)
});

step("Verify test prescribed is displayed on Pending Lab Orders table", async function () {
    var prescriptionCount = gauge.dataStore.scenarioStore.get("prescriptionsCount")
    for (var i = 0; i < prescriptionCount; i++) {
        var prescriptionFile = gauge.dataStore.scenarioStore.get("prescriptions" + i)
        var testPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
        await highlight(text(testPrescriptions.test, below("Pending Lab Orders"), below("Test"), above("Upload Report")))
    assert.ok(await text(testPrescriptions.test, below("Pending Lab Orders"), below("Test"), above("Upload Report")).exists())
    }
});

step("Open <panelName> side panel", async function (panelName) {
     await click(panelName);
});

step("Select prescribed <testName> in Pending Lab Orders table", async function (prescriptionsFile) {
    var prescriptionFile = `./bahmni-e2e-common-flows/data/${prescriptionsFile}.json`;
    var testPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
    gauge.dataStore.scenarioStore.put("LabTestFile", testPrescriptions)
    await checkBox(below("Pending Lab Orders"), above("Upload Report"), toLeftOf(testPrescriptions.test)).check();
});

step("Select Lab Report in side panel", async function () {
    var labReportFile = "labReport1.jpg";
    gauge.dataStore.scenarioStore.put("labReportFile", labReportFile)
    await attach(path.join('./bahmni-e2e-common-flows/data/reports/' + labReportFile), fileField(above(text("Report Date"))), { waitForEvents: ['DOMContentLoaded'] });
});

step("Select today's date in Report Date Field", async function () {
    await click($('#reportDate'))
    await click($("//SPAN[contains(@class,'today')]"))
});

step("Select Doctor in side panel", async function () {
    var doctor = users.getUserNameFromEncoding(process.env.doctor);
    await dropDown(below("Requested by")).select(doctor);
});

step("Upload and verify the reports table", async function () {
    var labTest = gauge.dataStore.scenarioStore.get("LabTest")
    var labReportFile = gauge.dataStore.scenarioStore.get("labReportFile")
    await click(button("Save and Upload"));
    await taikoHelper.repeatUntilNotFound($("//H3[text()='Report successfully uploaded']"));
    await highlight(text(labTest, below("Reports Table"), below("Test"), toLeftOf(labReportFile)))
    assert.ok(await text(labTest, below("Reports Table"), below("Test"), toLeftOf(labReportFile)).exists());
});

step("Verify the uploaded report", async function () {
    var labReportFile = gauge.dataStore.scenarioStore.get("labReportFile")
    await click(labReportFile);
    await highlight($("//DIV[contains(@class,'is-visible')]//IMG/../../..//h3[text()='" + labReportFile + "']"))
    await highlight($("//DIV[contains(@class,'is-visible')]//IMG"))
    assert.ok(await $("//DIV[contains(@class,'is-visible')]//IMG/../../..//h3[text()='" + labReportFile + "']").exists());
    await click(button({ "aria-label": "close" }));
});


step("Click Home button on lab-lite", async function() {
	await click(button({ "aria-label": "Home" }));
});

step("Verify order is removed from Pending lab orders table", async function() {
	var labTest = gauge.dataStore.scenarioStore.get("LabTest")
    assert.ok(!await text(labTest,above("Upload Report")).exists(500,1000));
});

step("Enter test result in side panel", async function() {
	let LabTestFile=gauge.dataStore.scenarioStore.get("LabTestFile")
    for (const detail of LabTestFile.Result) {
        const labelValue = detail.label;
        await click($("//span[normalize-space()='Select an answer']"));
        await click(detail.value);
    }
});

step("Upload and verify the report is uploaded successfully", async function() {
	await click(button("Save and Upload"));
    assert.ok(await text("Report successfully uploaded").exists());
});