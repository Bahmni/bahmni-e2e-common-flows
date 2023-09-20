const {
    waitFor,
} = require('taiko');
const path = require('path');
const axios = require('axios')
//require("../../data")
var date = require("./date");
const assert = require("assert");
const unzipper = require('unzipper');
var users = require("./users");
const { url } = require('inspector');
const fs = require('fs');
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

async function createFHIRExport() {
    let response = await axios({
        url: "https://dev.snomed.mybahmni.in/openmrs/ws/rest/v1/fhirexport",
        method: 'post',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    return response.data.link;
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
                'Authorization': `Basic ${process.env.admin}`
            }
        });
        console.log(response.data);
        var jsonData = response.data
        status = jsonData.status
        if (status == "completed" || status == "rejected") {
            console.log("output " + jsonData.output[0].valueString)
            break;
        }
        await waitFor(2000);
    }
    return jsonData.output[0].valueString;
}


async function downloadFile(fileUrl) {
    console.log("file url " + fileUrl);
    let response = await axios({
        method: 'get',
        maxBodyLength: Infinity,
        url: fileUrl.replace("http", "https"),
        responseType: 'blob',
        headers: {
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    //function to download file and extract zip file
    fs.writeFileSync(path.resolve(__dirname, 'test.ndjson.zip'), response.data);
    fs.createReadStream(path.resolve(__dirname, 'test.ndjson.zip'))
        .pipe(unzipper.Extract({ path: path.resolve(__dirname, 'test.ndjson') }))
    console.log('Downloading and extracting...');
      console.log('Extraction completed.');
    fs.createReadStream(path.resolve(__dirname, 'test.ndjson.zip'))
        .pipe(unzipper.Parse())
        .on('entry', function (entry) {
            // Check if the required files are present
    const requiredFiles = ['Condition.ndjson', 'MedicationRequest.ndjson', 'Patient.ndjson'];
    //check if the required files is present in the fil     
    for (const files of requiredFiles) {
        if (entry.path.includes(files)) {
            console.log(`Found ${files}`);
            //save the file to the current directory with file name
            entry.pipe(fs.createWriteStream(path.resolve(__dirname, entry.path)));
            entry.autodrain();

        }
        else {
            console.log(`Missing ${files}`);
        }
    }
            var fileName = entry.path;
            var type = entry.type; // 'Directory' or 'File'
            var size = entry.vars.uncompressedSize; // There is also compressedSize;
            console.log("file name " + fileName)
            console.log("type " + type);
            console.log("size " + size);
            entry.pipe(fs.createWriteStream('output/path'));
            
            entry.autodrain();
        });
    await waitFor(2000);
    fs.unlinkSync(path.resolve(__dirname, 'test.ndjson.zip'));
    return downloadPath;
}

async function downloadFiles(fileUrl) {
    console.log("file url " + fileUrl);
    let response = await axios({
        method: 'get',
        maxBodyLength: Infinity,
        url: fileUrl.replace("http", "https"),
        responseType: 'stream',
        headers: {
            'Authorization': `Basic ${process.env.admin}`
        },
    });
    //function to download file and extract zip file
    const outputDirectory = './extracted';
    // Function to download and extract the zip file

    try {
       response.data.pipe(unzipper.Extract({ path: outputDirectory }));
    //response.data.pipe(unzipper.Extract({ path: path.resolve(__dirname, outputDirectory) }));
    console.log('Downloading and extracting...');
    await new Promise((resolve) => {
      response.data.on('end', resolve);
    });

    console.log('Extraction completed.');
    const requiredFiles = ['Condition.ndjson', 'MedicationRequest.ndjson', 'Patient.ndjson'];
    const extractedFiles = fs.readdirSync(outputDirectory);
    //open the required files and validate the data
    

    for (const file of requiredFiles) {
      if (!extractedFiles.includes(file)) {
        console.error(`Required file '${file}' not found.`);
      } else {
        console.log(`Found file: ${file}`);
      //open ndjson file and validate the data
    //   const data = fs.readFileSync(path.resolve( outputDirectory, file), 'utf8');
    //     const lines = data.split('\n');
    //     console.log(`Found ${lines.length} lines.`);
    //     for (const line of lines) {
    //       const json = JSON.parse(line);
    //       console.log(json);
    //     }

      }
    }
  } catch (error) {
    console.error('Error:', error.message);
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
    createFHIRExport: createFHIRExport,
    getURLToDownloadNDJSONFile: getURLToDownloadNDJSONFile,
    downloadFile: downloadFile,
    downloadFiles:downloadFiles
}

