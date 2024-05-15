"use strict";
const {
    click,
    waitFor,
    focus,
    toRightOf,
    textBox,
    text,
    into,
    write,
    $,
    dropDown,
    fileField,
    attach,
    scrollTo,
    reload,
    highlight,
    link
} = require('taiko');
const taikoHelper = require("../util/taikoHelper")
const fileExtension = require("../util/fileExtension")
const path = require('path');
var assert = require("assert");

step("Click Vitals", async function () {
    await waitFor(async () => (await text('Vital').exists()))
    await highlight("Vitals")
    await click("Vitals", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout, force: true })
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Enter History and examination details <filePath>", async function (filePath) {
    var historyAndExaminationFile = `./bahmni-e2e-common-flows/data/${filePath}.json`

    var historyAndExaminationDetails = JSON.parse(fileExtension.parseContent(historyAndExaminationFile))
    gauge.dataStore.scenarioStore.put("historyAndExaminationDetails", historyAndExaminationDetails)
    for (var chiefComplaint of historyAndExaminationDetails.Chief_Complaints) {
        await scrollTo("Chief Complaint")
        await write(chiefComplaint.Chief_Complaint, into(textBox(toRightOf("Chief Complaint"))));
        await scrollTo("Chief Complaint");
        await waitFor(async () => (await link(chiefComplaint.Chief_Complaint).exists()));
        await click(link(chiefComplaint.Chief_Complaint));
        await write(chiefComplaint.for, into(textBox(toRightOf("for"))));
        await dropDown(toRightOf("for")).select(chiefComplaint.for_frequency);
    }
    await write(historyAndExaminationDetails.Chief_complaint_notes, into(textBox("Chief Complaint Notes")));
    await write(historyAndExaminationDetails.History_Notes, into(textBox("History Notes")));
    await write(historyAndExaminationDetails.Examination_notes, into(textBox("Examination Notes")));
    await click(historyAndExaminationDetails.Smoking_History, toRightOf("Smoking History"));
    await attach(path.join('./bahmni-e2e-common-flows/data/consultation/observations/patientReport.jpg'), fileField({ id: "file-browse-observation_9" }));
});

step("Click patient name", async function () {
    var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
    await scrollTo(`${firstName}`)
    await click(`${firstName}`)
});

step("Should not find the patient's name", async function () {
    var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
    assert.ok(!await text(`${firstName}`).exists())
});

