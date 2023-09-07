const path = require('path');
const axios = require('axios')
var date = require("./date");
const assert = require("assert");
var users = require("./users");
const endpoints = require('./../../../tests/API/constants/apiConstants').endpoints;

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
async function getProcedureDataFromValuesetURL() {
    //console.log("endpoint  " + endpoints.SNOWSTORM_URL.split('$')[0])
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
    //var url1: "https://dev.snomed.mybahmni.in/openmrs/ws/rest/v1/terminologyServices/valueSet?valueSetId=" + procedureOrders + "&locale=en&conceptClass=Procedure&conceptDatatype=N/A&contextRoot=Procedure Orders"
    //console.log("url  " + url1)
    //console.log(process.env.bahmniHost + endpoints.PROCEDURE_ORDERS)
    let response = await axios({
        //url: "https://dev.snomed.mybahmni.in/openmrs/ws/rest/v1/terminologyServices/valueSet?valueSetId=" + procedureOrders + "&locale=en&conceptClass=Procedure&conceptDatatype=N/A&contextRoot=Procedure Orders",
        url: process.env.bahmniHost + endpoints.PROCEDURE_ORDERS,
        data: null,
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
    //console.log("response " + response)
    var taskLink = response.data
    return taskLink;
}
async function checkStatusForProcedure(endpoint) {
    //console.log("endpoint  "+endpoints.SNOWSTORM_URL.split('$')[0])
    // console.log(endpoint.replace("http","https"))
    // console.log("endpoint123 " + endpoint)
    var response = await axios({
       // endpointendpoint.replace("http","https")
        url: endpoint.replace("http","https"),
        method: 'get',
       // maxRedirects: 10,
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    var jsonData = response.data
    //console.log(jsonData)
    var status = jsonData.status
    return status;

}

module.exports = {
    getOpenMRSResponse: getOpenMRSResponse,
    makeOpenVisitCall: makeOpenVisitCall,
    makeOpenProgramCall: makeOpenProgramCall,
    setRoles: setRoles,
    checkDiagnosisInOpenmrs: checkDiagnosisInOpenmrs,
    getSnomedDiagnosisDataFromAPI: getSnomedDiagnosisDataFromAPI,
    checkCdssIsEnabled: checkCdssIsEnabled,
    getProcedureDataFromValuesetURL: getProcedureDataFromValuesetURL,
    uploadProcedureOrders: uploadProcedureOrders,
    checkStatusForProcedure: checkStatusForProcedure
}
