"use strict";
const {
    click,
    waitFor,
    timeField,
    toRightOf,
    textBox,
    into,
    write,
    dropDown,
    highlight,
    below,
    within,
    scrollTo,
    $,
    text,
    confirm,
    accept,
    button,
    link,
    toLeftOf,
    closeTab
} = require('taiko');
var fileExtension = require("../util/fileExtension");
const taikoHelper = require("../util/taikoHelper")
var date = require("../util/date");
const requestResponse = require('../util/requestResponse');
const assert = require("assert");

step("Doctor prescribe tests <prescriptions>", async function (prescriptionFile) {
    var prescriptionFile = `./bahmni-e2e-common-flows/data/${prescriptionFile}.json`;
    var testPrescription = JSON.parse(fileExtension.parseContent(prescriptionFile))
    gauge.message(testPrescription)
    gauge.dataStore.scenarioStore.put("LabTest", testPrescription.test)
    await taikoHelper.repeatUntilFound(text(testPrescription.test))
    console.log("test found.")
    await click(testPrescription.test, { force: true })
    console.log("Selected test.")
    await waitFor(100)
});


step("put medications <prescriptionNames>", async function (prescriptionNames) {
    var prescriptionFile = `./data/${prescriptionNames}.json`;
    gauge.dataStore.scenarioStore.put("prescriptions", prescriptionFile)
})

step("Doctor prescribes medicines <prescriptionNames>", async function (prescriptionNames) {
    var prescriptionsList = prescriptionNames.split(',')
    var prescriptionsCount = prescriptionsList.length
    gauge.dataStore.scenarioStore.put("prescriptionsCount", prescriptionsCount)
    for (var i = 0; i < prescriptionsCount; i++) {

        var prescriptionFile = `./bahmni-e2e-common-flows/data/${prescriptionsList[i]}.json`;
        gauge.dataStore.scenarioStore.put("prescriptions" + i, prescriptionFile)
        var drugName = gauge.dataStore.scenarioStore.get("Drug Name")
        var medicalPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
        gauge.message(medicalPrescriptions)

        if (medicalPrescriptions.drug_name != null) {
            if (drugName == null)
                drugName = medicalPrescriptions.drug_name;
            if (await textBox(toRightOf("Drug Name")).exists()) {
                await write(drugName, into(textBox(toRightOf("Drug Name"))));
                await click(link(drugName, below(textBox(toRightOf("Drug Name")))));
                await dropDown(toRightOf("Units")).select(medicalPrescriptions.units);
                await dropDown(toRightOf("Frequency")).select(medicalPrescriptions.frequency)
                await write(medicalPrescriptions.dose, into(textBox(toRightOf("Dose"))));
                await write(medicalPrescriptions.duration, into(textBox(toRightOf("Duration"))));
                await write(medicalPrescriptions.notes, into(textBox(toRightOf("Additional Instructions"))));
            }
            await click("Add");
        }

    }
}
);


step("Doctor captures consultation notes <notes>", async function (notes) {
    gauge.dataStore.scenarioStore.put("consultationNotes", notes)
    await click("Consultation", { force: true, waitForNavigation: true, waitForStart: 2000 });
    await waitFor(textBox({ placeholder: "Enter Notes here" }))
    await write(notes, into(textBox({ "placeholder": "Enter Notes here" })), { force: true })
    gauge.dataStore.scenarioStore.put("consultationNotes", notes);
});

