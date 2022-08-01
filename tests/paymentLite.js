const { goto, click, waitFor, button, write, into, textBox, below, scrollTo, above, toLeftOf, toRightOf, $, text, doubleClick, press, link, client, switchTo } = require("taiko");
var fileExtension = require("./util/fileExtension")
var assert = require("assert")
var users = require("./util/users");
var fs = require('fs')
var path = require('path')
var pdfReader = require("./util/pdfReader");
const console = require("console");
const pdf = require('pdf-parse');

step("Goto paymentlite", async function () {
	await goto(process.env.paymentLiteurl)
});

step("Click Login", async function () {
	await click("Login", { waitForNavigation: true })
});

step("Open Customers", async function () {
	await click("Customers")
	await waitFor(async () => (await button("New Customer").exists()))
	await click(button("New Customer"))
	await waitFor("Basic Info")
});

step("Enter patient details in paymentLite", async function () {
	var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
	var middleName = gauge.dataStore.scenarioStore.get("patientMiddleName")
	var lastName = gauge.dataStore.scenarioStore.get("patientLastName")

	await write(`${firstName} ${middleName} ${lastName}`, into(textBox(below("Display Name"))))
});

step("Select currency as <currency>", async function (currency) {
	await click(textBox(below("Primary Currency")))
	await scrollTo(currency)
	await click(currency)
});

step("Save customer", async function () {
	await click(button("Save customer", { waitForNavigation: true }))
});

step("Click Items", async function () {
	await click("Items")
	await waitFor(async () => (await button("Add Item").exists()))
});

step("Add doctor with fees <fees>", async function (fees) {
	await click(button("Add Item"));
	await waitFor("New Item")

	var doctorFirstName = gauge.dataStore.scenarioStore.get("doctorFirstName");
	var doctorMiddleName = gauge.dataStore.scenarioStore.get("doctorMiddleName");
	var doctorLastName = gauge.dataStore.scenarioStore.get("doctorLastName");

	await write(`${doctorFirstName} ${doctorMiddleName} ${doctorLastName}`, into(textBox(below("Name"))))
	await write(fees, into(textBox(below("Price"))))

	await click("Save Item")
});

step("Add a drug with price <price>", async function (price) {
	var prescriptionFile = gauge.dataStore.scenarioStore.get("prescriptions");
	var medicalPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
	var drugName = medicalPrescriptions.drug_name;
	await click(button("Add Item"));

	await waitFor("New Item")

	await write(drugName, into(textBox(below("Name"))))
	await write(price, into(textBox(below("Price"))))

	await click("Save Item")
});

step("Click Invoices", async function () {
	await click("Invoices")
	await waitFor(async () => (await button("New Invoice").exists()))
});

step("Choose the patient", async function () {
	await waitFor("New Customer")
	await click("New Customer")
	var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")

	await scrollTo(firstName)
	await click(firstName)
});

step("Choose the doctor in paymentlite", async function () {
	await click(textBox(above("Add New Item"), below("Items")))
	var doctorFirstName = gauge.dataStore.scenarioStore.get("doctorFirstName");
	await scrollTo(doctorFirstName)
	await click(doctorFirstName)
});


step("Add a new Item", async function () {
	await click("Add New Item")
});

step("Choose the prescibed medicines in paymentlite", async function () {
	await click(textBox(toLeftOf("1", toLeftOf("$ 0.00"))));
	var prescriptionFile = gauge.dataStore.scenarioStore.get("prescriptions");
	var medicalPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
	var drugName = medicalPrescriptions.drug_name;

	await scrollTo(drugName)
	await click(drugName)
});

step("Save Invoice", async function () {
	await click(button("Save Invoice"))
});

step("Click Payments", async function () {
	await click("payments")
	await waitFor(async () => (await button("Add Payment").exists()))
	await click("Add Payment")
	await waitFor("New Payment")
});

step("Enter patient name for payment", async function () {
	var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
	var middleName = gauge.dataStore.scenarioStore.get("patientMiddleName")
	var lastName = gauge.dataStore.scenarioStore.get("patientLastName")

	await write(`${firstName}`, into(textBox(above("Amount"), below("Customer"))))
	await waitFor(async () => (await $(`//span[text()='${firstName} ${middleName} ${lastName}']`).isVisible()))
	await click(`${firstName} ${middleName} ${lastName}`)
});

