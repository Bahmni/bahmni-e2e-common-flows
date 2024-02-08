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
    closeTab,
    evaluate,
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

    assert.ok(await (await text(`${firstName} ${lastName} (${patientIdentifierValue})`, toLeftOf("Female"))).exists())
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
        assert.ok(await text(`${medicalPrescriptions.dose} ${medicalPrescriptions.units}, ${medicalPrescriptions.frequency}`, within($("#Treatments"))).exists())
        assert.ok(await text(`${medicalPrescriptions.duration} Day(s)`, within($("#Treatments"))).exists())
    }
});

step("Verify vitals", async function () {
    var vitalFormValues = gauge.dataStore.scenarioStore.get("vitalFormValues")
    for (var vitalFormValue of vitalFormValues.ObservationFormDetails) {
        if (vitalFormValue.type == 'Group') {
            for (var vitalFormGroup of vitalFormValue.value) {
                assert.ok(await text(vitalFormGroup.value, within($("#Vitals")), toRightOf(vitalFormGroup.label.split(" ")[0])).exists())
            }
        }
        else {
            assert.ok(await text(vitalFormValue.value, within($("#Vitals")), toRightOf(vitalFormValue.label.split(" ")[0])).exists())
        }
    };
});

step("Verify diagnosis and condition in patient clinical dashboard", async function () {
    var diagnosisFile = gauge.dataStore.scenarioStore.get("diagnosisFile")
    var medicalDiagnosis = JSON.parse(fileExtension.parseContent(diagnosisFile))
    assert.ok(await text(medicalDiagnosis.diagnosis.diagnosisName, toLeftOf(medicalDiagnosis.diagnosis.certainty, toLeftOf(medicalDiagnosis.diagnosis.order)), within($("//section[@id='Diagnoses']"))).exists())
});

step("Verify history & examination in patient clinical dashboard", async function () {
    var historyAndExaminationDetails = gauge.dataStore.scenarioStore.get("historyAndExaminationDetails")
    assert.ok(await text(`${historyAndExaminationDetails.Chief_Complaints[0].Chief_Complaint} since ${historyAndExaminationDetails.Chief_Complaints[0].for} ${historyAndExaminationDetails.Chief_Complaints[0].for_frequency}`, toRightOf("Chief Complaint"), within($("#History-and-Examinations"))).exists())
    assert.ok(await text(`${historyAndExaminationDetails.Chief_complaint_notes}`, within($("#History-and-Examinations")), toRightOf("Chief Complaint Notes")).exists())
    assert.ok(await text(`${historyAndExaminationDetails.History_Notes}`, within($("#History-and-Examinations")), toRightOf("History Notes")).exists())
    assert.ok(await text(`${historyAndExaminationDetails.Examination_notes}`, within($("#History-and-Examinations")), toRightOf("Examination Notes")).exists())
    assert.ok(await text(`${historyAndExaminationDetails.Smoking_History}`, within($("#History-and-Examinations")), toRightOf("Smoking History")).exists())
});

step("Verify consultation notes in patient clinical dashboard", async function () {
    var consultationNote = gauge.dataStore.scenarioStore.get("consultationNotes")
    await click(link(toLeftOf(text("OPD")), within($("#Visits"))))
    assert.ok(await text(consultationNote, within($("#observation-section")), toRightOf("consultation note")).exists())
});

step("Validate the lab tests are available in patient clinical dashboard", async function () {
    var labTest =gauge.dataStore.scenarioStore.get("LabTest")
    assert.ok(await text(labTest,within($("#Lab-Results"))).exists())
});

step("Verify diagnosis in patient clinical dashboard", async function () {
    var medicalDiagnosis = gauge.dataStore.scenarioStore.get("medicalDiagnosis")
    assert.ok(await text(medicalDiagnosis.diagnosis.diagnosisName, toLeftOf(medicalDiagnosis.diagnosis.certainty, toRightOf(medicalDiagnosis.diagnosis.order)), within($("#Diagnoses"))).exists())
});


step("Validate the count report for <ParentClass> and check count is increased and the added diagnosis is present in the report when descendents of <ChildClass> is added", async function (arg0, ChildClass) {
    var medicalDiagnosis = gauge.dataStore.scenarioStore.get("medicalDiagnosis")
    var countBeforeAddingDiagnosis = gauge.dataStore.scenarioStore.get("countBeforeAddingDiagnosis")
    var countPos = await taikoHelper.returnHeaderPos("Count")
    assert.ok(await text(medicalDiagnosis.diagnosis.diagnosisName, below(text("Diagnosis"))).exists())
    await highlight($("//TD[normalize-space()='" + medicalDiagnosis.diagnosis.diagnosisName + "']/../TD[" + countPos + "]"))
    var countAfterAddingDiagnosis = await $("//TD[normalize-space()='" + medicalDiagnosis.diagnosis.diagnosisName + "']/../TD[" + countPos + "]").text()
    assert.ok(countAfterAddingDiagnosis > countBeforeAddingDiagnosis)
    await closeTab();
});