step("Doctor clicks consultation", async function () {
    await click("Consultation", { force: true, waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Choose Disposition", async function () {
    await click("Disposition", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
});

step("Doctor advises admitting the patient", async function () {
    await waitFor(async () => (await dropDown("Disposition Type").exists()))
    await dropDown("Disposition Type").select('Admit Patient')
    await write("Admission Notes", into(textBox(below("Disposition Notes"))))
});

step("Doctor advises discharging the patient", async function () {
    await waitFor(async () => (await dropDown("Disposition Type").exists()))
    await dropDown("Disposition Type").select('Discharge Patient')
    await write("Discharge Notes", into(textBox(below("Disposition Notes"))))
});

step("Open <tabName> Tab", async function (tabName) {
    await click(link(tabName), { waitForNavigation: true, navigationTimeout: process.env.actionTimeout, force: true });
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Save visit data", async function () {
    await click("Save", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
});

step("Join teleconsultation", async function () {
    await scrollTo('Join Teleconsultation')
    await click('Join Teleconsultation');
    await taikoHelper.repeatUntilNotFound($("#overlay"))
    await scrollTo(button('Join teleconsultation'), toRightOf("Scheduled"))
    await click(button('Join teleconsultation', toRightOf("Scheduled")), { waitForNavigation: false, navigationTimeout: 3000 })
    await highlight('Tele Consultation')
    await click(($('[ng-click="closeTeleConsultation()"]')));
});

step("Doctor notes the diagnosis and condition <filePath>", async function (filePath) {
    var diagnosisFile = `./bahmni-e2e-common-flows/data/${filePath}.json`;
    gauge.dataStore.scenarioStore.put("diagnosisFile", diagnosisFile)
    var medicalDiagnosis = JSON.parse(fileExtension.parseContent(diagnosisFile))
    gauge.dataStore.scenarioStore.put("medicalDiagnosis", medicalDiagnosis)
    gauge.message(medicalDiagnosis)
    await click("Diagnoses");
    await write(medicalDiagnosis.diagnosis.diagnosisName, into(textBox(below("Diagnoses"))));
    await waitFor(() => $("(//A[starts-with(text(),\"" + medicalDiagnosis.diagnosis.diagnosisName + "\")])[1]").isVisible())
    await click($("(//A[starts-with(text(),\"" + medicalDiagnosis.diagnosis.diagnosisName + "\")])[1]"))
    await click(medicalDiagnosis.diagnosis.order, below("Order"));
    await click(medicalDiagnosis.diagnosis.certainty, below("Certainty"));
    for (var i = 0; i < medicalDiagnosis.condition.length; i++) {
        await write(medicalDiagnosis.condition[i].conditionName, into(textBox(below("Condition"))));
        await waitFor(() => $("(//A[starts-with(text(),\"" + medicalDiagnosis.condition[i].conditionName + "\")])[1]").isVisible())
        await click($("(//A[starts-with(text(),\"" + medicalDiagnosis.condition[i].conditionName + "\")])[1]"))
        await click(medicalDiagnosis.condition[i].status, below($("//div[@class='col col2']//*[contains(text(),'Status')]")));
        await click("Add", below("Action"))
    }
});

step("Random snomed diagnosis is identified and verified in openmrs <diagnosisName>", async function (diagnosisName) {
    await findDiagnosis(diagnosisName)
});


step("Doctor add the diagnosis for <diagnosis>", async function (diagnosis) {
    var diagnosisName = gauge.dataStore.scenarioStore.get("diagnosisName")
    var diagnosisCode = gauge.dataStore.scenarioStore.get("diagnosisCode")
    if (diagnosis === "code") {
        await write(diagnosisCode, into(textBox(below("Diagnoses"))));
    }
    else {
        await write(diagnosisName, into(textBox(below("Diagnoses"))));
    }
    var diagnosisFile = `./bahmni-e2e-common-flows/data/consultation/diagnosis/snomedDiagnosis.json`;
    var medicalDiagnosis = JSON.parse(fileExtension.parseContent(diagnosisFile))
    gauge.dataStore.scenarioStore.put("medicalDiagnosis", medicalDiagnosis)
    medicalDiagnosis.diagnosis["diagnosisName"] = diagnosisName;
    medicalDiagnosis.diagnosis["diagnosisCode"] = diagnosisCode;
    await waitFor(() => $("(//A[starts-with(text(),\"" + medicalDiagnosis.diagnosis.diagnosisName + "\")])[1]").isVisible())
    await click($("(//A[starts-with(text(),\"" + medicalDiagnosis.diagnosis.diagnosisName + "\")])[1]"))
    await click(medicalDiagnosis.diagnosis.order, below("Order"));
    await click(medicalDiagnosis.diagnosis.certainty, below("Certainty"));
    let dateTime = date.getDateAndTime(date.today());
    gauge.dataStore.scenarioStore.put("dateTime", dateTime)
});

step("Verify random SNOMED <diagnosis name> saved is added to openmrs database with required metadata", async function (diagnosis) {
    if (diagnosis === "code") {
        const diagnosisCode = gauge.dataStore.scenarioStore.get("diagnosisCode")
        assert.ok(await requestResponse.checkDiagnosisInOpenmrs(diagnosisCode))
    }
    else {
        const diagnosisName = gauge.dataStore.scenarioStore.get("diagnosisName")
        assert.ok(await requestResponse.checkDiagnosisInOpenmrs(diagnosisName))
    }
});

async function findDiagnosis(diagnosisName) {
    var snomedCode = await taikoHelper.getSnomedCodeFromSnomedName(diagnosisName)
    var diagnosisJson = await requestResponse.getSnomedDiagnosisDataFromAPI(snomedCode);
    var diagnosisName = await taikoHelper.generateRandomDiagnosis(diagnosisJson);
    const checkDataInOpenmrs = await requestResponse.checkDiagnosisInOpenmrs(diagnosisName);
    if (checkDataInOpenmrs === false) {
        return diagnosisName;
    }
    else {
        await findDiagnosis(diagnosisJson)
    }
}

step("Random SNOMED diagnosis is identified using ECL query for descendants of <diagnosisName>", async function (diagnosisName) {
    var snomedCode = await taikoHelper.getSnomedCodeFromSnomedName(diagnosisName)
    gauge.dataStore.scenarioStore.put("snomedCode", snomedCode)
    var diagnosisJson = await requestResponse.getSnomedDiagnosisDataFromAPI(snomedCode);
    var diagnosisName = await taikoHelper.generateRandomDiagnosis(diagnosisJson);
});

step("Doctor add the drug for <diagnosisName>", async function (diagnosisName) {
    var drugName = await taikoHelper.getContraindicativeDrugFromSnomedDiagnosisName(diagnosisName)
    gauge.dataStore.scenarioStore.put("drugName", drugName)
    await textBox(toRightOf("Drug Name")).exists()
    await write(drugName, into(textBox(toRightOf("Drug Name"))));
    await click(link(drugName, below(textBox(toRightOf("Drug Name")))));
});

step("Verify that a <cardIndicator> alert message is displayed after the drug is added", async function (cardIndicator) {
    var alertMessage = await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").text();
    var drugName = gauge.dataStore.scenarioStore.get("drugName")
    gauge.dataStore.scenarioStore.put("alertMessage", alertMessage)
    console.log(alertMessage)
    if (cardIndicator === "Critical") {
        //assert.ok(await text(cardIndicator).exists(), below(text("Additional Information ")))
        assert.ok(await $("//i[@class='fa critical fa-exclamation-triangle']").exists())
    }
    else if (cardIndicator === "Warning") {
        assert.ok(await $("//i[@class='fa critical fa-exclamation-triangle warning']").exists())
    }
    else {
        assert.ok(await $("//i[@class='fa critical fa-info-circle info']").exists())
    }
    // assert.ok(await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").exists(), below(drugName))

});

// step("Doctor select the reason for dismissal", async function () {
//     await click($("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]"))
//     assert.ok(await $("//select[@id='cdss-audit']").exists())
//     await click($("//select[@id='cdss-audit']"))
//     await dropDown(below($(".fa.fa-question-circle"))).select({ index: '1' });
// });

step("Click on dismiss button", async function () {
    await click($("//button[normalize-space()='Dismiss']"))
    assert.ok(await $("//i[@class='fa fa-exclamation-circle cdss-icon-medication']").exists())
    //assert.ok(!await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").exists(), below(drugName))
    //assert.ok(await $("//i[@class='fa fa-exclamation-circle cdss-icon-medication']").exists(),toLeftOf(drugName))
});

step("Doctor should be able to add drug after adding the mandatory details", async function () {
    var prescriptionFile = `./bahmni-e2e-common-flows/data/consultation/diagnosis/snomedMedication.json`;
    var medicalPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
    gauge.dataStore.scenarioStore.put("medicalPrescriptions", medicalPrescriptions)
    var drugName = gauge.dataStore.scenarioStore.get("drugName")
    medicalPrescriptions["drugName"] = drugName;
    await dropDown(toRightOf("Units")).select(medicalPrescriptions.units);
    await dropDown(toRightOf("Frequency")).select(medicalPrescriptions.frequency)
    await write(medicalPrescriptions.dose, into(textBox(toRightOf("Dose"))));
    await write(medicalPrescriptions.duration, into(textBox(toRightOf("Duration"))));
    await click("Add");
});

// step("Verify medication on patient clinical dashboard", async function () {
//     var medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
//     assert.ok(await text(medicalPrescriptions.drugName, within($("#Treatments"))).exists())
//     assert.ok(await text(`${medicalPrescriptions.dose} ${medicalPrescriptions.units}, ${medicalPrescriptions.frequency}`, within($("#Treatments"))).exists())
//     assert.ok(await text(`${medicalPrescriptions.duration} Day(s)`, within($("#Treatments"))).exists())
// });

step("Verify CDSS is enabled in openMRS in order to trigger contraindication alerts", async function () {
    var cdssEnable = requestResponse.checkCdssIsEnabled()
    assert.ok(cdssEnable)
});

// step("Verify add button is <buttonType>", async function (buttonType) {
//     const isButtonDisabled = await $("//button[@type='submit']").isDisabled()
//     isButtonDisabled ? assert.ok(buttonType === "disabled") : assert.ok(buttonType === "enabled");
// });

step("Verify dismissal entry is added in audit log", async function () {
    var alertMessage = gauge.dataStore.scenarioStore.get("alertMessage").replace(/"/g, "")
    let patientIdentifier = gauge.dataStore.scenarioStore.get("patientIdentifier")
    await write(patientIdentifier, into(textBox(toRightOf("Patient ID "))))
    await click($("//button[normalize-space()='Filter']"))
    await scrollTo($("//button[@ng-click='next()']"));
    do {
        await click($("//button[@ng-click='next()']"))
    }
    while (assert.ok(await text("No more events to be displayed !!").exists()));
    await highlight(text(alertMessage))
    assert.ok(await text(alertMessage, toRightOf(patientIdentifier)).exists())
});

step("Verify the question icon with contraindication information link is displayed in the alert message", async function () {
    await click($("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]"))
    await click($("//i[@class='fa fa-question-circle']"))
    await closeTab()
});

// step("Doctor add the drug <drugName>", async function(drugName) {
// 	await taikoHelper.getContraindicativeDrugs()
//     if(drugName === "drug1") {
//         drugName = gauge.dataStore.scenarioStore.get("drug1")
//     }
//     else if(drugName === "drug2") {
//         drugName = gauge.dataStore.scenarioStore.get("drug2")
//     }
//     else{
//         console.log("drugName is defined")
//         drugName = gauge.dataStore.scenarioStore.get("drug_dosage")
//         console.log("a "+drugName)
//     }
//     //var drugName = gauge.dataStore.scenarioStore.get("drug1")
//     await textBox(toRightOf("Drug Name")).exists()
//     await write(drugName, into(textBox(toRightOf("Drug Name"))));
//     await click(link(drugName, below(textBox(toRightOf("Drug Name")))));
// });

step("Verify alert message with card indicator <cardIndicator> is displayed against added contraindicative drugs <drugName1> and <drugName2>", async function (cardIndicator, drugName1, drugName2) {
    var alertMessage = await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").text();
    //var drugName1 = gauge.dataStore.scenarioStore.get("drug1")
    //var drugName2 = gauge.dataStore.scenarioStore.get("drug2")
    gauge.dataStore.scenarioStore.put("alertMessage", alertMessage)
    console.log(alertMessage)
    if (cardIndicator === "Info") {
        assert.ok(await $("//i[@class='fa critical fa-info-circle info']").exists())
    }
    else if (cardIndicator === "critical") {
        assert.ok(await $("//i[@class='fa critical fa-exclamation-triangle']").exists())
    }
    else {
        assert.ok(await $("//i[@class='fa critical fa-exclamation-triangle warning']").exists())
    }

    assert.ok(await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").exists(), below(drugName1))
    assert.ok(await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").exists(), below(drugName2))
});

step("Verify that the medication is striked off", async function () {
    assert.ok(await $("//p[@class='strike-text']").exists())
});

step("Click on cross button on the medication", async function () {
    await click($("(//button[@type='button'][normalize-space()='x'])[1]"))
});

step("Verify that a list of reasons for dismissal is displayed", async function () {
    await click($("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]"))
    assert.ok(await $("//select[@id='cdss-audit']").exists())
});

step("Doctor is able to select the reason for dismissal", async function () {
    await click($("//select[@id='cdss-audit']"))
    await dropDown(below($(".fa.fa-question-circle"))).select({ index: '1' });
});