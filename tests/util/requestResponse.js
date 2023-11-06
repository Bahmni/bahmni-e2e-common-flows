const {
    waitFor,
} = require('taiko');
const path = require('path');
const axios = require('axios')
const Module = require('module');
//require("../../data")
var date = require("./date");
const assert = require("assert");
const zlib = require('zlib');
const unzipper = require('unzipper');
var users = require("./users");
const { url } = require('inspector');
const fs = require('fs').promises;
const yauzl = require('yauzl');
const readline = require('readline');
const { createReadStream } = require('fs');
const endpoints = require('./../../../tests/API/constants/apiConstants').endpoints;
const fileExtension = require("./fileExtension")
const AdmZip = require('adm-zip');

async function getOpenMRSResponse(request) {
    console.log(request)
    gauge.message(request)

    return await axios.get(request
        , {
            headers: {
                'Authorization': `token ${process.env.receptionist}`
            }
        })
}

async function makeOpenVisitCall(patientUUID, visitType, URL) {
    var yesterday = date.getyyyymmddFormattedDate(date.yesterday())
    var tomorrow = date.getyyyymmddFormattedDate(date.tomorrow())

    var request_URL = process.env.bahmniHost + URL
        .replace("<patientId>", patientUUID)
        .replace("<fromDate>", yesterday)
        .replace("<toDate>", tomorrow)
        .replace("<visitType>", visitType)

    console.log(request_URL)
    gauge.message(request_URL)
    var prescriptionsVisitResponse = await getOpenMRSResponse(request_URL)

    assert.ok(prescriptionsVisitResponse.status == 200)
    gauge.message(prescriptionsVisitResponse.data);
    gauge.message(prescriptionsVisitResponse.headers);
    gauge.message(prescriptionsVisitResponse.config);

    return prescriptionsVisitResponse.data;
}

async function makeOpenProgramCall(patientUUID, programName, programEnrollmentId, URL) {
    var yesterday = date.getyyyymmddFormattedDate(date.yesterday())
    var tomorrow = date.getyyyymmddFormattedDate(date.tomorrow())

    var request_URL = process.env.bahmniHost + URL
        .replace("<patientId>", patientUUID)
        .replace("<fromDate>", yesterday)
        .replace("<toDate>", tomorrow)
        .replace("<programName>", programName)
        .replace("<programEnrollmentId>", programEnrollmentId)

    console.log(request_URL)
    gauge.message(request_URL)
    var prescriptionsVisitResponse = await getOpenMRSResponse(request_URL)

    assert.ok(prescriptionsVisitResponse.status == 200)

    gauge.message(prescriptionsVisitResponse.data);
    gauge.message(prescriptionsVisitResponse.headers);
    gauge.message(prescriptionsVisitResponse.config);

    return prescriptionsVisitResponse.data;
}

async function setRoles() {
    await updateRoles(users.getUserNameFromEncoding(process.env.receptionist), process.env.receptionist_roles)
    await updateRoles(users.getUserNameFromEncoding(process.env.doctor), process.env.doctor_roles)
}

