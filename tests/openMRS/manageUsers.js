const {
    click,
    below,
    write,
    into,
    textBox,
    toRightOf,
    scrollTo,
    text,
    link,
    checkBox,
    toLeftOf,
    button,
} = require('taiko');
var users = require("../util/users");

step("Manage Users", async function () {
    await click("Manage Users");
});

step("Manage Roles", async function () {
    await click("Manage Roles");
});


step("Add Role <file1> if not already exists", async function (roleDetailsFile) {
    var roleDetails = JSON.parse(roleDetailsFile)
    gauge.dataStore.scenarioStore.put("roleDetails", roleDetails)
    if (!await text(roleDetails.name).exists()) {
        await click("Add Role");
        await write(roleDetails.name, into(textBox(toRightOf("Role"))))
        for (var resultIndx = 0; resultIndx < roleDetails.inheritedRoles.length; resultIndx++) {
            await click(roleDetails.inheritedRoles[resultIndx])
        }
        for (var resultIndx = 0; resultIndx < roleDetails.priviliges.length; resultIndx++) {
            await click(roleDetails.priviliges[resultIndx])
        }
        await scrollTo("Save role")
        await click("Save role", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    }
});

step("Add hospital user <hospitalUser>", async function (hospitalUser) {
    await click("Add User");
    await click("Next", below("Create a new person"));
    gauge.dataStore.scenarioStore.put("hospitalUser", hospitalUser)
});

step("Enter hospital user's personal details", async function () {
    var hospitalUser = JSON.parse(gauge.dataStore.scenarioStore.get("hospitalUser", hospitalUser))
    await write(hospitalUser.name, into(textBox(toRightOf("Given"))));
    await write(hospitalUser.family, into(textBox(toRightOf("Family"))));
    await click(hospitalUser.gender);
});

step("Enter hospital user's details", async function () {
    var hospitalUser = JSON.parse(gauge.dataStore.scenarioStore.get("hospitalUser", hospitalUser))
    await write(users.getUserNameFromEncoding(hospitalUser.userDetails), into(textBox(toRightOf("Username"))));
    await write(users.getPasswordFromEncoding(hospitalUser.userDetails), into(textBox(toRightOf("User's Password"))));
    await write(users.getPasswordFromEncoding(hospitalUser.userDetails), into(textBox(toRightOf("Confirm Password"))));
});

step("Save hospital user", async function () {
    await click("Save User");
});

step("Select <file1> role", async function (roleDetailsFile) {
    var roleDetails = JSON.parse(roleDetailsFile)
    await click(roleDetails.name);
});

step("Add <fhirExport> user <filePath>", async function (fhirExport, filePath) {
    await click("Add User");
    await click("Next", below("Create a new person"));
    gauge.dataStore.scenarioStore.put(fhirExport, filePath)
    await click(checkBox(toLeftOf("Create a Provider account for this user")))
});

step("Enter <fhirExportUser> user's personal details", async function (fhirExportUser) {
    var fhirExportUser = JSON.parse(gauge.dataStore.scenarioStore.get(fhirExportUser))
    await write(fhirExportUser.name, into(textBox(toRightOf("Given"))));
    await click(fhirExportUser.gender);
});

step("Enter <fhirExportUser> user's details", async function (fhirExportUser) {
    var fhirExportUser = JSON.parse(gauge.dataStore.scenarioStore.get(fhirExportUser))
    await write(users.getUserNameFromEncoding(fhirExportUser.userDetails), into(textBox(toRightOf("Username"))));
    await write(users.getPasswordFromEncoding(fhirExportUser.userDetails), into(textBox(toRightOf("User's Password"))));
    await write(users.getPasswordFromEncoding(fhirExportUser.userDetails), into(textBox(toRightOf("Confirm Password"))));
});