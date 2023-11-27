const {
    waitFor,
} = require('taiko');const path = require('path');
const axios = require('axios')
var date = require("./date");
const assert = require("assert");
const zlib = require('zlib');
const unzipper = require('unzipper');
var users = require("./users");
const uuid = require('uuid');
const { url } = require('inspector');
const fs = require('fs').promises;
const yauzl = require('yauzl');
const readline = require('readline');
const { createReadStream } = require('fs');
const endpoints = require('../snomedEndpoints').endpoints;
const fileExtension = require("./fileExtension")
const AdmZip = require('adm-zip');

async function getOpenMRSResponse(request){
    console.log(request)
    gauge.message(request)

    return await axios.get(request
        , {
            headers: {
                'Authorization': `token ${process.env.receptionist}`
            }
        })
}

async function makeOpenVisitCall(patientUUID,visitType,URL){
    var yesterday = date.getyyyymmddFormattedDate(date.yesterday())
    var tomorrow = date.getyyyymmddFormattedDate(date.tomorrow())

    var request_URL = process.env.bahmniHost+URL
        .replace("<patientId>",patientUUID)
        .replace("<fromDate>",yesterday)
        .replace("<toDate>",tomorrow)
        .replace("<visitType>",visitType)

    console.log(request_URL)
    gauge.message(request_URL)
    var prescriptionsVisitResponse = await getOpenMRSResponse(request_URL)

    assert.ok(prescriptionsVisitResponse.status==200)
    gauge.message(prescriptionsVisitResponse.data);
    gauge.message(prescriptionsVisitResponse.headers);
    gauge.message(prescriptionsVisitResponse.config);

    return prescriptionsVisitResponse.data;
}

async function makeOpenProgramCall(patientUUID,programName,programEnrollmentId,URL){
    var yesterday = date.getyyyymmddFormattedDate(date.yesterday())
    var tomorrow = date.getyyyymmddFormattedDate(date.tomorrow())

    var request_URL = process.env.bahmniHost+URL
        .replace("<patientId>",patientUUID)
        .replace("<fromDate>",yesterday)
        .replace("<toDate>",tomorrow)
        .replace("<programName>",programName)
        .replace("<programEnrollmentId>",programEnrollmentId)

    console.log(request_URL)
    gauge.message(request_URL)
    var prescriptionsVisitResponse = await getOpenMRSResponse(request_URL)

    assert.ok(prescriptionsVisitResponse.status==200)

    gauge.message(prescriptionsVisitResponse.data);
    gauge.message(prescriptionsVisitResponse.headers);
    gauge.message(prescriptionsVisitResponse.config);

    return prescriptionsVisitResponse.data;
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

async function getProcedureDataFromValuesetURL() {
    var response = await axios({
        url: endpoints.SNOWSTORM_URL.split('$')[0],
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

async function uploadProcedureOrders(procedureOrders) {
    let response = await axios({
        url: `${process.env.bahmniHost}${endpoints.PROCEDURE_ORDERS}`,
        params: {
            valueSetId: procedureOrders,
            locale: "en",
            conceptClass: "Procedure",
            conceptDatatype: "N/A",
            contextRoot: "Procedure Orders",
        },
        method: 'post',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    var taskLink = response.data
    return taskLink;
}
async function checkStatusForProcedure(endpoint) {
    var status = ""
    while (true) {
        var response = await axios({
            url: endpoint.replace("http", "https"),
            method: 'get',
            headers: {
                'accept': `application/json`,
                'Content-Type': `application/json`,
                'Authorization': `Basic ${process.env.admin}`
            }
        });

        var jsonData = response.data
        status = jsonData.status
        if (status == "completed" || status == "rejected") {
            break;
        }
        await waitFor(2000)
    }

    return status;

}

async function createValueSet(jsonFile) {
    var randomUUID = uuid.v4();
    jsonFile.id = `bahmni-procedures-head${randomUUID}`;
    jsonFile.name = `bahmni-procedures-head${randomUUID}`;
    jsonFile.title = `head-procedure-automation`;
    jsonFile.url = `${endpoints.VALUESET_URL_PROCEDURE}${randomUUID}`;
    var body = jsonFile;
    let response = await axios({
        url: endpoints.SNOWSTORM_URL.split('$')[0],
        method: 'post',
        data: body,
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`
        }
    });
    return jsonFile;
}

async function getIDFromProcedureValueset(procedureUrl) {
    var response = await axios({
        url: endpoints.SNOWSTORM_URL,
        params: {
            url: procedureUrl,
        },
        method: 'get',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    var jsonData = response.data.id
    return jsonData;

}
async function deleteProcedureValueset(procedureID) {
    var response = await axios({
        url: endpoints.SNOWSTORM_URL.split('$')[0] + procedureID,
        method: 'delete',
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
 
     const zip = new AdmZip(zipFilePath);
     zip.extractAllTo(extractionPath, true);
     try {
         const extractedFiles = await fs.readdir(extractionPath);
         for (const file of requiredFiles) {
             if (!extractedFiles.includes(file)) {
                 console.error(`Required file '${file}' not found.`);
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
     } catch (error) {
     }
 } 

module.exports = {
    getOpenMRSResponse: getOpenMRSResponse,
    makeOpenVisitCall: makeOpenVisitCall,
    makeOpenProgramCall: makeOpenProgramCall,
    checkCdssIsEnabled: checkCdssIsEnabled,
    checkDiagnosisInOpenmrs: checkDiagnosisInOpenmrs,
    getSnomedDiagnosisDataFromAPI: getSnomedDiagnosisDataFromAPI,
    getProcedureDataFromValuesetURL: getProcedureDataFromValuesetURL,
    uploadProcedureOrders: uploadProcedureOrders,
    checkStatusForProcedure: checkStatusForProcedure,
    createValueSet: createValueSet,
    getIDFromProcedureValueset: getIDFromProcedureValueset,
    deleteProcedureValueset: deleteProcedureValueset,
    downloadAndProcessData:downloadAndProcessData,
    getURLToDownloadNDJSONFile:getURLToDownloadNDJSONFile,
    createFHIRExport:createFHIRExport,
    deleteIfExists:deleteIfExists
}