async function updateRoles(username, strRoles) {
    var userData = await axios({
        url: process.env.bahmniHost + process.env.getUser.replace("<userName>", username),
        method: 'get',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    userset = userData.data.results.filter(users => users.username == username);
    assert.equal(userset.length, 1, "Prerequisite Failed - User not Found. User: " + username)

    userUUID = userset[0].uuid;

    listRoles = strRoles.split(",");

    var rolesData = await axios({
        url: process.env.bahmniHost + process.env.getRoles,
        method: 'get',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });

    let body = {};
    var arrRoles = [];
    listRoles = strRoles.split(",");
    for (role of listRoles) {
        fileteredRoles = rolesData.data.results.filter(roles => roles.name == role)
        assert.equal(fileteredRoles.length, 1, "Prerequisite Failed - Role not Found. Role: " + role)
        arrRoles.push({ "uuid": fileteredRoles[0].uuid });
    }
    body.roles = arrRoles;
    let updateUser = await axios({
        url: process.env.bahmniHost + process.env.updateUser.replace("<userUUID>", userUUID),
        method: 'post',
        data: body,
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    assert.equal(updateUser.status, 200, "Prerequisite Failed - User Role not updated")
}

async function checkDiagnosisInOpenmrs(diagnosisName) {
    var response = await axios({
        url: process.env.bahmniHost + endpoints.DIAGNOSIS_SEARCH,
        params: {
            q: diagnosisName,
        },
        method: 'get',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    var resultLength = response.data.results.length
    if (resultLength === 0) {
        return false;
    }
    else {
        return true;
    }
}
async function getSnomedDiagnosisDataFromAPI(snomedCode) {
    var response = await axios({
        url: endpoints.SNOWSTORM_URL,

        params: {
            url: endpoints.ECL_QUERY + snomedCode,
        },
        method: 'get',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    var jsonData = response.data
    return jsonData;

}
async function checkCdssIsEnabled() {
    var response = await axios({
        url: process.env.bahmniHost + endpoints.CDSS_ENABLE_URL,
        method: 'get',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    var jsonData = response.data
    return jsonData;

}

async function createFHIRExport(isAnonymised) {
   const  url= process.env.bahmniHost + endpoints.FHIR_EXPORT;
    //const url = "https://dev.snomed.mybahmni.in/openmrs/ws/rest/v1/fhirexport";

    const headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${isAnonymised ? process.env.defaultExporter : process.env.plainExporter}`
    };

    const config = {
        url: isAnonymised ? url : `${url}?anonymise=false`,
        method: 'post',
        headers: headers
    };

    try {
        let response = await axios(config);
        return response.data.link;
    } catch (error) {
        console.error('Error creating FHIR export:', error);
        throw error;
    }
}

async function getURLToDownloadNDJSONFile(taskLink) {
    var status = "";
    while (true) {
        let response = await axios({
            url: taskLink.replace("http", "https"),
            method: 'get',
            headers: {
                'accept': `application/json`,
                'Content-Type': `application/json`,
                'Authorization': `Basic ${process.env.plainExporter}`
            }
        });
        //console.log(response.data);
        var jsonData = response.data
        status = jsonData.status
        if (status == "completed" || status == "rejected") {
            //console.log("output " + jsonData.output[0].valueString)
            break;
        }
        await waitFor(2000);
    }
    return jsonData.output[0].valueString;
}


async function downloadAndProcessData(apiUrl) {
    const zipFilePath = './data.zip';
    const extractionPath = './extracted_data';
    const requiredFiles = ['Condition.ndjson', 'MedicationRequest.ndjson', 'Patient.ndjson'];
    await deleteIfExists(zipFilePath);
    await deleteIfExists(extractionPath);
    const response = await axios({
        url: apiUrl.replace("http", "https"),
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
            'Authorization': `Basic ${process.env.admin}`
        },
    });

    await fs.writeFile(zipFilePath, Buffer.from(response.data, 'binary'));

    //console.log('ZIP file downloaded successfully.');
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(extractionPath, true);

   // console.log('ZIP file extracted successfully.');
    try {
        const extractedFiles = await fs.readdir(extractionPath);
        for (const file of requiredFiles) {
            if (!extractedFiles.includes(file)) {
                console.error(`Required file '${file}' not found.`);
            } else {
                console.log(`Found file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error reading extraction directory:', error);
    }
}


async function deleteIfExists(path) {
    try {
        await fs.access(path);
        const stats = await fs.stat(path);

        if (stats.isDirectory()) {
            await fs.rmdir(path, { recursive: true });
        } else {
            await fs.unlink(path);
        }

        console.log(`${path} deleted successfully.`);
    } catch (error) {
    }
}





module.exports = {
    getOpenMRSResponse: getOpenMRSResponse,
    makeOpenVisitCall: makeOpenVisitCall,
    makeOpenProgramCall: makeOpenProgramCall,
    setRoles: setRoles,
    checkDiagnosisInOpenmrs: checkDiagnosisInOpenmrs,
    getSnomedDiagnosisDataFromAPI: getSnomedDiagnosisDataFromAPI,
    checkCdssIsEnabled: checkCdssIsEnabled,
    getURLToDownloadNDJSONFile: getURLToDownloadNDJSONFile,
    downloadAndProcessData: downloadAndProcessData,
    createFHIRExport:createFHIRExport,
    deleteIfExists:deleteIfExists
}

