const { button, toRightOf, textBox, into, write, press, click, timeField, below, scrollTo, text, evaluate, $, checkBox, waitFor, image, within } = require('taiko');
var date = require("./date");
var assert = require("assert")
var fileExtension = require("../util/fileExtension")

async function repeatUntilEnabled(element) {
    var isDisabled = true;
    do {
        isDisabled = await element.isDisabled()
    } while (!isDisabled)
}

async function repeatUntilFound(element) {
    var isFound = false;
    do {
        isFound = await element.exists()
    } while (!isFound)
}

async function repeatUntilNotVisible(element) {
    var isFound = true;
    do {
        try {
            if (await element.exists()) {
                isFound = await element.isVisible()
            }
            else {
                isFound = false;
            }
        }
        catch (e) { isFound = false; }
    } while (isFound)
}

async function verifyConfigurations(configurations, observationFormName) {
    for (var configuration of configurations) {
        switch (configuration.type) {
            case 'Group':
                await verifyConfigurations(configuration.value, observationFormName)
                break;
            default:
                if (configuration.label != "Date of Sample Collection")
                    assert.ok(await text(configuration.value, toRightOf(configuration.label)).exists())
                break;
        }
    }
}

function getDate(dateValue) {
    if (dateValue == 'Today')
        return date.today();
    else {
        dateLessThan = dateValue.split("-");
        if (dateLessThan.length > 1) {
            return date.getDateAgo(dateLessThan[1]);
        }
    }
    throw "Unexpected date"
}

async function selectEntriesTillIterationEnds(entrySequence) {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier" + (entrySequence));
    await write(patientIdentifierValue)
    await press('Enter', { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    await repeatUntilNotVisible($("#overlay"));
}


async function executeConfigurations(configurations, observationFormName) {
    for (var configuration of configurations) {
        switch (configuration.type) {
            case 'Group':
                await executeConfigurations(configuration.value, observationFormName)
                break;
            case 'TextArea':
                await write(configuration.value, into($("//textarea", toRightOf(configuration.label))))
                break;
            case 'TextBox':
                if (configuration.unit === undefined)
                    await write(configuration.value, into(textBox(toRightOf(configuration.label))))
                else
                    await write(configuration.value, into(textBox(toRightOf(configuration.label + " " + configuration.unit))))
                break;
            case 'Button':
                await scrollTo(text(observationFormName))
                await click(button(configuration.value), toRightOf(configuration.label))
                break;
            case 'Date':
                var dateValue = getDate(configuration.value)
                await timeField({ type: "date" }, toRightOf(configuration.label)).select(dateValue);
                break;
            case 'DropDown':
                await write(configuration.value, into(textBox(toRightOf(configuration.label))))
                await click($("//div[@role='option' and text()='" + configuration.value + "']"));
                break;
            default:
                console.log("Unhandled " + configuration.label + ":" + configuration.value)
        }
    }
}

async function getSnomedCodeFromSnomedName(diagnosisName) {
    var snomedCodeFile = `./bahmni-e2e-common-flows/data/consultation/diagnosis/snomedCode.json`;
    var diagnosisData = JSON.parse(fileExtension.parseContent(snomedCodeFile))
    var snomedNameCodeMapping = diagnosisData.snomedNameCodeMapping
    for (var data of snomedNameCodeMapping) {
        if (data.diagnosis_name == diagnosisName) {
            return data.diagnosis_code;
        }
    }

}
async function getContraindicativeDrugFromSnomedDiagnosisName(diagnosisName) {
    var snomedCodeFile = `./bahmni-e2e-common-flows/data/consultation/diagnosis/snomedCode.json`;
    var diagnosisData = JSON.parse(fileExtension.parseContent(snomedCodeFile))
    var snomedNameCodeMapping = diagnosisData.snomedNameCodeMapping
    for (var data of snomedNameCodeMapping) {
        if (data.diagnosis_name == diagnosisName) {
            return data.contraindication_drug;
        }
    }
}
async function generateRandomDiagnosis(jsonData) {
    const snomedDiagnosesArray = jsonData.expansion.contains
    const randomIndex = Math.floor(Math.random() * snomedDiagnosesArray.length);
    const diagnosisData = snomedDiagnosesArray[randomIndex];

    const diagnosisCode = diagnosisData.code;
    gauge.dataStore.scenarioStore.put("diagnosisCode", diagnosisCode)
    const diagnosisName = diagnosisData.display;
    gauge.dataStore.scenarioStore.put("diagnosisName", diagnosisName)
    return diagnosisName;

}

async function returnHeaderPos(columnHeader) {
    var tableHeaders = await $("//TD[normalize-space()='" + columnHeader + "']//..//TD").elements();
    var countPos = 0;
    for (var i = 0; i < tableHeaders.length - 1; i++) {
        if ((await tableHeaders[i].text()).trim() == columnHeader) {
            countPos = i + 1;
            return countPos;
        }
    }
}

async function validateFormFromFile(configurations) {
    for (var configuration of configurations) {
        var label = configuration.label
        if (configuration.short_name !== undefined)
            label = configuration.short_name.trim();
        var value = configuration.value
        if (configuration.value_view !== undefined)
            value = configuration.value_view.trim();
        switch (configuration.type) {
            case 'Group':
                await validateFormFromFile(value)
                break;
            case 'Date':
                var dateFormatted = date.addDaysAndReturnDateInShortFormat(value)
                assert.ok(await $(`//LABEL[contains(normalize-space(), "${label}")]/../following-sibling::SPAN/*[normalize-space() = "${dateFormatted}"]`).exists(), dateFormatted + " To Right of " + label + " is not exist.")
                break;
            default:
                assert.ok(await $(`//LABEL[contains(normalize-space(), "${label}")]/../following-sibling::SPAN/*[normalize-space() = "${value}"]`).exists(), value + " To Right of " + label + " is not exist.")
        }
    }
}



module.exports = {
    selectEntriesTillIterationEnds: selectEntriesTillIterationEnds,
    verifyConfigurations: verifyConfigurations,
    executeConfigurations: executeConfigurations,
    repeatUntilNotFound: repeatUntilNotVisible,
    repeatUntilFound: repeatUntilFound,
    repeatUntilEnabled: repeatUntilEnabled,
    getSnomedCodeFromSnomedName: getSnomedCodeFromSnomedName,
    getContraindicativeDrugFromSnomedDiagnosisName: getContraindicativeDrugFromSnomedDiagnosisName,
    generateRandomDiagnosis: generateRandomDiagnosis,
    returnHeaderPos: returnHeaderPos,
    validateFormFromFile: validateFormFromFile
}