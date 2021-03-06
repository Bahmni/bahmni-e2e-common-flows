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
    $
} = require('taiko');
var assert = require("assert");
var fileExtension = require("../util/fileExtension");
var date = require("../util/date");
var users = require("../util/users")
const taikoHelper = require("../util/taikoHelper");
const { link } = require('fs');
const path = require('path');

step("start patient search", async function () {
    await click(button({ "aria-label": "closes notification" }));
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

step("Validate the lab tests <labTests> are available", async function (labTests) {
    var prescriptionFile = `../data/${labTests}.json`;
    var testDetail = JSON.parse(fileExtension.parseContent(prescriptionFile))

    assert.ok(await text(testDetail.test).exists())
});

step("Verify test prescribed is displayed on Pending Lab Orders table", async function () {
    var labTest = gauge.dataStore.scenarioStore.get("LabTest")
    await highlight(text(labTest, below("Pending Lab Orders"), below("Test"), above("Upload Report")))
    assert.ok(await text(labTest, below("Pending Lab Orders"), below("Test"), above("Upload Report")).exists())
});

step("Open upload report side panel", async function () {
    await click("Upload Report");
});

step("Select prescribed test in Pending Lab Orders table", async function () {
    var labTest = gauge.dataStore.scenarioStore.get("LabTest")
    await checkBox(below("Pending Lab Orders"), above("Upload Report"), toLeftOf(labTest)).check();
});

step("Select Lab Report in side panel", async function () {
    await attach(path.join(__dirname, '../../data/labReport1.jpg'), fileField(above(text("Report Date"))), { waitForEvents: ['DOMContentLoaded'] });
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
    await click(button("Save and Upload"));
    await taikoHelper.repeatUntilNotFound($("//H3[text()='Report successfully uploaded']"));
    await highlight(text(labTest, below("Reports Table"), below("Test"), toLeftOf("labReport1.jpg")))
    assert.ok(await text(labTest, below("Reports Table"), below("Test"), toLeftOf("labReport1.jpg")).exists());
});

step("Verify the uploaded report", async function () {
    await click("labReport1.jpg");
    await highlight($("//DIV[contains(@class,'is-visible')]//IMG/../..//h3[text()='labReport1.jpg']"))
    await highlight($("//DIV[contains(@class,'is-visible')]//IMG"))
    assert.ok(await $("//DIV[contains(@class,'is-visible')]//IMG/../..//h3[text()='labReport1.jpg']").exists());
    await click(button({ "aria-label": "close" }));
});