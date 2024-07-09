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
    closeTab,
    openTab,
    evaluate,
    currentURL,
    goto,
    clear,
    toLeftOf,
} = require('taiko');
var fileExtension = require("../util/fileExtension");
const taikoHelper = require("../util/taikoHelper")
var date = require("../util/date")
const requestResponse = require('../util/requestResponse');
const assert = require("assert");

step("Doctor prescribe tests <prescriptions>", async function (prescriptionFile) {
    var prescriptionFile = `./bahmni-e2e-common-flows/data/${prescriptionFile}.json`;
    var testPrescription = JSON.parse(fileExtension.parseContent(prescriptionFile))
    gauge.message(testPrescription)
    gauge.dataStore.scenarioStore.put("LabTest", testPrescription.test)
    await taikoHelper.repeatUntilFound(text(testPrescription.test))
    await click(testPrescription.test, { force: true })
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
        gauge.dataStore.scenarioStore.put("medicalPrescriptions", medicalPrescriptions)
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
                gauge.dataStore.scenarioStore.put("drugQuantity",await textBox({id:"quantity"}).value())
            }
            await click("Add");
            const patientDashboardUrl = await evaluate(() => window.location.href);
            gauge.dataStore.scenarioStore.put("patientDashboardUrl", patientDashboardUrl)
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
    //let dateTime = date.getDateAndTime(date.today());
    //gauge.dataStore.scenarioStore.put("dateTime", dateTime)
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

step("Verify CDSS is enabled in openMRS in order to trigger contraindication alerts", async function () {
    var cdssEnable = requestResponse.checkCdssIsEnabled()
    assert.ok(cdssEnable)
});

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

step("Verify alert message with card indicator <cardIndicator> is displayed when drug is selected", async function (cardIndicator) {
    var alertMessage = await $("div[class='cdss-alert-summary'] span").text()
    gauge.dataStore.scenarioStore.put("alertMessage", alertMessage)
    assert.ok(await text(cardIndicator).exists(), below(text("Additional Information ")))
    assert.ok(await $("div[class='cdss-alert-summary'] span").exists(), below(text("Additional Information ")))
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

step("Verify medication on patient clinical dashboard", async function () {
    var medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
    assert.ok(await text(medicalPrescriptions.drugName, within($("#Treatments"))).exists())
    assert.ok(await text(`${medicalPrescriptions.dose} ${medicalPrescriptions.units}, ${medicalPrescriptions.frequency}`, within($("#Treatments"))).exists())
    assert.ok(await text(`${medicalPrescriptions.duration} Day(s)`, within($("#Treatments"))).exists())
});

step("Verify add button is <buttonType>", async function (buttonType) {
    const isButtonDisabled = await $("//button[@type='submit']").isDisabled()
    isButtonDisabled ? assert.ok(buttonType === "disabled") : assert.ok(buttonType === "enabled");
});

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

step("Procedure created is uploaded in Bahmni", async function () {
    var procedureName = gauge.dataStore.scenarioStore.get("procedureName")
    var taskLink = await requestResponse.uploadProcedureOrders(procedureName);
    var statusOfProcedure = await requestResponse.checkStatusForProcedure(taskLink);
    assert.equal(statusOfProcedure, "completed")
});

step("Click on Procedure", async function() {
	await scrollTo(" Procedures ")
    await click(" Procedures ")
});

step("Add Procedure", async function () {
	var procedureTitle = gauge.dataStore.scenarioStore.get("procedureTitle")
    await click(procedureTitle)
    await scrollTo(" Procedures ")
    var clinicalProcedure = await $("section[class='orders-section-right'] li:nth-child(1) a:nth-child(1)").text();
    gauge.dataStore.scenarioStore.put("clinicalProcedure",clinicalProcedure)
    await click(clinicalProcedure)
    await click("Save")
});

step("Verify Procedure on patient clinical dashboard", async function () {
    var clinicalProcedure = gauge.dataStore.scenarioStore.get("clinicalProcedure")
    assert.ok(await text(clinicalProcedure, below($("//h2[normalize-space()='Procedure Orders']"))).exists())
});

step("Create ValueSet for a procedure <filePath>", async function (filePath) {
    var jsonFile = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/${filePath}.json`))
    var procedureValueSet = await requestResponse.createValueSet(jsonFile)
    var procedureValueSetURL = procedureValueSet.url
    gauge.dataStore.scenarioStore.put("procedureValueSetURL", procedureValueSetURL)
    var procedureName = procedureValueSet['name']
    var procedureTitle = procedureValueSet['title']
    gauge.dataStore.scenarioStore.put("procedureName", procedureName)
    gauge.dataStore.scenarioStore.put("procedureTitle", procedureTitle)
});

step("Verify that a <cardIndicator> alert message is displayed after the drug is added", async function (cardIndicator) {
    var alertMessage = await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").text();
    var drugName = gauge.dataStore.scenarioStore.get("drugName")
    gauge.dataStore.scenarioStore.put("alertMessage", alertMessage)
    if (cardIndicator === "Critical") {
        assert.ok(await $("//i[@class='fa critical fa-exclamation-triangle']").exists())
    }
    else if (cardIndicator === "Warning") {
        assert.ok(await $("//i[@class='fa critical fa-exclamation-triangle warning']").exists())
    }
    else {
        assert.ok(await $("//i[@class='fa critical fa-info-circle info']").exists())
    }
});
step("Click on dismiss button", async function () {
    await click($("//button[normalize-space()='Dismiss']"))
    assert.ok(await $("//i[@class='fa fa-exclamation-circle cdss-icon-medication']").exists())
});

step("Verify the question icon with contraindication information link is displayed in the alert message", async function () {
    await click($("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]"))
    await click($("//i[@class='fa fa-question-circle']"))
    await closeTab()
});

step("Verify alert message with card indicator <cardIndicator> is displayed against added contraindicative drugs <drugName1> and <drugName2>", async function (cardIndicator, drugName1, drugName2) {
    var alertMessage = await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").text();
    gauge.dataStore.scenarioStore.put("alertMessage", alertMessage)
    if (cardIndicator === "Info") {
        assert.ok(await $("//i[@class='fa critical fa-info-circle info']").exists())
    }
    else if (cardIndicator === "Critical") {
        assert.ok(await $("//i[@class='fa critical fa-exclamation-triangle']").exists())
    }
    else {
        assert.ok(await $("//i[@class='fa critical fa-exclamation-triangle warning']").exists())
    }

    assert.ok(await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").exists(), below(drugName1))
    assert.ok(await $("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]").exists(), below(drugName2))
});

step("Click on cross button to close the alert", async function () {
    await click($("//div[@class='alert-controls']//button[@type='button'][normalize-space()='x']"))
});

step("Verify that a list of reasons for dismissal is displayed", async function () {
    await click($("//p[@ng-class=\"{'strike-text': !alert.isActive}\"]"))
    assert.ok(await $("//select[@id='cdss-audit']").exists())
});

step("Doctor is able to select the reason for dismissal", async function () {
    await click($("//select[@id='cdss-audit']"))
    await dropDown(below($(".fa.fa-question-circle"))).select({ index: '1' });
});

step("Verify the dosage alert message for the substances <drugName>", async function (drugName) {
    var prescriptionFile = "./bahmni-e2e-common-flows/data/consultation/medications/Colchicine.json"
    var medicalPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
    var data = fileExtension.parseContent("./bahmni-e2e-common-flows/data/consultation/medications/verifyDrugDosageAlertMessage.txt")
    if (drugName == "Probenecid") {
        var expected = data.replace('<substanceName>', drugName)
            .replace('<prescribedDose>', medicalPrescriptions.PrescribedDoseForProbenecid)
            .replace('<recommendedDose>', medicalPrescriptions.RecommendedDoseForProbenecid)
        await click($("//div[@class='active-drug-alert bg-warning']"))
    }
    else {
        var expected = data.replace('<substanceName>', drugName)
            .replace('<prescribedDose>', medicalPrescriptions.PrescribedDoseForColchicine)
            .replace('<recommendedDose>', medicalPrescriptions.RecommendedDoseForColchicine)
        await click($("//div[@class='active-drug-alert bg-warning']"))
    }
    var actual = await $("//div[@class='cdss-alert-details']//div[@class='alert-detail']").text()
    assert.equal(actual, expected)
});

step("Verify that the medication is striked off", async function () {
    assert.ok(await $("//p[@class='strike-text']").exists())
});

step("Doctor add the diagnosis for <diagnosisName> having ICD-10 codes", async function (diagnosisName) {
    gauge.dataStore.scenarioStore.put("diagnosisName", diagnosisName)
    var snomedCode = await taikoHelper.getSnomedCodeFromSnomedName(diagnosisName)
    gauge.dataStore.scenarioStore.put("diagnosisCode", snomedCode)
    var diagnosisFile = `./bahmni-e2e-common-flows/data/consultation/diagnosis/snomedDiagnosis.json`;
    var medicalDiagnosis = JSON.parse(fileExtension.parseContent(diagnosisFile))
    gauge.dataStore.scenarioStore.put("medicalDiagnosis", medicalDiagnosis)
    medicalDiagnosis.diagnosis["diagnosisName"] = diagnosisName;
    await write(diagnosisName, into(textBox(below("Diagnoses"))));
    await waitFor(() => $("(//A[starts-with(text(),\"" + medicalDiagnosis.diagnosis.diagnosisName + "\")])[1]").isVisible())
    await click($("(//A[starts-with(text(),\"" + medicalDiagnosis.diagnosis.diagnosisName + "\")])[1]"))
    await click(button(medicalDiagnosis.diagnosis.order), below("Order"));
    await click(button(medicalDiagnosis.diagnosis.certainty), below("Certainty"));
});

step("Navigate to ICD Mappings Demonstrator portal", async function () {
    await openTab()
    await goto(process.env.icdMappingDemonstratorUrl, { waitForNavigation: true, navigationTimeout: process.env.loginTimeout });
});

step("Enter <diagnosisName> with <mapRuleCondition>", async function (diagnosisName, mapRuleCondition) {
    await getICD10Code(diagnosisName, mapRuleCondition)
});


async function getICD10Code(diagnosisName, mapRuleCondition) {
    let patientGender = gauge.dataStore.scenarioStore.get("patientGender")
    let patientAge = gauge.dataStore.scenarioStore.get("patientAge")
    await clear($("//input[@id='mat-input-0']"), { waitForNavigation: false, navigationTimeout: 3000 })
    if (mapRuleCondition == "age") {
        await write(patientAge, into(textBox(toRightOf("Age: "))))
    }
    else if (mapRuleCondition == "gender") {
        await click($("//div[@id='mat-select-value-1']"))
        await click($("//span[normalize-space()='" + patientGender + "']"))
    }
    await write(diagnosisName, into(textBox({ "placeholder": "Search..." })), { force: true })
    await waitFor(() => $("//span[@class='mdc-list-item__primary-text']").isVisible(), 30000)
    await click($("//span[@class='mdc-list-item__primary-text']"))
}

step("Get the ICD-10 code for the SNOMED diagnosis", async function () {
    await waitFor(() => $("//p[@class='ng-star-inserted']").isVisible(), 40000)
    var icd10Code = await ($("//p[@class='ng-star-inserted']")).text()
    icd10Code = icd10Code.split(":")[1].replace(/\s+/g, '');
    gauge.dataStore.scenarioStore.put("icd10Code", icd10Code)
    await closeTab()

});

step("Refill medicines", async function() {
	await click(button("Refill All"))
});

step("Stop medications", async function() {
	await click(button("Stop"))
});