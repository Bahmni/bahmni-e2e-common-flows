const { $, goto, below, write, textBox, into, click, toLeftOf, dropDown, checkBox, reload, text, timeField, waitFor, highlight, screenshot, toRightOf, button, switchTo, within } = require('taiko');
var assert = require("assert")
var date = require("./util/date");

step("Select start date, end date and <reportFormat> format for <reportName> and click on run button", async function (reportFormat, reportName) {
	let startDate = date.yesterday()
	let endDate = date.today()
	await timeField(toRightOf(text(reportName)), below(text("Start Date"))).select(startDate)
	await timeField(toRightOf(text(reportName)), toRightOf(text("Start Date")), below(text("End Date"))).select(endDate)
	await dropDown(toRightOf(text(reportName)), below(text("Format"))).select(reportFormat)
	await click(button(toRightOf(text(reportName))))
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