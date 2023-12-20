/* globals gauge*/
"use strict";
const {
    $,
    click,
    button,
    toRightOf,
    text,
    toLeftOf,
    within,
    write,
    into,
    textBox,
    press,
    waitFor,
    scrollTo,
    highlight,
    link,
    below,
    evaluate,
    closeTab
} = require('taiko');
const taikoHelper = require("../util/taikoHelper")
var fileExtension = require("../util/fileExtension")
var assert = require('assert');

step("Click Start IPD Visit", async function () {
    await scrollTo("Start OPD Visit")
    await click(button(toRightOf('Start OPD Visit'), within($(".submit-btn-container"))));
    await click('Start IPD visit', { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Click Start OPD Visit", async function () {
    await scrollTo(`Start ${process.env.default_visit_type} visit`)
    await click(`Start ${process.env.default_visit_type} visit`, { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Select the newly created patient with network idle", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    await write(patientIdentifierValue, into(textBox({ "placeholder": "Search Name/Patient Identifier  ..." })))
    await click('Search', { waitForNavigation: true, waitForEvents: ['networkIdle'], navigationTimeout: process.env.mergeTimeout });
});

step("Select the newly created patient for IP", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    await write(patientIdentifierValue)
    await press("Enter", { waitForNavigation: true, navigationTimeout: process.env.mergeTimeout });
});

step("Select the newly created patient for IP Admission", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    await write(patientIdentifierValue)
    await press("Enter", { waitForNavigation: true, navigationTimeout: process.env.mergeTimeout });
});

step("Select the newly created patient for IP Discharge", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    await write(patientIdentifierValue)
    await click("Search", { waitForNavigation: true, navigationTimeout: process.env.mergeTimeout });
});

step("Search the newly created patient", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    await write(patientIdentifierValue, into(textBox({ "placeholder": "Search Name/Patient Identifier  ..." })))
    await click('Search', { waitForNavigation: true, navigationTimeout: process.env.mergeTimeout });
});

step("verify name with id", async function () {
    var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
    var lastName = gauge.dataStore.scenarioStore.get("patientLastName")
    var middleName = gauge.dataStore.scenarioStore.get("patientMiddleName")
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");

    assert.ok(await (await text(`${firstName} ${lastName} (${patientIdentifierValue})`, toLeftOf(gauge.dataStore.scenarioStore.get("patientGender")))).exists(),`Patient  ${firstName} ${lastName} (${patientIdentifierValue}) to left of ${gauge.dataStore.scenarioStore.get("patientGender")} not found`)
});

step("verify OPD", async function () {
    //    await highlight("23 Feb 22",toLeftOf("OPD"));
});

step("Verify medical prescription in patient clinical dashboard", async function () {
    await taikoHelper.repeatUntilNotFound($(".dashboard-section-loader"))
    var prescriptionCount = gauge.dataStore.scenarioStore.get("prescriptionsCount")
    for (var i = 0; i < prescriptionCount; i++) {
        var prescriptionFile = gauge.dataStore.scenarioStore.get("prescriptions" + i)
        var medicalPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
        assert.ok(await text(medicalPrescriptions.drug_name, within($("#Treatments"))).exists())
        assert.ok(await text(`${medicalPrescriptions.dose} ${medicalPrescriptions.units}, ${medicalPrescriptions.frequency}`, within($("#Treatments"))).exists(),`${medicalPrescriptions.dose} ${medicalPrescriptions.units}, ${medicalPrescriptions.frequency} not found`)
        assert.ok(await text(`${medicalPrescriptions.duration} Days`, within($("#Treatments"))).exists(),`${medicalPrescriptions.duration} Days not found`)
    }
});


step("Verify vitals", async function () {
    var vitalFormValues = gauge.dataStore.scenarioStore.get("Vitals")
    for (var vitalFormValue of vitalFormValues.ObservationFormDetails) {
        if (vitalFormValue.type == 'Group') {
            for (var vitalFormGroup of vitalFormValue.value) {
                assert.ok(await text(vitalFormGroup.value, within($("#Vitals-Flow-Sheet")), toRightOf(vitalFormGroup.short_name)).exists(),`${vitalFormGroup.value} not found to right of ${vitalFormGroup.short_name}`)
            }
        }
        else {
            assert.ok(await text(vitalFormValue.value, within($("#Vitals-Flow-Sheet")), toRightOf(vitalFormValue.short_name)).exists(),`${vitalFormValue.value} not found to right of ${vitalFormValue.short_name}`)
        }
    };
});

step("Verify diagnosis in patient clinical dashboard", async function () {
    var medicalDiagnosis = gauge.dataStore.scenarioStore.get("medicalDiagnosis")
    assert.ok(await text(medicalDiagnosis.diagnosis.diagnosisName, toLeftOf(medicalDiagnosis.diagnosis.certainty, toRightOf(medicalDiagnosis.diagnosis.order)), within($("#Diagnoses"))).exists(),`${medicalDiagnosis.diagnosis.diagnosisName} to left of ${medicalDiagnosis.diagnosis.certainty} to right of ${medicalDiagnosis.diagnosis.order} not found`)
});

step("Verify condition in patient clinical dashboard", async function () {
    var medicalDiagnosis = gauge.dataStore.scenarioStore.get("medicalDiagnosis")
    var medicalConditions = medicalDiagnosis.condition
    for (var condition of medicalConditions) {
        if (condition.status != "Inactive") {
            assert.ok(await text(condition.conditionName, below(condition.status), within($("#Conditions"))).exists(),`${condition.conditionName} below ${condition.status} not found`)
        }
    }
});

