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

async function createFHIRExportForAnonymisedData() {
    let response = await axios({
        url: "https://qa.snomed.mybahmni.in/openmrs/ws/rest/v1/fhirexport",
        method: 'post',
        headers: {
            'accept': `application/json`,
            'Content-Type': `application/json`,
            'Authorization': `Basic ${process.env.admin}`
        }
    });
    return response.data.link;
}


async function createFHIRExportForNonAnonymisedData() {
    let response = await axios({
        url: "https://qa.snomed.mybahmni.in/openmrs/ws/rest/v1/fhirexport",
        params: {
            "anonymise": "false",
        },
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


async function asddownloadFile(fileUrl) {
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
    // try {
    //     let response = await axios({
    //         method: 'get',
    //         maxBodyLength: Infinity,
    //         url: fileUrl.replace("http", "https"),
    //         responseType: 'stream',
    //         headers: {
    //             'Authorization': `Basic ${process.env.admin}`
    //         },
    //     });

    //     const outputDirectory = './extracted';
    //     response.data.pipe(unzipper.Extract({ path: outputDirectory }));

    //     console.log('Downloading and extracting...');

    //     await new Promise((resolve, reject) => {
    //         response.data.on('end', resolve);
    //         response.data.on('error', reject);
    //     });

    //     console.log('Extraction completed.');

    //     const requiredFiles = ['Condition.ndjson', 'MedicationRequest.ndjson', 'Patient.ndjson'];
    //     const extractedFiles = fs.readdirSync(outputDirectory);

    //     // Open the required files and validate the data
    //     for (const file of requiredFiles) {
    //         if (!extractedFiles.includes(file)) {
    //             console.error(`Required file '${file}' not found.`);
    //         } else {
    //             console.log(`Found file: ${file}`);
    //         }
    //     }
    // } catch (error) {
    //     console.error('Error:', error.message);
    // }
    const filepath = './extracted/data.zip';
    let response;
    try {
        response = await axios({
            url: fileUrl.replace("http", "https"),
            method: 'GET',
            responseType: 'stream',
            headers: {
                'Authorization': `Basic ${process.env.admin}`
            }
        });
        await response.data.pipe(fs.createWriteStream(filepath));
        await waitFor(500);
        await waitFor(() => fileExtension.exists(filepath));
        assert.ok(fileExtension.exists(filepath), "Patient image not downloaded.");
        max_Retry = 0;
    } catch (e) {
        console.log("Image download failed - " + e.message + ". Retrying...")
        max_Retry = max_Retry - 1;
    }

}

// async function downloadAndProcessData(apiUrl) {
//     //const apiUrl = 'https://dev.snomed.mybahmni.in/openmrs/ws/rest/v1/fhirExtension/export?file=7eb8b952-28bb-41a4-ba9f-eb70d3b7a01a';
//     const zipFilePath = './data.zip';
//     const ndjsonFilePath = './data.ndjson';

//     try {
//         // Download the ZIP file
//         const response = await axios({
//             url: apiUrl.replace("http", "https"),
//             method: 'GET',
//             responseType: 'stream',
//             headers: {
//                 'Authorization': `Basic ${process.env.admin}`
//             },
//         });

//         // Save the ZIP file locally
//         const writeStream = fs.createWriteStream(zipFilePath);
//         response.data.pipe(writeStream);

//         await new Promise((resolve, reject) => {
//             writeStream.on('finish', resolve);
//             writeStream.on('error', reject);
//         });

//         console.log('ZIP file downloaded successfully.');
//         //Unzip the file
//         const readStream = fs.createReadStream(zipFilePath);
//         const gunzip = zlib.createGunzip();
//         const writeNdjsonStream = fs.createWriteStream(ndjsonFilePath);

//         readStream.pipe(gunzip).on('data', (data) => {
//             // Assuming each JSON object is on a new line
//             const lines = data.toString().split('\n');

//             // Process each line
//             lines.forEach((line) => {
//                 try {
//                     const jsonObj = JSON.parse(line);
//                     // Do something with the JSON object
//                     console.log(jsonObj);
//                     // You can also write it to a new file if needed
//                     writeNdjsonStream.write(JSON.stringify(jsonObj) + '\n');
//                 } catch (error) {
//                     console.error('Error parsing JSON:', error.message);
//                 }
//             });
//         }).on('end', () => {
//             console.log('Unzipping and parsing complete.');
//             writeNdjsonStream.end();
//         }).on('error', (error) => {
//             console.error('Error reading file:', error.message);
//         });
//     } catch (error) {
//         console.error('Error downloading ZIP file:', error.message);
//     }
// }

async function downloadAndProcessData(apiUrl) {
    const zipFilePath = './data.zip';
    const extractionPath = './extracted_data';
    const requiredFiles = ['Condition.ndjson', 'MedicationRequest.ndjson', 'Patient.ndjson'];

    // Delete existing ZIP file and extraction directory if they exist
    await deleteIfExists(zipFilePath);
    await deleteIfExists(extractionPath);

    // Download the ZIP file
    const response = await axios({
        url: apiUrl.replace("http", "https"),
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
            'Authorization': `Basic ${process.env.admin}`
        },
    });

    // Save the ZIP file locally
    await fs.writeFile(zipFilePath, Buffer.from(response.data, 'binary'));

    console.log('ZIP file downloaded successfully.');

    // Extract the contents of the ZIP file
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(extractionPath, true);

    console.log('ZIP file extracted successfully.');
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
    // Now, you can access the extracted ndjson files in the 'extracted_data' directory
    // Perform any further processing as needed
}

// Helper function to delete a file or directory if it exists
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
        // File or directory doesn't exist, so nothing to delete
    }
}

