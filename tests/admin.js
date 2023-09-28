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
    closeTab,
    checkBox,
    textBox,
    toLeftOf,
    alert,
    $,
    text,
    attach,
    evaluate,
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
} = require('taiko');

const path = require('path');
var assert = require("assert");
var taikoHelper = require("./util/taikoHelper");
var users = require("./util/users");
const csvConfig = require("./util/csvConfig");
const fs = require('fs');
var date = require("./util/date");
const ndjson = require('ndjson')
var fileExtension = require("./util/fileExtension");
const requestResponse = require('./util/requestResponse');
const endpoints = require('./../../tests/API/constants/apiConstants').endpoints;



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

step("put formname <formName>", async function (formName) {
    gauge.dataStore.scenarioStore.put("FormName", formName)
});

step("edit form <formName>", async function (formName) {
    await click(link(toRightOf(formName)))
});

step("create obs <obsName> <properties>", async function (obsName, properties) {
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

step("create obs group <obsName>", async function (obsName) {
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

step("Enter form name as <formName>", async function (formName) {
    gauge.dataStore.scenarioStore.put("FormName", formName)
    await write(formName, into(textBox(below("Form Name"))));
});

step("Edit form name", async function () {
    var formName = gauge.dataStore.scenarioStore.get("FormName")
    await click(link(toRightOf(formName)))
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

step("Click on Manage Forms", async function () {
    await click("Manage Forms");
});

step("Open the form created through form builder", async function () {
    var formName = gauge.dataStore.scenarioStore.get("FormName")
    await click(formName)
});

step("Click on delete form", async function () {
    confirm('Are you sure you want to delete this entire form AND schema?', async () => await accept());
    await click($("//input[@value='Delete Form']"))
});

step("Validate the report generated for Snomed form builder form Report <observationFormFile>", async function (observationFormFile) {
    var observationFormValues = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/${observationFormFile}.json`))
    await getValueAndShortNameFromJsonFile(observationFormValues.ObservationFormDetails)
    await closeTab();
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
            await validateReport(configuration.fullValue, configuration.short_name)
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

step("Invoke endpoint for anonymised export", async function () {
    await waitFor(5000)
    let taskLink = await requestResponse.createFHIRExportForAnonymisedData();
    console.log(taskLink);
    let urlToDownloadFile = await requestResponse.getURLToDownloadNDJSONFile(taskLink);
    console.log(urlToDownloadFile);
    await requestResponse.downloadAndProcessData(urlToDownloadFile);
    //await requestResponse.downloadAndExtractZipFile(urlToDownloadFile);
    //let taskLink = await requestResponse.createFHIRExportForNonAnonymisedData();
    // console.log(taskLink);
    //let urlToDownloadFile = await requestResponse.getURLToDownloadNDJSONFile(taskLink);
    //console.log(urlToDownloadFile);
    //await requestResponse.downloadAndProcessData(urlToDownloadFile);

});

step("Validate files", async function () {
    var data = fs.readFileSync(path.resolve('./extracted/Patient.ndjson'), 'utf8');
    //console.log(data)
    const lines = data.split('\n');
    console.log(`Found ${lines.length} lines.`);
    for (const line of lines) {
        const json = JSON.parse(line);
        if (json.identifier[0].value === 'GAN203006') {
            console.log(json);
            assert.ok(!json.name)
            assert.ok(!json.telecom)
            assert.ok(!json.address)
            console.log("done")
        }
    }
});

step("Validate patient ndjson file for <anonymised> data", async function (anonymised) {
    //var data = fs.readFileSync(path.resolve('./extracted/Patient.ndjson'), 'utf8');
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    var city = gauge.dataStore.scenarioStore.get("village")
    var mobileNumber = gauge.dataStore.scenarioStore.get("patientMobileNumber")
    //console.log("PI  " + patientIdentifierValue)
    await waitFor(5000)
    const fileStream = fs.createReadStream('./extracted_data/Patient.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            console.log(obj.identifier[0].value);
            if (obj.identifier[0].value === patientIdentifierValue) {
                console.log("obj " + obj.id);
                console.log("obj is " + obj);
                console.log("obj " + obj.id)
                switch (anonymised) {
                    case 'Redacted':
                        console.log("outside")
                        assert.ok(!obj.name)
                        assert.ok(!obj.telecom)
                        assert.ok(!obj.address)
                        console.log("done patient redact")
                        break;
                    case 'Randomized':
                        //assert.equal(!obj.address[0].city,city)
                        //assert.equal(!obj.telecom[0].value,mobileNumber)
                        assert.notEqual(obj.address[0].city, city)
                        assert.notEqual(obj.telecom[0].value, mobileNumber)
                        console.log("done patient randomize")
                    case 'Fixed':
                    case 'Correlated':
                    default:
                        break;

                }
            }
        }
        )
})




step("Validate condition ndjson file for <anonymised> data", async function (anonymised) {
    await waitFor(5000)
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    let currentUrl = gauge.dataStore.scenarioStore.get("currentPageUrl");
    const fileStream = fs.createReadStream('./extracted_data/Condition.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            //const json = JSON.parse(line);

            // let text = obj.subject.display;
            // let match = text.match(/Patient Identifier: (\w+)/);
            // let identifier = match[1];
            // console.log(identifier);
            var diagnosisNameExpected = gauge.dataStore.scenarioStore.get("diagnosisName")
            console.log("asd  " + diagnosisNameExpected)
            //console.log("as  "+obj.code.text)
            //var diagnosisNameExpected ="Uncomplicated asthma"
            var diagnosisNameActual = obj.code.text.replace(/\([^)]*\)/g, '')
            console.log("as  " + diagnosisNameActual)
            if (diagnosisNameExpected.trim() === diagnosisNameActual.trim()) {
                switch (anonymised) {
                    case 'Redacted':
                        console.log(obj);
                        assert.ok(!obj.subject.recordedDate)
                        assert.ok(!obj.recorder)
                        console.log("done condition redact")
                        break;
                    case 'Randomized':
                        break;
                    case 'Fixed':
                        break;
                    case 'Correlated':
                        const subjectReference = obj.subject.reference;
                        console.log("subjectReference " + subjectReference)
                        assert.ok(!subjectReference.includes('-'))
                        const regex = /\/patient\/([^/]+)\//;
                        const expectedPatientID = currentUrl.match(regex);
                        let patientReference = obj.subject.reference;
                        let actualPatientID = patientReference.split('/').pop();
                        assert.notEqual(actualPatientID, expectedPatientID);
                        console.log("done condition correlate")
                        //assert.ok(obj.subject.reference.split("/"),[1])
                        break;
                    default:
                        break;

                }
            }
        }
        )
});
step("Validate medication ndjson file for <anonymised> data", async function (anonymised) {
    await waitFor(7000)
    const fileStream = fs.createReadStream('./extracted_data/MedicationRequest.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            let patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
            let currentUrl = gauge.dataStore.scenarioStore.get("currentPageUrl");
            let text = obj.subject.display;
            console.log("text " + text) 
            let match = text.match(/Patient Identifier: (\w+)/);
            console.log("match " + match)
            let identifier = match[1];
            console.log(identifier);
            if (identifier == patientIdentifierValue) {
                switch (anonymised) {
                    case 'Redacted':
                        console.log("inside medication");
                        assert.ok(!obj.priority)
                        assert.ok(!obj.encounter)
                        assert.ok(!obj.recorder)
                        assert.ok(!obj.authoredOn)
                        assert.ok(!obj.requester)
                        assert.ok(!obj.dosageInstruction)
                        console.log("done medication redact for anonymised")
                        break;
                    case 'Randomized':
                        break;
                    case 'Fixed':
                        break;
                    case 'Correlated':
                        const subjectReference = obj.subject.reference;
                        assert.ok(!subjectReference.includes('-'))
                        const regex = /\/patient\/([^/]+)\//;
                        const expectedPatientID = currentUrl.match(regex);
                        console.log("expectedPatientID " + expectedPatientID)
                        const actualPatientID = obj.subject.reference.split('/').pop();
                        console.log("actualPatientID " + actualPatientID)
                        assert.notEqual(actualPatientID, expectedPatientID);
                        console.log("done medication correlate")
                        break;
                    default:
                        break;

                }
            }
        }
        )
});


step("Open Settings", async function () {
    await click($("//a[@href='/openmrs/admin/maintenance/settings.list']"));
});


step("Click on fhir global properties and add config path for <anonymisedType> method", async function (anonymisedType) {
    await click($("//a[normalize-space()='Fhir']"));
    await clear($("//textarea[@id='settings0.globalProperty.propertyValue']"), { waitForNavigation: false, navigationTimeout: 3000 })
    switch (anonymisedType) {
        case 'Redact':
            await write("/openmrs/data/fhir-export-anonymise-config.json", into($("//textarea[@id='settings0.globalProperty.propertyValue']")));
            break;
        case 'Random':
            await write("/openmrs/data/fhir-export-anonymise-random-config.json", into($("//textarea[@id='settings0.globalProperty.propertyValue']")));
            break;
        case 'Fixed':
            await write("/openmrs/data/fhir-export-anonymise-fixed-config.json", into($("//textarea[@id='settings0.globalProperty.propertyValue']")));
            break;
        case 'Correlate':
            await write("/openmrs/data/fhir-export-anonymise-correlate-config.json", into($("//textarea[@id='settings0.globalProperty.propertyValue']")));
            break;
    }
    await click($("//input[@value='Save']"));
});

step("Hit the endpoint for non-anonymised data", async function () {
    await waitFor(5000)

    // const zipFilePath = await requestResponse.downloadZipFile('https://dev.snomed.mybahmni.in/openmrs/ws/rest/v1/fhirExtension/export?file=12972d2d-9413-4808-b71f-41c10132e0f4');
    // const jsonObjects = await requestResponse.unzipAndParseNdjsonFile(zipFilePath);
    // console.log(jsonObjects);
    // await waitFor(5000)
    let taskLink = await requestResponse.createFHIRExportForNonAnonymisedData();
    console.log(taskLink);
    let urlToDownloadFile = await requestResponse.getURLToDownloadNDJSONFile(taskLink);
    console.log(urlToDownloadFile);
    await requestResponse.downloadAndProcessData(urlToDownloadFile);
    //  await requestResponse.downloadFiles(urlToDownloadFile);
    //await requestResponse.downloadUnzipAndParseNDJSON('https://dev.snomed.mybahmni.in/openmrs/ws/rest/v1/fhirExtension/export?file=33ebde30-5043-4c91-823c-7dd48cdcc5ab')
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
    //var nationalID=gauge.dataStore.scenarioStore.get("patientNationalID")
    //console.log("PI  " + patientIdentifierValue)
    await waitFor(5000)
    const fileStream = fs.createReadStream('./extracted_data/Patient.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            if (obj.identifier[0].value === patientIdentifierValue) {
                //console.log("outside")
                assert.equal(obj.name[0].given[0], firstName)
                assert.equal(obj.name[0].given[1], middleName)
                assert.equal(obj.name[0].family, lastName)
                assert.equal(obj.gender, gender.toLowerCase())
                assert.equal(obj.birthDate, birthYear)
                assert.equal(obj.address[0].city, city)
                assert.equal(obj.telecom[0].value, mobileNumber)
                console.log("done patient non anonymised")
                //assert.equal(obj.identifier.find(id => id.type.text === "National ID").value,nationalID)
                // const subjectReference = obj.subject.reference;
                // assert.ok(subjectReference.includes('-'));

            }
        }
        )
});

step("Validate medication ndjson file", async function () {
    await waitFor(5000)

    // fs.createReadStream("download.zip")
    //     .pipe(unzipper.Extract({ path: outputDirectory }))
    let fileStream = fs.createReadStream('./extracted_data/MedicationRequest.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            let patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
            let text = obj.subject.display;
            let match = text.match(/Patient Identifier: (\w+)/);
            let identifier = match[1];
            console.log(identifier);
            var medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
            if (identifier == patientIdentifierValue) {
                console.log("inside medication");
                assert.equal(obj.medicationCodeableConcept.text, gauge.dataStore.scenarioStore.get("drugName"))
                assert.equal(obj.dosageInstruction[0].timing.code.text, medicalPrescriptions.frequency)
                assert.equal(obj.dosageInstruction[0].doseAndRate[0].doseQuantity.value, medicalPrescriptions.dose)
                assert.equal(obj.dosageInstruction[0].doseAndRate[0].doseQuantity.unit, medicalPrescriptions.units)
                assert.equal(obj.dosageInstruction[0].timing.repeat.duration, medicalPrescriptions.duration)
                // assert.ok(obj.requester)
                // assert.ok(obj.dosageInstruction)
                console.log("done medication non anonymised")
                // const subjectReference = obj.subject.reference;
                // assert.ok(subjectReference.includes('-'));
            }
        }

        )
});

step("Validate condition ndjson file", async function () {
    await waitFor(5000)
    //var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    let fileStream = fs.createReadStream('./extracted_data/Condition.ndjson');
    fileStream
        .pipe(ndjson.parse())
        .on('data', function (obj) {
            //console.log(obj.code.text)
            var diagnosisName = gauge.dataStore.scenarioStore.get("diagnosisName")
            if (diagnosisName === obj.code.text) {
                assert.ok(obj.code.text)
            }
        }

        )
});

step("Invoke endpoint for non-anonymised export", async function () {
    await waitFor(5000)
    const currentPageUrl = await evaluate(() => window.location.href);
    console.log("dfg " + currentPageUrl);
    gauge.dataStore.scenarioStore.put("currentPageUrl", currentPageUrl)
    let taskLink = await requestResponse.createFHIRExportForNonAnonymisedData();
    console.log(taskLink);
    let urlToDownloadFile = await requestResponse.getURLToDownloadNDJSONFile(taskLink);
    console.log(urlToDownloadFile);
    await requestResponse.downloadAndProcessData(urlToDownloadFile);
});