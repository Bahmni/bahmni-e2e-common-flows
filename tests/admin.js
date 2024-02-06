"use strict";
const {
    goto,
    write,
    above,
    dropDown,
    click,
    into,
    below,
    waitFor,
    checkBox,
    textBox,
    toLeftOf,
    alert,
    $,
    text,
    attach,
    dragAndDrop,
    confirm,
    accept,
    button,
    near,
    link,
    press,
    doubleClick,
    toRightOf,
    highlight,
    mouseAction,
    currentURL,
    radioButton,
    fileField,
    tableCell,
    clear,
    timeField,
    client,
    closeTab,
    switchTo,
} = require('taiko');

const path = require('path');
var assert = require("assert");
var taikoHelper = require("./util/taikoHelper");
var users = require("./util/users");
const csvConfig = require("./util/csvConfig");
var date = require("./util/date");
const endpoints = require('./snomedEndpoints').endpoints;
const requestResponse = require('./util/requestResponse');
const AdmZip = require('adm-zip');
var fileExtension = require("./util/fileExtension");
const ndjson = require('ndjson')
const fs = require('fs');



step("Goto Bed creation", async function () {
    await click("Beds");
});

step("Goto Admin home", async function () {
    await click(link(toLeftOf("Admission Locations")));
});

step("Goto Dictionary", async function () {
    await click("Dictionary")
});

step("Open <submodule>", async function (submodule) {
    await click(submodule);
});

step("Open patient2 details by search", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("merge_patientIdentifier2");
    gauge.message(patientIdentifierValue)
    await write(patientIdentifierValue)
    await press('Enter', { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    await taikoHelper.repeatUntilNotFound($("#overlay"))
    try {
        await click(link(patientIdentifierValue))
    } catch (e) { }
});

step("Verify patient1 details are open", async function () {
    var patientIdentifier = await $('#patientIdentifierValue').text();
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("merge_patientIdentifier1");
    assert.ok(patientIdentifier == patientIdentifierValue)
});

step("Open Form builder", async function () {
    await click("Form Builder");
});

step("Create a form", async function () {
    await click("Create a Form");
});

step("Enter form name", async function () {
    var formName = users.randomName(10)
    gauge.dataStore.scenarioStore.put("FormName", formName)
    await write(formName, into(textBox(below("Form Name"))));
});

step("start creating a form", async function () {
    await click("Create Form");
});

step("Put formname <formName>", async function (formName) {
    gauge.dataStore.scenarioStore.put("FormName", formName)
});

step("Edit form <formName>", async function (formName) {
    await click(link(toRightOf(formName)))
});

step("Create obs group <obsName>", async function (obsName) {
    await dragAndDrop("ObsGroup", $(".form-builder-row"));
    await click("Select ObsGroup Source")
    await write(obsName, into(textBox(below("Control Properties"))))
    await press('Enter')
});

step("create a section", async function () {
    await dragAndDrop("Section", $(".form-builder-row"));
});

step("Create a location <location> if it doesn't exist", async function (locationProperty) {
    var locationName = process.env[locationProperty].split(":")[0]
    var locationType = process.env[locationProperty].split(":")[1]
    if (await link(locationName).exists())
        return
    await click("Add Location")
    await write(locationName, into(textBox(toRightOf("Name"))))
    await click(checkBox(toLeftOf(locationType)))
    await click("Save Location", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout })
});