//function to download file and extract zip file
// fs.writeFileSync(path.resolve(__dirname, 'test.ndjson.zip'), response.data);

//------------------------

// const downloadZipFile = async (url) => {
//     // Create a new Axios instance.
//     console.log("inside function download")
//     const axiosInstance = axios.create({
//         headers: {
//             'Authorization': `Basic ${process.env.admin}`
//         },
//     });
//     // Set the response type to `arraybuffer`.
//     axiosInstance.defaults.responseType = 'arraybuffer';
//     // Download the zip file.
//     const response = await axiosInstance.get(url);
//     // Write the zip file to disk.
//     await fs.writeFile('./downloaded.zip', response.data);
//     return './downloaded.zip';
// };

// const unzipAndParseNdjsonFile = async (filePath) => {
//     // Read the NDJSON file into a buffer.
//     const buffer = await fs.readFile(filePath);
//     // Unzip the NDJSON file.

//     const unzippedData = await zlib.promises.gunzip(buffer);
//     // Parse the unzipped data as JSON.
//     const jsonObjects = JSON.parse(unzippedData.toString());
//     return jsonObjects;
// };



async function downloadUnzipAndParseNDJSON(apiUrl) {
    try {
        // Step 1: Download the ZIP file from the API
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('Failed to download ZIP file');
        }

        // Step 2: Create a temporary directory for extracting the ZIP file
        const tempDir = './temp_extracted_zip';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Step 3: Unzip the downloaded ZIP file
        yauzl.open(response.body, { autoClose: false, lazyEntries: true }, (err, zipfile) => {
            if (err) throw err;

            zipfile.readEntry();

            zipfile.on('entry', (entry) => {
                // Extract each file from the ZIP archive
                const fileStream = fs.createWriteStream(`${tempDir}/${entry.fileName}`);
                zipfile.openReadStream(entry, (err, readStream) => {
                    if (err) throw err;
                    readStream.pipe(fileStream);

                    // When the file write is complete, read the NDJSON data
                    fileStream.on('finish', () => {
                        if (entry.fileName.endsWith('.ndjson')) {
                            // Step 4: Parse the NDJSON file line by line
                            const ndjsonFile = `${tempDir}/${entry.fileName}`;
                            const ndjsonStream = readline.createInterface({
                                input: createReadStream(ndjsonFile),
                                crlfDelay: Infinity,
                            });

                            ndjsonStream.on('line', (line) => {
                                try {
                                    const jsonData = JSON.parse(line);
                                    // Now you can work with the parsed JSON data
                                    console.log(jsonData);
                                } catch (error) {
                                    console.error('Error parsing NDJSON line:', error);
                                }
                            });

                            ndjsonStream.on('close', () => {
                                console.log('Finished processing NDJSON data.');
                            });
                        }
                        zipfile.readEntry();
                    });
                });
            });

            zipfile.on('end', () => {
                console.log('ZIP file extraction complete.');
            });
        });
    } catch (error) {
        console.error('Error:', error);
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
    createFHIRExportForAnonymisedData: createFHIRExportForAnonymisedData,
    createFHIRExportForNonAnonymisedData, createFHIRExportForNonAnonymisedData,
    getURLToDownloadNDJSONFile: getURLToDownloadNDJSONFile,
    downloadFiles: downloadFiles,
    downloadUnzipAndParseNDJSON: downloadUnzipAndParseNDJSON,
    downloadAndProcessData: downloadAndProcessData
}