step("Verify history & examination in patient clinical dashboard", async function () {
    var historyAndExaminationDetails = gauge.dataStore.scenarioStore.get("historyAndExaminationDetails")
    //WORK AROUND - https://bahmni.atlassian.net/browse/BAH-3137
    // assert.ok(await text(`${historyAndExaminationDetails.Chief_Complaints[0].Chief_Complaint} since ${historyAndExaminationDetails.Chief_Complaints[0].Sign_symptom_duration} ${historyAndExaminationDetails.Chief_Complaints[0].Units}`, toRightOf("Chief Complaint"), within($("#History-and-Examinations"))).exists())
    assert.ok(await text(`${historyAndExaminationDetails.Chief_Complaints[0].Chief_Complaint}`, toRightOf("Chief Complaint"), within($("#History-and-Examinations"))).exists(),`${historyAndExaminationDetails.Chief_Complaints[0].Chief_Complaint} to right of Chief Complaint not found`)
    assert.ok(await text(`${historyAndExaminationDetails.Chief_Complaints[0].Sign_symptom_duration}`, toRightOf("Sign/symptom duration"), within($("#History-and-Examinations"))).exists(),`${historyAndExaminationDetails.Chief_Complaints[0].Sign_symptom_duration} to right of Sign/symptom duration not found`)
    assert.ok(await text(`${historyAndExaminationDetails.Chief_Complaints[0].Units}`, toRightOf("Units"), within($("#History-and-Examinations"))).exists(),`${historyAndExaminationDetails.Chief_Complaints[0].Units} to right of Units not found`)
    assert.ok(await text(`${historyAndExaminationDetails.History_of_present_illness}`, within($("#History-and-Examinations")), toRightOf("HPI")).exists(),`${historyAndExaminationDetails.History_of_present_illness} to right of HPI not found`)
    assert.ok(await text(`${historyAndExaminationDetails.Smoking_status}`, within($("#History-and-Examinations")), toRightOf("Smoking status")).exists(),`${historyAndExaminationDetails.Smoking_status} to right of Smoking status not found`)
    assert.ok(await $("//a[@class='img-concept']/img").exists(), "Image not displayed on history & examination");
    await scrollTo($("//a[@class='img-concept']/img"));
    await click($("//a[@class='img-concept']/img"));
    await waitFor(async () => await $(".slide").isVisible())
    assert.ok(await $(".slide").isVisible(), "Image not opened.");
    await evaluate($(`//button[@class='dialog-close-btn']/i`), (el) => el.click())
    await waitFor(10000)
    assert.ok(await $(`.obs-play-btn`).exists(), "Play button is not available");
    await scrollTo($(`.obs-play-btn`));
    await click($(`.obs-play-btn`));
    assert.ok(await $(`.video-dialog`).isVisible(), "Video is not opened.");
    await evaluate($(`//*[@class='ngdialog-close clearfix']`), (el) => el.click())
});

step("Verify consultation notes in patient clinical dashboard", async function () {
    var consultationNote = gauge.dataStore.scenarioStore.get("consultationNotes")
    await click(link(toLeftOf(text("OPD")), within($("#Visits"))))
    assert.ok(await text(consultationNote, within($("#observation-section")), toRightOf("consultation note")).exists(),`Text with ${consultationNote} Not found to right of consultation note`)
});

step("Validate the lab tests are available in patient clinical dashboard", async function () {
    var labOrderCount = gauge.dataStore.scenarioStore.get("labOrderCount")
    for (var i = 0; i < labOrderCount; i++) {
        var testLabOrder = gauge.dataStore.scenarioStore.get("labOrder" + i)
        assert.ok(await text(testLabOrder.test, within($("#Lab-Results"))).exists(), "Lab Test not found for " + testLabOrder.test)
    }
});

step("Verify no error displayed on page", async function () {
    assert.equal(await $("//DIV[@class='message-container error-message-container']").exists(500, 1000), false, "Error displayed on page.")
});

step("Validate obs <form> on the patient clinical dashboard", async function (formPath) {
    var obsFormValues = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/${formPath}.json`))
    gauge.dataStore.scenarioStore.put(obsFormValues.ObservationFormName, obsFormValues)
    await taikoHelper.repeatUntilNotFound($("#overlay"))
    await evaluate($("//SPAN[normalize-space()='" + obsFormValues.ObservationFormName.trim() + "']/..//i[@class='fa fa-eye']"), (el) => el.click())
    await taikoHelper.repeatUntilNotFound($("#overlay"))
    await taikoHelper.validateFormFromFile(obsFormValues.ObservationFormDetails, obsFormValues.ObservationFormName)
    await click($('.ngdialog-close'))
});

step("Verify medical test in patient clinical dashboard", async function () {
    await taikoHelper.repeatUntilNotFound($(".dashboard-section-loader"))
    var labOrderCount = gauge.dataStore.scenarioStore.get("labOrderCount")
    for (var i = 0; i < labOrderCount; i++) {
        var testLabOrder = gauge.dataStore.scenarioStore.get("labOrder" + i)
        for (var j = 0; j < testLabOrder.Result.length; j++) {
            assert.ok(await text(`${testLabOrder.Result[j].value}`, toRightOf(`${testLabOrder.Result[j].label}`),within($("#Lab-Results"))).exists(), "Result not found for " + testLabOrder.Result[j].label+" "+testLabOrder.Result[j].value)
        }
    }
});

step("Verify the document uploaded is available in patient dashboard", async function () {
    var labTest=gauge.dataStore.scenarioStore.get("LabTestFile")
    assert.ok(await text(labTest.test,within($("#Lab-Results"))).exists())
    await click(text(labTest.test,within($("#Lab-Results"))))
    await highlight($("//body//img"))
    assert.ok(await $("//body//img").exists(), "Image not displayed on patient dashboard");
    await closeTab()
});