step("Validate the count report for <ParentClass>  and check added diagnosis is not present in the report when descendents of <hildClass> is added", async function (ParentClass, hildClass) {
    var medicalDiagnosis = gauge.dataStore.scenarioStore.get("medicalDiagnosis")
    assert.ok(!await text(medicalDiagnosis.diagnosis.diagnosisName, below(text("Diagnosis"))).exists())
    await closeTab();
});

step("Validate report and check count before adding diagnosis", async function () {
    var countBeforeAddingDiagnosis = 0;
    var diagnosisName = gauge.dataStore.scenarioStore.get("diagnosisName")
    if (!await text(diagnosisName, below(text("Diagnosis"))).exists() === true) {
        gauge.dataStore.scenarioStore.put("countBeforeAddingDiagnosis", countBeforeAddingDiagnosis)
    }
    else {
        var countPos = await taikoHelper.returnHeaderPos("Count")
        var countBeforeAddingDiagnosis = await $("//TD[normalize-space()='" + diagnosisName + "']/../TD[" + countPos + "]").text()
        gauge.dataStore.scenarioStore.put("countBeforeAddingDiagnosis", countBeforeAddingDiagnosis)
    }
    await closeTab();
})

step("Validate <patientDetail> on diagnosis line reports", async function (patientDetail) {
    let patientIdentifier = gauge.dataStore.scenarioStore.get("patientIdentifier")
    var countPos = await taikoHelper.returnHeaderPos(patientDetail)
    var actual = await $("//TD[normalize-space()='" + patientIdentifier + "']/../TD[" + countPos + "]").text()
    switch (patientDetail) {
        case 'Patient Name':
            let firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
            let lastName = gauge.dataStore.scenarioStore.get("patientLastName")
            let expectedPatientName = `${firstName} ${lastName}`
            assert.equal(actual, expectedPatientName)
            break;
        case 'Gender':
            let expectedGender = (gauge.dataStore.scenarioStore.get("patientGender") == "Female") ? "F" : "M";
            assert.equal(actual, expectedGender)
            break;
        case 'Date of Birth':
            let expectedBirthDate = gauge.dataStore.scenarioStore.get("patientBirthDate")
            assert.equal(actual, expectedBirthDate)
            break;
        case 'Diagnosis':
            let expectedDiagnosisName = gauge.dataStore.scenarioStore.get("diagnosisName")
            assert.equal(actual, expectedDiagnosisName)
            break;
        case 'SNOMED Code':
            let expectedDiagnosisCode = gauge.dataStore.scenarioStore.get("diagnosisCode")
            assert.equal(actual, expectedDiagnosisCode)
            break;
        case 'city_village':
            let expectedVillage = gauge.dataStore.scenarioStore.get("village")
            assert.equal(actual, expectedVillage)
            break;
        case 'class':
            let expectedClass = "General"
            assert.equal(actual, expectedClass)
            break;
        case 'ICD10 Code(s)':
            let icd10Code = gauge.dataStore.scenarioStore.get("icd10Code")
            assert.equal(actual.trim(), icd10Code.trim())
            break;
        default:
            assert.equal(actual, "")
            break;
    }
});

step("Validate obs <formPath> on the patient clinical dashboard", async function (formPath) {
    var obsFormValues = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/${formPath}.json`))
    gauge.dataStore.scenarioStore.put(obsFormValues.ObservationFormName, obsFormValues)
    await taikoHelper.repeatUntilNotFound($("#overlay"))
    await evaluate($("//SPAN[normalize-space()='" + obsFormValues.ObservationFormName.trim() + "']/..//i[@class='fa fa-eye']"), (el) => el.click())
    await taikoHelper.repeatUntilNotFound($("#overlay"))
    await taikoHelper.validateFormFromFile(obsFormValues.ObservationFormDetails, obsFormValues.ObservationFormName)
    await click($('.ngdialog-close'))
});


step("Verify Radiology order for test <radiologyTest> in patient clinical dashboard", async function (radiologyTest) {
    assert.ok(await text(radiologyTest,within($("#Radiology-Orders"))).exists())
	
});

step("Verify Radiology order for test <radiologyTest> under pacs display control in patient clinical dashboard", async function (radiologyTest) {
	assert.ok(await link(radiologyTest,within($("#Pacs"))).exists())
});