step("Add a new concept", async function () {
    await click("Add new concept", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
});

step("enter a concept name", async function () {
    var drugName = users.randomName(10)
    await write(drugName, into(textBox(above("Synonyms"), below("English"))));
    gauge.message(drugName)
    gauge.dataStore.scenarioStore.put("Drug Concept", drugName)
});

step("enter a description", async function () {
    await write("For automation", into(textBox(toRightOf("Description"), below("Short Name"))));
});

step("make it saleable", async function () {
    await click("True", toRightOf("saleable"));
});

step("select the type of concept being created as <conceptType>", async function (conceptType) {
    await dropDown(toRightOf("Class")).select(conceptType);
});

step("save the concept", async function () {
    await click("Save Concept");
});

step("Create a drug with more details", async function () {
    var _currentURL = await currentURL();
    var dosageForm = "Tablet";
    await click("Administration");
    await click("Manage Concept Drugs");
    await click("Add Concept Drug");
    var drugName = users.randomName(10)
    await write(drugName, into(textBox(toRightOf("Name"), above("Concept"))));
    gauge.message(`Drug Name - ${drugName}`);
    gauge.dataStore.scenarioStore.put("Drug Name", drugName)
    var drugConcept = gauge.dataStore.scenarioStore.get("Drug Concept")
    await write(drugConcept, into(textBox({ placeHolder: "Enter concept name or id" })));
    await write(dosageForm, into(textBox(toRightOf("Dosage Form"), above("Strength"))));
    await click("Save Concept Drug");
});

step("Goto Manage Address Hierarchy", async function () {
    await click("Manage Address Hierarchy", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
});

step("Goto reporting", async function () {
    await click("Reporting")
});

step("Goto Report Administration", async function () {
    await click("Report Administration")
});

step("Create Period Indicator Report", async function () {
    await click("Period Indicator Report")
    await write(users.randomName(10), below("Name"))
    await click("Submit")
});

step("Add Period Indicator Details", async function () {
    await click("Add Dimension")
    await write(users.randomName(10), into(textBox(toRightOf("Key"))))
    await click("Submit")
});

step("Upload <profile> data file", async function (profile) {
    await radioButton(above(profile)).select();
    let max_Retry = 2
    while (max_Retry > 0) {
        try {
            await attach(await csvConfig.generateUpdatedCSV(profile), fileField({ id: "inputFileUpload" }));
            await waitFor(2000)
            await click(button("Upload"))
        }
        catch (e) {
            console.error(e);
        }
        while (await text('IN_PROGRESS', near("Status"), toRightOf(profile.toLowerCase() + '.csv')).exists()) {
            await click(button("Refresh"));
        }
        if (await text('ERROR', near("Status"), toRightOf(profile.toLowerCase() + '.csv')).exists(0, 0)) {
            max_Retry = max_Retry - 1
        } else {
            max_Retry = 0
        }
    }
    assert.ok(await text('COMPLETED', near("Status"), toRightOf(profile.toLowerCase() + '.csv')).exists());
    alert(/^can not be represented as java.sql.Timestamp]9.*$/, async () => await accept())
});

step("Click Search Index", async function () {
    await click(link("Search Index"));
});

step("Click Rebuild Search Index", async function () {
    await click(button("Rebuild Search Index"));
    await waitFor(() => $("//*[@id='success']/p").isVisible(), 40000)
    assert.ok(await $("//*[@id='success']/p").isVisible());
});

step("Find <user> using name and open", async function (user) {
    await write(users.getUserNameFromEncoding(process.env[user]), into(textBox(toRightOf("Find User on Name"))));
    await click(button("Search"));
    await click(link(users.getUserNameFromEncoding(process.env[user])));
});

step("Give <role> to user", async function (role) {
    await checkBox(toLeftOf(role)).check();
    await click(button("Save User"));
});

step("Click on Audit log", async function () {
    await click("Audit Log");

});

step("Open Audit Log module", async function () {
    await click("Audit Log");
    await waitFor(10000);
});

step("Enter patientId", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    await write(patientIdentifierValue, into(textBox(toRightOf("Patient ID "))));

});

step("Click on Filter", async function () {
    await click("Filter");
    await waitFor(10000);
});


step("Verify Event <message> in Audit log for the <user>", async function (strMessage, strUser) {
    var labReportFile = gauge.dataStore.scenarioStore.get("labReportFile")
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    var username = users.getUserNameFromEncoding(process.env[strUser]);
    var todayDate = date.getDateInLongFromat(date.today())
    var labTest = gauge.dataStore.scenarioStore.get("LabTest")
    strMessage = strMessage.replace('<user>', username)
        .replace('<patient>', patientIdentifierValue)
        .replace('<labReportFile>', labReportFile)
        .replace('<date>', todayDate)
        .replace("<labTest>", labTest);
    if (strMessage.includes(patientIdentifierValue)) {
        assert.ok(await text(strMessage, toRightOf(username), toRightOf(patientIdentifierValue)).exists());
    }
    assert.ok(await text(strMessage, toRightOf(username)).exists());
});

step("Click on Manage Forms", async function () {
    await click("Manage Forms");
});

step("Delete <formName> if exist", async function (formName) {
    if (await $("//a[normalize-space()='"+formName+"']").exists()) {
        await click(formName)
        confirm('Are you sure you want to delete this entire form AND schema?', async () => await accept());
        await click($("//input[@value='Delete Form']"))
    }
});

step("Create obs group <obsName> and add an ecl query for <obsField> <properties>", async function (obsName, obsField, properties) {
    await dragAndDrop("ObsGroup", $(".form-builder-row"));
    await click("Select ObsGroup Source")
    await write(obsName, into(textBox(below("Control Properties"))))
    await press('Enter')
    await click(obsField)
    for (var row of properties.rows) {
        if (row.cells[0] === "Url") {
            await highlight(row.cells[0])
            var snomedCode = await taikoHelper.getSnomedCodeFromSnomedName(obsField)
            await write(endpoints.ECL_QUERY + snomedCode, into(textBox(toRightOf(row.cells[0]))))
        }
        else {

            await click(checkBox(toRightOf(row.cells[0])));
        }

    }
});

