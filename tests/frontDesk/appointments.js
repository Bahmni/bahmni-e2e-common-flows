const {
    $,
    dropDown,
    button,
    within,
    highlight,
    timeField,
    toRightOf,
    write,
    goto,
    above,
    click,
    checkBox,
    toLeftOf,
    text,
    into,
    textBox,
    waitFor,
    confirm,
    accept,
    scrollDown,
    link,
    below,
    press,
    scrollTo,
    evaluate,
    radioButton,
    clear
} = require('taiko');
var date = require("../util/date");
const taikoHelper = require("../util/taikoHelper")
var moment = require("moment");

step("View all appointments", async function () {
    await click(process.env.appointmentList);
});

step("Begin capturing appointment details", async function () {
    await click("Add new appointment");
});

step("Select Patient id", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    await write(patientIdentifierValue, into(textBox({ placeHolder: "Patient Name or ID" })));
    var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
    await click(firstName);
});

step("Select patient", async function () {
    var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
    var lastName = gauge.dataStore.scenarioStore.get("patientLastName")
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    var patientName = `${firstName} ${lastName} (${patientIdentifierValue})`
    await write(patientIdentifierValue, into($("//*[@data-testid='patient-search']//INPUT")))
    await waitFor(async () => (await $(`//DIV[text()='${patientName}']`).exists()));
    await waitFor(200);
    await evaluate($(`//DIV[text()='${patientName}']`), (el) => el.click());
});

step("Select service <service>", async function (service) {
    await dropDown(toRightOf("Service")).select(service);
});

step("Search and select service", async function () {
    await write(process.env.service, into($("//*[@data-testid='service-search']//INPUT")))
    await waitFor(async () => (await $("//DIV[text()='" + process.env.service + "' and contains(@class,'option')]").exists()));
    await waitFor(200);
    await evaluate($("//DIV[text()='" + process.env.service + "' and contains(@class,'option')]"), (el) => el.click());
});

step("Search and select appointment location", async function () {
    await click("Location");
    await click(process.env.appointmentLocation);
});

step("Select appointment date", async function () {
    await timeField({ type: "date" }, toRightOf("Date")).select(date.tomorrow());
});

step("Select location <location>", async function (location) {
    await dropDown("Location").select(location)
});

step("Enter appointment time <appointmentTime> into Start time", async function (appointmentTime) {
    await write(appointmentTime, into(textBox(toRightOf("Start Time"))));
    await click(`${appointmentTime} am`)
});

step("Open calender at time <appointmentTime>", async function (appointmentTime) {
    await click($(".fc-widget-content"), toRightOf(`${appointmentTime}`));
    await taikoHelper.repeatUntilNotFound($("#overlay"))
    gauge.dataStore.scenarioStore.put("appointmentStartDate", moment(await textBox({ placeHolder: "mm/dd/yyyy" }).value(), "MM/DD/YYYY").toDate())
});

step("put <appointmentDate> as appointment date", async function (appointmentDate) {
    gauge.dataStore.scenarioStore.put("appointmentStartDate", date.getDateFrommmddyyyy(appointmentDate))
});


step("Compute end time", async function () {
    await waitFor(2000)
});

step("Click Save", async function () {
    await click("Save")
});

step("Check and Save", async function () {
    await click("Check and Save");
    await waitFor(async () => (await $(`//DIV/P[text()='Appointment Created!']`).exists()));
    await waitFor(async () => !(await $(`//DIV/P[text()='Appointment Created!']`).exists()));
});

step("Goto tomorrow's date", async function () {
    await click(button({ type: 'button' }, within($('[ng-click="goToNext()"]'))));
});

step("Goto appointments's date", async function () {
    var appointmentStartDate = gauge.dataStore.scenarioStore.get("appointmentStartDate")
    await timeField(toRightOf("Week")).select(new Date(appointmentStartDate));
});

step("Goto Next week", async function () {
    await click("Week");
    var month = date.getShortNameOfMonth(date.today())
    await click(button(), toRightOf(month));
});

step("Goto day view of the calendar", async function () {
    await click("Day");
    var month = date.getShortNameOfMonth(date.today())
    await click(button(), toRightOf(month));
});


