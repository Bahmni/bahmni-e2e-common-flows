const { $, goto, below, write, textBox, into, click, toLeftOf, dropDown, checkBox, reload, text, timeField, waitFor, highlight, screenshot, toRightOf, button, switchTo, within } = require('taiko');
var assert = require("assert")
var date = require("./util/date");
const { format } = require("date-fns")

step("Select start date, end date and <reportFormat> format for <reportName> and click on run button", async function (reportFormat, reportName) {
	let startDate = format(date.today(), "dd/MM/yyyy")
	let endDate = format(date.today(), "dd/MM/yyyy")
	await write(startDate, into($("//TH[@class='reports-start-date']/input"), within($("//*[normalize-space()='" + reportName + "']/.."))))
	await write(endDate, into($("//TH[@class='reports-stop-date']/input"), within($("//*[normalize-space()='" + reportName + "']/.."))))
	await dropDown(within($("//*[normalize-space()='" + reportName + "']/..")), below(text("Format"))).select(reportFormat)
	await click(button("Run Now"),toRightOf(text(reportName)), within($("//*[normalize-space()='" + reportName + "']/..")))
});

step("Validate the report generated.", async function () {
	let patientIdentifier = gauge.dataStore.scenarioStore.get("patientIdentifier")
	let firstName = gauge.dataStore.scenarioStore.get("patientFirstName")
	let lastName = gauge.dataStore.scenarioStore.get("patientLastName")
	let patientAge = gauge.dataStore.scenarioStore.get("patientAge")
	let patientGender = (gauge.dataStore.scenarioStore.get("patientGender") == "Female") ? "F" : "M";
	let startDate = date.getddmmmyyyyFormattedDate(date.today());
	let endDate = date.getddmmmyyyyFormattedDate(date.today());
	assert.ok(await text(patientIdentifier
		, toLeftOf(text(`${firstName} ${lastName}`
			, toLeftOf(text(patientAge
				, toLeftOf(text(patientGender
					, toLeftOf(text(startDate
						, toLeftOf(text(endDate)))))))))), within($(`//SPAN[text()='${patientIdentifier}']/../..`))).exists());
});