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
    assert.ok(await text("Found 1 patient").exists(),"Text with Found 1 patient not found")
    await click(`${patientFirstName} ${patientMiddleName} ${patientLastName}`)
});

step("Verify test prescribed is displayed on Pending Lab Orders table", async function () {
    var labOrderCount = gauge.dataStore.scenarioStore.get("labOrderCount")
    for (var i = 0; i < labOrderCount; i++) {
        var testLabOrder = gauge.dataStore.scenarioStore.get("labOrder" + i)
        await highlight(text(testLabOrder.test, below("Pending Lab Orders"), below("Test"), above("Upload Report")))
        assert.ok(await text(testLabOrder.test, below("Pending Lab Orders"), below("Test"), above("Upload Report")).exists(), `Lab order ${testLabOrder.test} is not displayed on Pending Lab Orders table`)
    }
});

step("Open <panelName> side panel", async function (panelName) {
    await click(panelName);
});

step("Select prescribed <testName> in Pending Lab Orders table", async function (labOrderFile) {
    var labOrderFile = `./bahmni-e2e-common-flows/data/${labOrderFile}.json`;
    var testLabOrder = JSON.parse(fileExtension.parseContent(labOrderFile))
    gauge.dataStore.scenarioStore.put("LabTestFile", testLabOrder)
    await checkBox(below("Pending Lab Orders"), above("Upload Report"), toLeftOf(testLabOrder.test)).check();
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
    var labTest = gauge.dataStore.scenarioStore.get("LabTestFile")
    var labReportFile = gauge.dataStore.scenarioStore.get("labReportFile")
    await click(button("Save and Upload"));
    await taikoHelper.repeatUntilNotFound($("//H3[text()='Report successfully uploaded']"));
    await highlight(text(labTest.test, below("Reports Table"), below("Test"), toLeftOf(labReportFile)))
    assert.ok(await text(labTest.test, below("Reports Table"), below("Test"), toLeftOf(labReportFile)).exists(), `Lab order ${labTest.test} is not displayed on Reports table`);
});

step("Verify the uploaded report", async function () {
    var labReportFile = gauge.dataStore.scenarioStore.get("labReportFile")
    await click(labReportFile);
    await highlight($("//DIV[contains(@class,'is-visible')]//IMG/../../..//h3[text()='" + labReportFile + "']"))
    await highlight($("//DIV[contains(@class,'is-visible')]//IMG"))
    assert.ok(await $("//DIV[contains(@class,'is-visible')]//IMG/../../..//h3[text()='" + labReportFile + "']").exists());
    await click(button({ "aria-label": "close" }));
});


step("Click Home button on lab-lite", async function () {
    await click(button({ "aria-label": "Home" }));
});

step("Verify order is removed from Pending lab orders table", async function () {
    var labTest = gauge.dataStore.scenarioStore.get("LabTestFile")
    assert.ok(!await text(labTest.test, above("Upload Report")).exists(500, 1000), `Lab order ${labTest.test} is not removed from Pending lab orders table`);
});

step("Enter test result in side panel", async function () {
    let LabTestFile = gauge.dataStore.scenarioStore.get("LabTestFile")
    for (const detail of LabTestFile.Result) {
        const labelValue = detail.label;
        await click($("//span[normalize-space()='Select an answer']"));
        await click(detail.value);
    }
});

step("Upload and verify the report is uploaded successfully", async function () {
    await click(button("Save and Upload"));
    assert.ok(await text("Report successfully uploaded").exists(),"Text with Report successfully uploaded is not found");
});