step("Click Close", async function () {
    //    await click(button({"data-testid":"save-close-button"}),{waitForNavigation:true,navigationTimeout:process.env.actionTimeout});
    await click(button("Close", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout }))
});

step("Goto List view", async function () {
    await click("List view");
});

step("select the walk in appointment option", async function () {
    await click(checkBox(toLeftOf("Walk-in Appointment")))
});

step("select the teleconsultation appointment option", async function () {
    await checkBox("Teleconsultation").check();
});

step("select the recurring appointment option", async function () {
    await click("Recurring Appointment");
});

step("select the Start date as today", async function () {
    await clear(textBox(below(text("Appointment start date"))));
    await write(moment().format('MM/DD/YYYY'), into(textBox(below(text("Appointment start date")))))
    gauge.dataStore.scenarioStore.put("appointmentStartDate", new Date());
});

step("select the End date as after <numberOfOccurences> occurence", async function (numberOfOccurences) {
    await clear(textBox({"id":"occurrences"}));
    await write(numberOfOccurences, into(textBox({"id":"occurrences"})));
});

step("select Repeats every <numberOfDays> <type>", async function (numberOfDays, type) {
    await clear(textBox({"id":"period"}));
    await write(numberOfDays, into(textBox({"id":"period"})));
    await click($("#recurrence-type"));
    await click($("//div[contains(text(),'"+type+"')]"))
});

step("Click Cancel all", async function () {
    await scrollTo("Cancel All")
    await click("Cancel All")
});

step("Click Cancel", async function () {
    await scrollTo('Cancel')
    await click('Cancel')
});

step("Cancel appointment", async function () {
    await scrollTo($('#yes'))
    await click($('#yes'))
});

step("Open admin tab of Appointments", async function () {
    await click("Admin")
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Create a service if it does not exist", async function () {
    if (await text(process.env.service).exists())
        return
    await click("Add New Service")
    await write(process.env.service, into(textBox({ placeHolder: "Enter a service name" })))
    await write("For test automation", into(textBox({ placeHolder: "Enter description" })))
    await click("Save", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout })
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Manage locations", async function () {
    await click("Manage Locations")
});

step("Goto Today", async function () {
    await click("Today")
});

step("Select List View in Appointments", async function () {
    await click("List view")
});

step("Get Apointmnet Date and Time", async function () {
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    let appointmentDate = await $("//A[text()='" + patientIdentifierValue + "']/../../TD[3]").text();
    let appointmentStartTime = await $("//A[text()='" + patientIdentifierValue + "']/../../TD[4]").text();
    let appointmentEndTime = await $("//A[text()='" + patientIdentifierValue + "']/../../TD[5]").text();
    gauge.dataStore.scenarioStore.put("appointmentDate", appointmentDate)
    gauge.dataStore.scenarioStore.put("appointmentStartTime", appointmentStartTime)
    gauge.dataStore.scenarioStore.put("appointmentEndTime", appointmentEndTime)
});

step("Verify the details in Appointments display control with status <status>", async function (status) {
    let appointmentDate = gauge.dataStore.scenarioStore.get("appointmentDate");
    let appointmentStartTime = gauge.dataStore.scenarioStore.get("appointmentStartTime");
    let appointmentEndTime = gauge.dataStore.scenarioStore.get("appointmentEndTime");
    assert.ok(text(`${appointmentStartTime} - ${appointmentEndTime}`, toRightOf(appointmentDate, toLeftOf(status), within($("//*[text()='Appointments']/ancestor::section")))).exists(), `Appointment details not found for status: ${status}, appointmentDate: ${appointmentDate}, startTime: ${appointmentStartTime}, endTime: ${appointmentEndTime}`)
});

step("Select Regular Appointment option", async function() {
	await click(button("Regular Appointment"));
});

step("Close appointment side panel", async function() {
	await click($("//div[contains(@class,'AddAppointment_close')]/svg"),{ waitForNavigation: true, navigationTimeout: process.env.actionTimeout })
});

step("Select <status> appointment status", async function(status) {
	await radioButton(status).select();
});