step("Click Publish button", async function () {
    await click("Publish", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
});

step("Enter form name as <formName>", async function (formName) {
    gauge.dataStore.scenarioStore.put("FormName", formName)
    await write(formName, into(textBox(below("Form Name"))));
});

step("Edit form name", async function () {
    var formName = gauge.dataStore.scenarioStore.get("FormName")
    await click(link(toRightOf(formName)))
});

step("Validate the report generated for Snomed form builder form Report <observationFormFile>", async function (observationFormFile) {
    var observationFormValues = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/${observationFormFile}.json`))
    await getValueAndShortNameFromJsonFile(observationFormValues.ObservationFormDetails)
    await closeTab();
});

step("Create obs <obsName> <properties>", async function (obsName, properties) {
    await dragAndDrop($("//div[normalize-space()='Obs']"), into($(".form-builder-column")))
    await click("Select Obs Source")
    await write(obsName, into(textBox(below("Control Properties"))))
    await press('Enter')
    await click(obsName)
    for (var row of properties.rows) {
        if (row.cells[0] === "Url") {
            await highlight(row.cells[0])
            await write(endpoints.VALUESET_URL, into(textBox(toRightOf(row.cells[0]))))
        }
        else {

            await click(checkBox(toRightOf(row.cells[0])));
        }

    }
});

step("Search procedure name and delete it", async function () {
    var procedureTitle = gauge.dataStore.scenarioStore.get("procedureTitle")
    var procedureName = gauge.dataStore.scenarioStore.get("procedureName")
    await write(procedureTitle, into(textBox(below("Find Concept(s)"))));
    await click(button("Search"));
    await click(procedureName)
    await click($("//a[@id='editConcept']"));
    confirm('Are you sure you want to delete this ENTIRE CONCEPT', async () => await accept());
    await click($("//input[@value='Delete Concept']"))
});

step("Delete the procedure from snowstorm", async function () {
    var procedureValueSetURL = gauge.dataStore.scenarioStore.get("procedureValueSetURL")
    var procedureID = await requestResponse.getIDFromProcedureValueset(procedureValueSetURL)
    await requestResponse.deleteProcedureValueset(procedureID)
});

step("Remove the procedure from openMRS", async function () {
    await write("Procedure Orders", into(textBox(toLeftOf($("//input[@value='Search']")))));
    await click(button("Search"));
    await click($("//span[normalize-space()='Procedure Orders']"))
    await click($("//a[@id='editConcept']"));
    await highlight($("//select[@id='conceptSetsNames']"))
    await click($("//tr[12]//td//tr//td[1]//*[contains(text(),'bahmni-procedures-head')]"))
    await click(button("Remove"))
    await click("Save Concept");
    await closeTab();
});

step("Invoke endpoint for <fhirType> export", async function (fhirType) {
    let taskLink = fhirType == "anonymised" ? await requestResponse.createFHIRExport(true) : await requestResponse.createFHIRExport(false)
    let urlToDownloadFile = await requestResponse.getURLToDownloadNDJSONFile(taskLink);
    await requestResponse.downloadAndProcessData(urlToDownloadFile);

});

step("Open Settings", async function () {
    await click($("//a[@href='/openmrs/admin/maintenance/settings.list']"));
});


step("Click on fhir global properties and add config path for anonymise method", async function () {
    await click($("//a[normalize-space()='Fhir']"));
    await clear($("//textarea[@id='settings0.globalProperty.propertyValue']"), { waitForNavigation: false, navigationTimeout: 3000 })
    await write("/openmrs/data/fhir-export-anonymise-config.json", into($("//textarea[@id='settings0.globalProperty.propertyValue']")));
    await click($("//input[@value='Save']"));
});

step("Validate patient ndjson file", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    var city = gauge.dataStore.scenarioStore.get("village")
    var gender = gauge.dataStore.scenarioStore.get("patientGender")
    var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
    var middleName = gauge.dataStore.scenarioStore.get("patientMiddleName")
    var lastName = gauge.dataStore.scenarioStore.get("patientLastName")
    var mobileNumber = gauge.dataStore.scenarioStore.get("patientMobileNumber")
    var birthYear = gauge.dataStore.scenarioStore.get("patientBirthYear")
    const fileStream = fs.createReadStream('./extracted_data/Patient.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            if (obj.identifier[0].value === patientIdentifierValue) {
                assert.equal(obj.name[0].given[0], firstName)
                assert.equal(obj.name[0].given[1], middleName)
                assert.equal(obj.name[0].family, lastName)
                assert.equal(obj.gender, gender.toLowerCase())
                assert.equal(obj.birthDate, birthYear)
                assert.equal(obj.address[0].city, city)
                assert.equal(obj.telecom[0].value, mobileNumber)
            }
        }
        )
});

step("Validate medication ndjson file", async function () {
    let fileStream = fs.createReadStream('./extracted_data/MedicationRequest.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            let patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
            let text = obj.subject.display;
            let match = text.match(/Patient Identifier: (\w+)/);
            let identifier = match[1];
            var medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
            if (identifier == patientIdentifierValue) {
                assert.equal(obj.medicationCodeableConcept.text, medicalPrescriptions.drug_name)
                assert.equal(obj.dosageInstruction[0].timing.code.text, medicalPrescriptions.frequency)
                assert.equal(obj.dosageInstruction[0].doseAndRate[0].doseQuantity.value, medicalPrescriptions.dose)
                assert.equal(obj.dosageInstruction[0].doseAndRate[0].doseQuantity.unit, medicalPrescriptions.units)
                assert.equal(obj.dosageInstruction[0].timing.repeat.duration, medicalPrescriptions.duration)
            }
        }

        )
});

step("Validate condition ndjson file", async function () {
    let fileStream = fs.createReadStream('./extracted_data/Condition.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            var diagnosisName = gauge.dataStore.scenarioStore.get("diagnosisName")
            if (diagnosisName === obj.code.text.replace(/\s*\(disorder\)/, '')) {
                assert.ok(obj.code.text.replace(/\s*\(disorder\)/, ''))
                var referenceID = obj.id
                gauge.dataStore.scenarioStore.put("referenceID", referenceID)
            }
        }

        )
});

step("Click on FHIR Export module", async function () {
    await click("FHIR Export");
});

step("Validate condition ndjson file for anonymised data", async function () {
    var referenceID = gauge.dataStore.scenarioStore.get("referenceID")
    const fileStream = fs.createReadStream('./extracted_data/Condition.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            if (obj.id === referenceID) {
                var correlatedId = obj["subject"]["reference"].split("/")[1]
                gauge.dataStore.scenarioStore.put("correlatedId", correlatedId)
                assert.ok(!obj.subject.recordedDate)
                assert.ok(!obj.recorder)
                assert.ok(!obj.encounter)
                const subjectReference = obj.subject.reference;
                assert.ok(!subjectReference.includes('-'))
                let patientReference = obj.subject.reference;
                let actualPatientID = patientReference.split('/').pop();
                validateCorrelatedField(actualPatientID)
            }
        }
        )
});

step("Validate medication ndjson file for anonymised data", async function () {
    var correlatedId = gauge.dataStore.scenarioStore.get("correlatedId")
    const fileStream = fs.createReadStream('./extracted_data/MedicationRequest.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            if (obj["subject"]["reference"].split("/")[1] === correlatedId) {
                assert.ok(!obj.priority)
                assert.ok(!obj.encounter)
                assert.ok(!obj.authoredOn)
                assert.ok(!obj.requester)
                assert.ok(!obj.dosageInstruction)
                const actualPatientID = correlatedId;
                assert.ok(!actualPatientID.includes('-'));
                validateCorrelatedField(actualPatientID)
            }
        }
        )
});

step("Validate patient ndjson file for anonymised data", async function () {
    var correlatedId = gauge.dataStore.scenarioStore.get("correlatedId")
    const fileStream = fs.createReadStream('./extracted_data/Patient.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            if (obj.id === correlatedId) {
                assert.ok(!obj.identifier)
                assert.ok(!obj.address)
                assert.ok(!obj.name)
                assert.ok(!obj.telecom)
                var birth_date = obj["birthDate"]
                var parsed_date = birth_date.split('-')
                var birthData = parsed_date[1]
                var birthMonth = parsed_date[2]
                assert.equal(birthData, "01")
                assert.equal(birthMonth, "01")
                const actualPatientID = obj.id;
                assert.ok(!actualPatientID.includes('-'))
                validateCorrelatedField(actualPatientID)
            }
        }
        )
});

step("Select start date, end date and <FHIRExportType> option to export data", async function (FHIRExportType) {
    let startDate = date.yesterday()
    let endDate = date.today()
    await timeField(toRightOf(text("Start Date"))).select(startDate)
    await timeField(toRightOf(text("End Date"))).select(endDate)
    if (FHIRExportType === "non-anonymised") {
        await click(checkBox(toLeftOf("Anonymise")))
    }
    const zipFilePath = './data.zip';
    const extractionPath = './extracted_data';
    await click($("//aria-hidde[@class='ng-binding']"))
    await waitFor(10000)
    await click($("//button[normalize-space()='Refresh']"))
    await requestResponse.deleteIfExists(zipFilePath);
    await requestResponse.deleteIfExists(extractionPath);
});


step("Download and extract zip file", async function () {
    const requiredFiles = ['Condition.ndjson', 'MedicationRequest.ndjson', 'Patient.ndjson'];
    var downloadDirectory = path.resolve(__dirname, '../data', 'downloaded');
    const extractionPath = './extracted_data';
    fileExtension.removeDir(downloadDirectory);

    await client().send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadDirectory,
    });

    await click($("//tbody/tr[1]/td[7]/a[1]"));
    await waitFor(1000);

    fs.readdir(downloadDirectory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
        } else {
            files.forEach((file) => {
                var originalFileName = file;
                const newFileName = 'data.zip';
                const originalFilePath = path.join(downloadDirectory, originalFileName);
                const newFilePath = path.join(downloadDirectory, newFileName);
                fs.rename(originalFilePath, newFilePath, (renameError) => {
                    if (renameError) {
                        console.error('Error renaming the file:', renameError);
                    } else {
                        const zip = new AdmZip(newFilePath);
                        zip.extractAllTo(extractionPath, true);
                        fs.readdir(extractionPath, (extractionError, extractedFiles) => {
                            if (extractionError) {
                                console.error('Error reading extraction directory:', extractionError);
                            } else {
                                for (const file of requiredFiles) {
                                    if (!extractedFiles.includes(file)) {
                                        console.error(`Required file '${file}' not found.`);
                                    }
                                }
                            }
                        });
                    }
                });
            });
        }
    });
});

step("Validate privilege to export FHIR data with <user> credentials", async function (user) {
    if (user == "doctor") {
        assert.ok(await text("You do not have sufficient privilege to export data").exists())
        assert.ok(await $("//aria-hidde[@class='ng-binding']").isDisabled())
        assert.ok(await $("//button[normalize-space()='Refresh']").isDisabled())
    }
    else if (user == "defaultExporter") {
        assert.ok(await $("//div[@class='note-warning ng-binding']").exists())
        assert.ok(await $("//input[@id='anonymise']").isDisabled())
    }
    else {
        assert.ok(await $("//div[@class='note-warning ng-binding']").exists())
    }
});

async function validateCorrelatedField(actualPatientID) {
    let patientDashboardUrl = gauge.dataStore.scenarioStore.get("patientDashboardUrl");
    const regex = /\/patient\/([^/]+)\//;
    const expectedPatientID = patientDashboardUrl.match(regex);
    assert.notEqual(actualPatientID, expectedPatientID);
}

step("Verify the short name of the procedure setMember in openMRS", async function () {
    let expectedName = gauge.dataStore.scenarioStore.get("clinicalProcedure")
    let actualName = await textBox(toRightOf("Short Name")).value()
    assert.equal(actualName, expectedName)
});

async function getValueAndShortNameFromJsonFile(configurations) {
    for (var configuration of configurations) {
        if (configuration.type === 'Group') {
            await getValueAndShortNameFromJsonFile(configuration.value)
        }
        else if (configuration.type === 'Button') {
            await validateReport(configuration.shortValue, configuration.short_name)
        }
        else if (configuration.type === 'DropDown') {
            await validateReport(configuration.value, configuration.short_name)
        }
        else {
            await validateReport(configuration.value, configuration.short_name)
        }
    }

}

async function validateReport(value, name) {
    var patientIdentifier = gauge.dataStore.scenarioStore.get("patientIdentifier")
    var headerPos = await taikoHelper.returnHeaderPos(name)
    var actual = await ($("//TD[normalize-space()='" + patientIdentifier + "']/../TD[" + headerPos + "]")).text()
    var expected = value
    assert.equal(actual, expected);
}

step("Search Body Site name", async function () {
    var procedureTitle = gauge.dataStore.scenarioStore.get("procedureTitle")
    var procedureName = gauge.dataStore.scenarioStore.get("procedureName")
    await write(procedureTitle, into(textBox(below("Find Concept(s)"))));
    await click(button("Search"));
    await click(procedureName)

});

step("Click on Procedure name", async function () {
    var clinicalProcedure = gauge.dataStore.scenarioStore.get("clinicalProcedure")
    await click(clinicalProcedure)

});

step("Click on Edit", async function () {
    await click($("//a[@id='editConcept']"));
});