step("Enter amount <amount> the patient is willing to pay", async function (amount) {
	await write(amount, into(textBox(below("Amount"))))
});

step("Select the payment mode as <paymentMode>", async function (paymentMode) {
	await click(textBox(below("Payment Mode")))
	await click(paymentMode)
});

step("Create a new invoice", async function () {
	await click("New Invoice")
});

step("Enter Exchange Rate <rate>", async function (rate) {
	await doubleClick(textBox(below("Exchange Rate", above("Enter exchange rate to convert from INR to USD", toRightOf("1 INR =", toLeftOf("USD"))))))
	await write(rate, into(textBox(below("Exchange Rate", above("Enter exchange rate to convert from INR to USD", toRightOf("1 INR =", toLeftOf("USD")))))));
});

step("Click Customers", async function () {
	await click("Customers")
});

step("Select customer", async function () {
	var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
	var middleName = gauge.dataStore.scenarioStore.get("patientMiddleName")
	var lastName = gauge.dataStore.scenarioStore.get("patientLastName")

	await click(`${firstName} ${middleName}`)
});

step("Click New Transaction", async function () {
	await click("New Transaction")
});

step("New Payment", async function () {
	await click("New Payment")
});

step("Save payment", async function () {
	await click("Save payment")
});

step("Goto the tab Draft", async function () {
	await click("Draft")
});

step("Goto the tab All", async function () {
	await click("All")
});

step("Note the invoice number of the patient", async function () {
	var firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
	var middleName = gauge.dataStore.scenarioStore.get("patientMiddleName")

	var invoiceNumber = await link(toLeftOf(`${firstName} ${middleName}`), below("NUMBER"), toRightOf("DATE")).text()
	gauge.dataStore.scenarioStore.put("invoiceNumber", invoiceNumber)
});

step("Associate the invoice to the payment", async function () {
	var invoiceNumber = gauge.dataStore.scenarioStore.get("invoiceNumber")
	await click($(".bg-multiselect-caret", toRightOf("Select Invoice")))
	await click(invoiceNumber)
});

step("open the invoice", async function () {
	var invoiceNumber = gauge.dataStore.scenarioStore.get("invoiceNumber")
	await click(link(invoiceNumber))
});

step("verify the payment is complete", async function () {
	var invoiceNumber = gauge.dataStore.scenarioStore.get("invoiceNumber")
	assert.ok(await text("COMPLETED", below(invoiceNumber)).exists())
});

step("Add Payment", async function () {
	await click("Add Payment")
});

step("Enter crater Password", async function () {
	await write(users.getPasswordFromEncoding(process.env.paymentliteuser), into(textBox(below("Password"))));
});

step("Enter crater Email", async function () {
	await click(textBox(below("Email")))
	await write(users.getUserNameFromEncoding(process.env.paymentliteuser), into(textBox(below("Email"))));
});

step("Click Logout", async function () {
	await click(text('Logout'));
});

step("Click on user menu", async function () {
	await click(button({ 'id': 'headlessui-menu-button-3' }));
});

step("goto reports in payment lite", async function () {
	await click(link("Reports"));
});

step("Validate Report is displayed", async function () {
	await waitFor(async () => (await $("//embed[@type='application/pdf']").exists()))
	assert.ok(await $("//embed[@type='application/pdf']").exists());
});

step("Download the report", async function () {
	var downloadPath = path.resolve(__dirname, 'data', 'downloaded');
	var FilePath = path.join(downloadPath, 'document.pdf');
	await client().send('Page.setDownloadBehavior', {
		behavior: 'allow',
		downloadPath: downloadPath,
	});
	await click(button("Download PDF"));
	console.log(FilePath)
	assert.ok(fs.existsSync(FilePath))
	gauge.dataStore.scenarioStore.put("pdfReportPath", FilePath)
	waitFor(15000)
	// switchTo("Crater - Self Hosted Invoicing Platform");
});

step("Validate the downloaded report", async function () {
	var invoiceNumber = gauge.dataStore.scenarioStore.get("invoiceNumber")
	let dataBuffer = fs.readFileSync(gauge.dataStore.scenarioStore.get("pdfReportPath"));
	console.log(invoiceNumber)
	pdf(dataBuffer).then(function (data) {
		console.log(data.text)
		console.log(data.text.includes(invoiceNumber));
		assert.ok(data.text.includes(invoiceNumber));
	});
});