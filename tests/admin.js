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
} = require('taiko');

const path = require('path');
var assert = require("assert");
var taikoHelper = require("./util/taikoHelper");
var users = require("./util/users");
const csvConfig = require("./util/csvConfig");
const fs = require('fs');
var date = require("./util/date");
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

step("Hit the endpoint", async function () {
    let taskLink = await requestResponse.createFHIRExport();
    console.log(taskLink);
    let urlToDownloadFile = await requestResponse.getURLToDownloadNDJSONFile(taskLink);
    console.log(urlToDownloadFile);
    await requestResponse.downloadFiles(urlToDownloadFile);
    //await requestResponse.downloadAndExtractZipFile(urlToDownloadFile);

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
    var data = fs.readFileSync(path.resolve('./extracted/Patient.ndjson'), 'utf8');
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    console.log(patientIdentifierValue)
    //console.log(data)
    const lines = data.split('\n');
    console.log(`Found ${lines.length} lines.`);
    for (const line of lines) {
        console.log("line  "+line)
        // if(!line.trim() )
        // {
        //     continue;
        // }
        let json = JSON.parse(line);
        console.log(json);
        if (json.identifier[0].value === 'GAN203017') {
            console.log("json  "+json)
            switch (anonymised) {
                case 'redacted':
                    validateJSON(json)
                    break;
                case 'Fixed':
                    assert.ok(!json.name)
                    assert.ok(!json.telecom)
                    assert.ok(!json.address)
                    assert.ok(!json.address)
                    assert.ok(json.identifier[1])
                    console.log("done")
                    break;
                default:
                    console.log("default")
                    break;

            }
        }
    
    }
});



step("Validate condition ndjson file for <anonymised> data", async function (anonymised) {
    var data = fs.readFileSync(path.resolve('./extracted/Condition.ndjson'), 'utf8');
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    //console.log(data)
    const lines = data.split('\n');
    console.log(`Found ${lines.length} lines.`);
    for (const line of lines) {
        const json = JSON.parse(line);
        console.log(json.subject.display.split(":", [1]))
        if (json.subject.display.split(":", [1]) === patientIdentifierValue) {
            switch (anonymised) {
                case 'Redacted':
                    console.log(json);
                    assert.ok(!json.subject.recordedDate)
                    assert.ok(!json.recorder)
                    console.log("done")
                    break;
                default:
                    break;

            }
        }
        break;
    }
});
step("Validate medication ndjson file for <anonymised> data", async function (anonymised) {
    var data = fs.readFileSync(path.resolve('./extracted/Condition.ndjson'), 'utf8');
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    //console.log(data)
    const lines = data.split('\n');
    console.log(`Found ${lines.length} lines.`);
    for (const line of lines) {
        const json = JSON.parse(line);
        console.log(json.subject.display.split(":", [1]))
        if (json.subject.display.split(":", [1]) === patientIdentifierValue) {
            switch (anonymised) {
                case 'Redacted':
                    console.log(json);
                    assert.ok(!json.priority)
                    assert.ok(!json.encounter)
                    assert.ok(!json.recorder)
                    assert.ok(!json.authoredOn)
                    assert.ok(!json.requester)
                    assert.ok(!json.dosageInstruction)
                    console.log("done")
                    break;
                default:
                    break;

            }
        }
        break;
    }
});

async function validateJSON(json) {
    console.log(json.identifier[0].value )
    assert.ok(!json.name)
    assert.ok(!json.telecom)
    assert.ok(!json.address)
    assert.ok(!json.address)
    assert.ok(!json.identifier[1])
    console.log("done")
}