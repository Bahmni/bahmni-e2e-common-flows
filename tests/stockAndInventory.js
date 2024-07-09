const { goto, $, below, write, textBox, into, click, clear, toLeftOf, checkBox, reload, text, waitFor, highlight, screenshot, button, within, press, evaluate, tableCell, link, radioButton, dropDown } = require('taiko');
var assert = require("assert");
const helper = require('csvtojson');
const { type } = require('os');
const listTable = "//table[contains(@class,'list_table')]"
const { faker } = require('@faker-js/faker/locale/en_IND');
var fileExtension = require("./util/fileExtension");
const Decimal = require("decimal.js");
const moment = require('moment');

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

step("enter odoo username", async function () {
    await write(process.env.odooUsername, into(textBox(below("Email"))));
});

step("enter odoo password", async function () {
    await write(process.env.odooPassword, into(textBox(below("Password"))));
});

step("Log in to odoo", async function () {
    await click("Log in", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout })
    await waitFor(async () => (await text("Inbox").exists()), { timeout: process.env.actionTimeout });
});

step("Click Sales", async function () {
    await click("Sales", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    await waitFor(2000);
});

step("View Quotations below direct sales", async function () {
    await click("Quotations", below("Direct Sales"));
});

step("select Customer", async function () {
    let fullName = gauge.dataStore.scenarioStore.get("patientFullName")
    var patientIdentifierValue = gauge.dataStore.scenarioStore.get("patientIdentifier");
    let oddoCustomerName = `${fullName} [${patientIdentifierValue}]`;
    gauge.dataStore.scenarioStore.put("odooCustomerName", oddoCustomerName)
    var maxRetry = 5
    while (maxRetry > 0) {
        await waitFor(1000);
        if (await $("//TD[@name='partner_id' and text()='" + oddoCustomerName + "']").exists(500, 5000)) {
            maxRetry = 0
            await click(oddoCustomerName, { force: true });
        }
        else {
            maxRetry = maxRetry - 1;
            assert.ok(maxRetry > 0, "Quotation not found in Odoo for patient - " + oddoCustomerName)
            console.log("Waiting for 5 seconds and reload the Quotations page to wait for Patient - " + oddoCustomerName + ". Remaining attempts " + maxRetry)
            await waitFor(4000);
            await reload({ waitForNavigation: true });
        }
    }
});

step("Confirm sale", async function () {
    await waitFor(async () => (await text("CONFIRM").exists()))
    await click("CONFIRM");
    await waitFor(async () => (await text("Quotation confirmed").exists()))
    assert.ok(await text("Quotation confirmed").exists());
});

step("Goto Odoo", async function () {
    await goto(process.env.odooURL + "/web/login", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
});

step("Click Quotations", async function () {
    await click("Quotations", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout })
});

step("Click Odoo Home button", async function () {
    await click(button({ title: "Home Menu" }));
});

step("Click Odoo Home button and select <menu>", async function (menu) {
    await click(button({ title: "Home Menu" }));
    await click($("//A[@role='menuitem'][normalize-space()='" + menu + "']"));
});

step("Click <Products> from Odoo top menu and select <Products> from dropdown", async function (strMenu, strSubMenu) {
    await clickMenu(strMenu, strSubMenu);
    await waitFor(1000);
});
async function clickMenu(strMenu, strSubMenu) {
    await click($("//DIV[@role='menu']//button[@class='dropdown-toggle']/SPAN[normalize-space()='" + strMenu + "']"));
    await waitFor(500);
    await click($("//A[@class='dropdown-item'][normalize-space()='" + strSubMenu + "']"), { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    await waitFor(1000);
}
step("Enter the concept name in search box", async function () {
    await enterValueInSearchbox(gauge.dataStore.scenarioStore.get("conceptName"))
});

async function enterValueInSearchbox(strValue) {
    await click($("//INPUT[@role='searchbox']"), { force: true });
    await write(strValue, into($("//INPUT[@role='searchbox']")), { force: true });
}
step("Click Search button", async function () {
    await press('Enter')
});

step("Select List view in ODOO", async function () {
    await evaluate($(`//button[@data-tooltip='List']`), (el) => el.click())
});

step("Open product in search result", async function () {
    await openItemFromListView(gauge.dataStore.scenarioStore.get("conceptName"))
});

async function openItemFromListView(strValue) {
    await click(strValue, within($(listTable)))
}

step("Verify the value <value> is displayed for the field <label>", async function (strValue, strLabel) {
    await verifyFieldValue(strLabel, strValue);
});

async function verifyFieldValue(strLabel, strValue) {
    var siblingText = await getFieldValue(strLabel)
    assert.equal(siblingText.replace(/\u00A0/g, ' ').replace(',', ''), strValue, "Value " + strValue + " is not displayed for " + strLabel + " field. Value Expected - " + strValue + " Value Displayed - " + siblingText);
}

async function getFieldValue(strLabel) {
    const label = $("//label[normalize-space(text())='" + strLabel + "']");
    const siblingText = await evaluate(label, (elem) => {
        let parentElement = elem.parentElement;
        let siblingElement = parentElement.nextElementSibling;
        if (!siblingElement) {
            siblingElement = parentElement.parentElement.nextElementSibling;
        }
        if (siblingElement) {
            const selectElement = siblingElement.querySelector('select');
            if (selectElement) {
                return selectElement.options[selectElement.selectedIndex].text;
            } else {
                const inputElement = siblingElement.querySelector('input');
                if (inputElement) {
                    return inputElement.value;
                } else {
                    return siblingElement.innerText;
                }
            }
        } else {
            return 'No next sibling found';
        }
    });
    return siblingText;
}

step("Verify the value of checkbox <label> is <value>", async function (strCheckBoxLabel, strValue) {
    if (strValue == "checked") {
        assert.ok(await checkBox(strCheckBoxLabel).isChecked());
    } else {
        assert.ok(!await checkBox(strCheckBoxLabel).isChecked());
    }
});

step("Clear search Filters", async function () {
    const elements = await $("//DIV[@role='search']//I[@aria-label='Remove']").elements();
    for (let element of elements) {
        await click(element);
    }
});


step("Check current status is set as <strState>", async function (strState) {
    assert.equal(await $("//div[@name='state']//button[@aria-label='Current state']").text(), strState, "Current status is not set as " + strState);
});

step("Verify the value for the field Cutomer name", async function () {
    await verifyFieldValue("Customer", gauge.dataStore.scenarioStore.get("odooCustomerName"));
});

step("Verify the value for the field Care Setting", async function () {
    await verifyFieldValue("Care Setting", gauge.dataStore.scenarioStore.get("visitType"));
});

step("Verify the value for the field Provider Name", async function () {
    await verifyFieldValue("Provider Name", 'Super Man');
});

step("Verify the items Drug, lab order and radiology order in Quotation with expected quantity, price, description, taxes and sub total", async function () {
    await verifyDrugItemInQuotation();

    var labTest = gauge.dataStore.scenarioStore.get("LabTest")
    await verifyOrderItemInQuotation(labTest);

    var radiologyTest = gauge.dataStore.scenarioStore.get("radiologyTest")
    await verifyOrderItemInQuotation(radiologyTest);

});

async function findRowByProduct(product, isModal = false) {
    return await findRowByColumnValue("Product", product, isModal);
}

async function findRowByColumnValue(columnName, columnValue, isModal = false) {
    let tableRowXpath = null;
    let tableCellUI = null;
    if (isModal) {
        tableRowXpath = "//main//TR[starts-with(@class,'o_data_row')]";
    } else {
        tableRowXpath = "//TR[starts-with(@class,'o_data_row')]";
    }
    const rowCount = (await $(tableRowXpath).elements()).length;
    for (let i = 0; i < rowCount; i++) {
        row = i + 1;
        if (isModal) {
            tableCellUI = tableCell({ row: row, col: await findColumnByName(columnName, true) }, within($("//main//table")));
        } else {
            tableCellUI = tableCell({ row: row, col: await findColumnByName(columnName) });
        }
        const columnValueActual = await tableCellUI.text();
        if (columnValueActual.trim().toLowerCase().includes(columnValue.toLowerCase())) {
            return row;
        }
    }
    assert.fail(`The ${columnValue} is not found in the table under the header ${columnName}`);
}

async function assertSameProductIsAdded(product, description, expectedCount) {
    let foundCount = 0;
    const rowCount = (await $("//TR[starts-with(@class,'o_data_row')]").elements()).length;
    for (let i = 0; i < rowCount; i++) {
        row = i + 1;
        const productCell = await tableCell({ row: row, col: await findColumnByName("Product") }).text();
        const descriptionCell = await tableCell({ row: row, col: await findColumnByName("Description") }).text();
        if (productCell.trim().toLowerCase().includes(product.toLowerCase()) && descriptionCell.trim().toLowerCase() == description.trim().toLowerCase()) {
            foundCount++;
            if (foundCount == expectedCount) {
                return;
            }
        }
    }
    assert.fail(`${foundCount} ${product} found in the table, expected ${expectedCount}`);
}

async function findColumnByName(name, isModal = false) {
    let headerXpath = isModal ? "//main//TH" : "//TH";
    const headerElements = await $(headerXpath).elements()
    const columnCount = headerElements.length;
    for (let i = 0; i < columnCount; i++) {
        col = i + 1;
        const colName = await headerElements[i].text();
        if (colName.trim().toLowerCase() == name.toLowerCase()) {
            return col;
        }
    }
    assert.fail(`Column ${name} not found in the table.`);
}

async function verifyDrugItemInQuotation() {
    const medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
    var drugName = medicalPrescriptions.drug_name
    const row = await findRowByProduct(drugName);
    var expectedQuantity = Number(gauge.dataStore.scenarioStore.get("drugQuantity")).toFixed(2)
    var expectedDescription = `${drugName} - ${Number(expectedQuantity).toFixed(1)} ${medicalPrescriptions.units}`
    var expectedDeliveryQuantity = "0.00"
    var expectedUnitPrice = "0.00"
    var expectedTaxes = "Tax 15%"
    var expectedSubTotal = "$ 0.00"
    await verifyItemsInQuotation(row, drugName, expectedDescription, expectedQuantity, expectedDeliveryQuantity, expectedUnitPrice, expectedTaxes, expectedSubTotal);
}

async function verifyOrderItemInQuotation(strProduct) {
    const row = await findRowByProduct(strProduct);
    var expectedQuantity = 1
    var expectedDescription = `${strProduct} - ${expectedQuantity.toFixed(1)} Unit(s)`
    var expectedDeliveryQuantity = "0.00"
    var expectedUnitPrice = "1.00"
    var expectedTaxes = "Tax 15%"
    var expectedSubTotal = "$ 1.00"
    await verifyItemsInQuotation(row, strProduct, expectedDescription, expectedQuantity.toFixed(2), expectedDeliveryQuantity, expectedUnitPrice, expectedTaxes, expectedSubTotal);
}

async function verifyItemsInQuotation(row, productName, expectedDescription, expectedQuantity, expectedDeliveryQuantity, expectedUnitPrice, expectedTaxes, expectedSubTotal) {
    const product = await tableCell({ row: row, col: await findColumnByName("Product") }).text();
    assert.ok(product.trim().toLowerCase().includes(productName.toLowerCase()), `Product ${productName} not found in the table.`);

    // Validate Description
    await assertInTable(row, "Description", expectedDescription);

    // Validate Quantity
    await assertInTable(row, "Quantity", expectedQuantity);

    // Validate Delivery Quantity
    await assertInTable(row, "Delivery Quantity", expectedDeliveryQuantity);

    // Validate Unit Price
    await assertInTable(row, "Unit Price", expectedUnitPrice);

    // Validate Tax
    await assertInTable(row, "Taxes", expectedTaxes);

    // Validate Sub Total
    await assertInTable(row, "Subtotal", expectedSubTotal);
}

async function assertInTable(row, columnName, expectedValue, isModal = false) {
    let actualValue = await getValueFromTable(row, columnName, isModal);
    assert.equal(actualValue.replace(/\u00A0/g, ' ').replace(',', '').trim().toLowerCase(), String(expectedValue).replace(',', '').trim().toLowerCase(), `${columnName} mismatch. Expected: ${expectedValue}, Actual: ${actualValue}`);
}

async function assertInTableWithoutDecimal(row, columnName, expectedValue, isModal = false) {
    let actualValue = await getValueFromTable(row, columnName, isModal);
    actualValue = actualValue.replace(/\u00A0/g, ' ').replace(',', '');
    actualValue = Number(actualValue).toFixed(0);
    expectedValue = String(expectedValue).trim().toLowerCase()
    expectedValue = Number(expectedValue).toFixed(0);
    assert.equal(actualValue, expectedValue, `${columnName} mismatch. Expected: ${expectedValue}, Actual: ${actualValue}`);
}

async function assertDateInTableWithoutTime(row, columnName, expectedValue, isModal = false) {
    let actualValue = await getValueFromTable(row, columnName, isModal);
    actualValue = actualValue.replace(/\u00A0/g, ' ').replace(',', '');
    actualValue = actualValue.trim().split(' ')[0];
    expectedValue = String(expectedValue).trim().toLowerCase()
    assert.equal(actualValue, expectedValue, `${columnName} mismatch. Expected: ${expectedValue}, Actual: ${actualValue}`);
}

async function getValueFromTable(row, columnName, isModal = false) {
    let tableCellUI = null;
    if (isModal) {
        tableCellUI = tableCell({ row: row, col: await findColumnByName(columnName, true) }, within($("//main//table")));
    }
    else {
        tableCellUI = tableCell({ row: row, col: await findColumnByName(columnName) });
    }
    await highlight(tableCellUI);
    let actualValue = await tableCellUI.text();
    if (actualValue == '') {
        try {
            actualValue = await textBox(within(tableCellUI)).value();
        } catch (e) {
            actualValue = '';
        }
    }
    return actualValue;
}

step("Verify the no of items in Quotation is equal to <count>", async function (count) {
    countSaleItems = (await $("//TR[starts-with(@class,'o_data_row')]").elements()).length
    assert.equal(countSaleItems, Number(count), "Sale order lines count is not equal to " + count + ". Expected: " + count + ", Actual: " + countSaleItems);
});

step("Update the Quantity & Unit price and validate the Sub Total", async function () {
    const medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
    var row = await findRowByProduct(medicalPrescriptions.drug_name);
    var quantity = faker.number.int({ min: 1, max: 10 });
    gauge.dataStore.scenarioStore.put("updatedDrugQuantity", quantity);
    var quantityCol = await findColumnByName("Quantity");
    await click(tableCell({ row: row, col: quantityCol }))
    await write(quantity, into(textBox(within(tableCell({ row: row, col: quantityCol })))));
    await press("Tab");
    var unitPrice = faker.number.int({ min: 1, max: 100 });
    gauge.dataStore.scenarioStore.put("updatedUnitPrice", unitPrice);
    var unitPriceCol = await findColumnByName("Unit Price");
    await click(tableCell({ row: row, col: unitPriceCol }));
    await write(unitPrice, into(textBox(within(tableCell({ row: row, col: unitPriceCol })))));
    await press("Tab");
    await waitFor(1000);
    var subTotalExpected = `$ ${(quantity * unitPrice).toFixed(2)}`;
    var subTotal = (await tableCell({ row: row, col: await findColumnByName("Subtotal") }).text()).replace(/\u00A0/g, ' ');
    assert.equal(subTotal.trim(), subTotalExpected, `Sub Total mismatch. Expected: ${subTotalExpected}, Actual: ${subTotal}`);
});


step("Verify the untaxed amount, taxes, round off, Total & Total Outstanding Balance", async function () {
    var untaxedAmountExpected = await calculateUnTaxedAmount();
    var taxesPercentage = 15;
    var taxesExpected = untaxedAmountExpected * (taxesPercentage / 100);
    var totalExpected = (untaxedAmountExpected + taxesExpected).toFixed(0);
    var roundOffAmountExpected = Number(totalExpected) - (untaxedAmountExpected + taxesExpected);
    var previousOutstandingBalance = Number((await getFieldValue("Previous Outstanding Balance")).replace('$', '').replace(/\u00A0/g, ''));
    var totalOutstandingExpected = previousOutstandingBalance + Number(totalExpected);
    gauge.dataStore.scenarioStore.put("currentOutstandingDue", totalOutstandingExpected);
    await verifyFieldValue("Untaxed Amount", "$ " + (untaxedAmountExpected.toFixed(2)));
    await verifyFieldValue("Taxes", "$ " + (taxesExpected.toFixed(2)));
    await verifyFieldValue("Round Off Amount", "$ " + (roundOffAmountExpected.toFixed(2)));
    await verifyFieldValue("Total", "$ " + (Number(totalExpected).toFixed(2)));
    await verifyFieldValue("Total Outstanding Balance", "$ " + (totalOutstandingExpected.toFixed(2)));
});

async function calculateUnTaxedAmount() {
    const rowCount = (await $("//TR[starts-with(@class,'o_data_row')]").elements()).length;
    const subTotalCol = await findColumnByName("Subtotal");
    let sumUntaxedAmount = 0;
    for (let i = 0; i < rowCount; i++) {
        row = i + 1;
        const subTotalCell = await tableCell({ row: row, col: subTotalCol }).text();
        sumUntaxedAmount = sumUntaxedAmount + Number(subTotalCell.replace('$', '').replace(/\u00A0/g, ''));
    }
    return sumUntaxedAmount;
}

step("Verify the Delivery quantity for Drug, lab order and radiology order in Quotation", async function () {
    const deliveryCol = await findColumnByName("Delivery Quantity");
    const drugDeliveryQuantityActual = await tableCell({ row: await findRowByProduct((gauge.dataStore.scenarioStore.get("medicalPrescriptions")).drug_name), col: deliveryCol }).text();
    const drugDeliveryQuantityExpected = gauge.dataStore.scenarioStore.get("updatedDrugQuantity");
    assert.equal(drugDeliveryQuantityActual, drugDeliveryQuantityExpected, `Drug Delivery Quantity mismatch. Expected: ${drugDeliveryQuantityExpected}, Actual: ${drugDeliveryQuantityActual}`);
    const labDeliveryQuantityExpected = "0.00";
    const labDeliveryQuantityActual = await tableCell({ row: await findRowByProduct(gauge.dataStore.scenarioStore.get("LabTest")), col: deliveryCol }).text();
    assert.equal(labDeliveryQuantityActual, labDeliveryQuantityExpected, `Lab Delivery Quantity mismatch. Expected: ${labDeliveryQuantityExpected}, Actual: ${labDeliveryQuantityActual}`);
    const radiologyDeliveryQuantityExpected = "0.00";
    const radiologyDeliveryQuantityActual = await tableCell({ row: await findRowByProduct(gauge.dataStore.scenarioStore.get("radiologyTest")), col: deliveryCol }).text();
    assert.equal(radiologyDeliveryQuantityActual, radiologyDeliveryQuantityExpected, `Radiology Delivery Quantity mismatch. Expected: ${radiologyDeliveryQuantityExpected}, Actual: ${radiologyDeliveryQuantityActual}`);
});

step("Verify the delivery items", async function () {
    const medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
    var drugName = medicalPrescriptions.drug_name
    const drugDeliveryQuantityExpected = gauge.dataStore.scenarioStore.get("updatedDrugQuantity");
    const row = await findRowByProduct(drugName);

    // Validate Product
    const product = await tableCell({ row: row, col: await findColumnByName("Product") }).text();
    assert.ok(product.trim().toLowerCase().includes(drugName.toLowerCase()), `Product ${drugName} not found in the table.`);

    // Validate Done Quantity
    const done = await tableCell({ row: row, col: await findColumnByName("Done") }).text();
    assert.equal(done.trim().toLowerCase(), drugDeliveryQuantityExpected.toFixed(2), `Done Quantity mismatch. Expected: ${drugDeliveryQuantityExpected}, Actual: ${done}`);
});

step("Click on View <name> button on Odoo", async function (name) {
    await evaluate($("//span[normalize-space()='" + name + "']/ancestor::BUTTON"), (el) => el.click())
    await waitFor(3000);
});

step("Verify the Invoice items", async function () {
    await verifyDrugItemInInvoice();
    var labTest = gauge.dataStore.scenarioStore.get("LabTest")
    await verifyOrderItemInInvoice(labTest);

    var radiologyTest = gauge.dataStore.scenarioStore.get("radiologyTest")
    await verifyOrderItemInInvoice(radiologyTest);
});


async function verifyDrugItemInInvoice() {
    const medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
    var drugName = medicalPrescriptions.drug_name
    const row = await findRowByProduct(drugName);
    var expectedQuantity = Number(gauge.dataStore.scenarioStore.get("updatedDrugQuantity"))
    var expectedDescription = `${drugName} - ${Number(gauge.dataStore.scenarioStore.get("drugQuantity")).toFixed(1)} ${medicalPrescriptions.units}`
    var expectedUnitPrice = Number(gauge.dataStore.scenarioStore.get("updatedUnitPrice"))
    var expectedTaxes = "Tax 15%"
    var expectedSubTotal = "$ " + (expectedQuantity * expectedUnitPrice).toFixed(2)
    await verifyItemsInInvoice(row, drugName, expectedDescription, expectedQuantity.toFixed(2), expectedUnitPrice.toFixed(2), expectedTaxes, expectedSubTotal);
}

async function verifyOrderItemInInvoice(strProduct) {
    const row = await findRowByProduct(strProduct);
    var expectedQuantity = 1
    var expectedDescription = `${strProduct} - ${expectedQuantity.toFixed(1)} Unit(s)`
    var expectedUnitPrice = 1
    var expectedTaxes = "Tax 15%"
    var expectedSubTotal = "$ 1.00"
    await verifyItemsInInvoice(row, strProduct, expectedDescription, expectedQuantity.toFixed(2), expectedUnitPrice.toFixed(2), expectedTaxes, expectedSubTotal);
}

async function verifyItemsInInvoice(row, productName, expectedLabel, expectedQuantity, expectedPrice, expectedTaxes, expectedSubTotal) {
    const product = await tableCell({ row: row, col: await findColumnByName("Product") }).text();
    assert.ok(product.trim().toLowerCase().includes(productName.toLowerCase()), `Product ${productName} not found in the table.`);

    // Validate Description
    await assertInTable(row, "Label", expectedLabel);

    // Validate Quantity
    await assertInTable(row, "Quantity", expectedQuantity);

    // Validate Unit Price
    await assertInTable(row, "Price", expectedPrice);

    // Validate Tax
    await assertInTable(row, "Taxes", expectedTaxes);

    // Validate Sub Total
    await assertInTable(row, "Subtotal", expectedSubTotal);
}

step("Verify the invoice price details for a new customer", async function () {
    var untaxedAmountExpected = await calculateUnTaxedAmount();
    var taxesPercentage = 15;
    var taxesExpected = untaxedAmountExpected * (taxesPercentage / 100);
    var totalExpected = (untaxedAmountExpected + taxesExpected).toFixed(0);
    var roundOffAmountExpected = Number(totalExpected) - (untaxedAmountExpected + taxesExpected);
    await verifyFieldValue("Untaxed Amount", "$ " + (untaxedAmountExpected.toFixed(2)));
    await verifyFieldValue("Tax", "$ " + (taxesExpected.toFixed(2)));
    await verifyFieldValue("Discount Method", "No Discount");
    await verifyFieldValue("Round Off Amount", "$ " + (roundOffAmountExpected.toFixed(2)));
    await verifyFieldValue("Invoice Total", "$ " + (Number(totalExpected).toFixed(2)));
    await verifyFieldValue("Amount Due", "$ " + (Number(totalExpected).toFixed(2)));

});

step("Verify the Drug order in Quotation with expected quantity, price, description, taxes and sub total", async function () {
    await verifyDrugItemInQuotation();
});

step("Verify the same product is added again in the same quotation", async function () {
    const medicalPrescriptions = gauge.dataStore.scenarioStore.get("medicalPrescriptions")
    var drugName = medicalPrescriptions.drug_name
    var expectedQuantity = Number(gauge.dataStore.scenarioStore.get("drugQuantity")).toFixed(2)
    var expectedDescription = `${drugName} - ${Number(expectedQuantity).toFixed(1)} ${medicalPrescriptions.units}`
    await assertSameProductIsAdded(drugName, expectedDescription, 2);
});

step("Verify the previous outstanding due for the existing customer", async function () {
    let currentOutstandingDue = gauge.dataStore.scenarioStore.get("currentOutstandingDue");
    await verifyFieldValue("Previous Outstanding Balance", "$ " + (currentOutstandingDue.toFixed(2)));
});

step("Enter company name in create vendor page", async function () {
    let companyName = faker.company.name();
    gauge.dataStore.scenarioStore.put("companyName", companyName);
    await write(companyName, into($("//div[@name='name']//input")));
});

step("Enter customer name in create customer page", async function () {
    let customerName = faker.person.fullName();
    gauge.dataStore.scenarioStore.put("customerName", customerName);
    await write(customerName, into($("//div[@name='name']//input")));
});

step("Click save button odoo", async function () {
    await click(button({ "aria-label": "Save manually" }));
});

step("Enter company name in Requests for Quotation page", async function () {
    let companyName = gauge.dataStore.scenarioStore.get("companyName");
    await enterNameInQuotation(companyName);
});

step("Enter customer name in Quotation page", async function () {
    let companyName = gauge.dataStore.scenarioStore.get("customerName");
    await enterNameInQuotation(companyName);
});

async function enterNameInQuotation(strName) {
    await write(strName, into(textBox({ "id": "partner_id" })));
    await selectFromAutoCompleteDropDown(strName);

}
async function selectFromAutoCompleteDropDown(strValue) {
    let dropDownXpath = `//ul[@role='listbox']//a[normalize-space()='${strValue}']`
    await waitFor(() => $(dropDownXpath).isVisible(), 40000)
    await click($(dropDownXpath), { force: true });

}
step("Add products in Requests for Quotation page", async function () {
    var purchaseOrder = gauge.dataStore.scenarioStore.get("purchaseOrder");
    let row = 0;
    let UntaxedAmount = new Decimal(0);
    for (let product of purchaseOrder.products) {
        row++;
        let quantity = faker.number.int({ min: 1, max: 10 });
        product["quantity"] = quantity;
        let unitPrice = new Decimal(faker.number.int({ min: 10, max: 100 }));
        product["Unit Price"] = unitPrice;
        let mrp = unitPrice.plus(unitPrice.times(0.30));
        product["MRP"] = mrp;
        let taxes = 0.15;
        let markUpPercentage = 0.10;
        let subTotal = unitPrice.times(quantity);
        product["Subtotal"] = subTotal;
        UntaxedAmount = UntaxedAmount.plus(subTotal);
        let costprice = unitPrice.plus(unitPrice.times(taxes));
        product["Cost Price"] = costprice;
        let salePrice = costprice.plus(costprice.times(markUpPercentage));
        product["Sale Price"] = salePrice;

        await click("Add a product");

        await write(product["name"], into(textBox(within(tableCell({ row: row, col: await findColumnByName("Product") })))));
        await click(link(product["description"]));

        await waitFor(2000)
        await assertInTable(row, "Description", product["description"]);

        await clear(textBox(within(tableCell({ row: row, col: await findColumnByName("Quantity") }))));
        await write(quantity, into(textBox(within(tableCell({ row: row, col: await findColumnByName("Quantity") })))));

        await assertInTable(row, "UoM", product["UoM"]);

        await click(tableCell({ row: row, col: await findColumnByName("Unit Price") }))
        await write(unitPrice, into(textBox(within(tableCell({ row: row, col: await findColumnByName("Unit Price") })))));

        await click(tableCell({ row: row, col: await findColumnByName("MRP") }))
        await write(mrp, into(textBox(within(tableCell({ row: row, col: await findColumnByName("MRP") })))));

        await assertInTable(row, "Taxes", product["Taxes"]);

        await assertInTable(row, "Subtotal", "$ " + subTotal.toFixed(2));
    }
    gauge.dataStore.scenarioStore.put("untaxedAmount", UntaxedAmount);
});

step("Validate the price details in request for quotations page", async function () {
    await verifyFieldValue("Untaxed Amount", "$ " + gauge.dataStore.scenarioStore.get("untaxedAmount").toFixed(2));
    await verifyFieldValue("Tax 15%", "$ " + ((gauge.dataStore.scenarioStore.get("untaxedAmount")).times(0.15)).toFixed(2));
    await verifyFieldValue("Total", "$ " + (gauge.dataStore.scenarioStore.get("untaxedAmount")).times(0.15).plus(gauge.dataStore.scenarioStore.get("untaxedAmount")).toFixed(2));
});

step("Confirm purchase Order", async function () {
    await click("CONFIRM ORDER");
    await waitFor(async () => (await text("Purchase Order").exists()))
    assert.ok(await text("Purchase Order").exists());
});

step("Validate the <columnName> quantity for all products", async function (columnName) {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;
    for (let product of products) {
        let quantity = product.quantity;
        await assertInTable(await findRowByProduct(product.name), columnName, quantity.toFixed(2));
    }
});

step("Add the detailed operations for each product not maintained by batch", async function () {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;

    for (let product of products) {
        let row = await findRowByProduct(product.name);
        await click($(`(//TR[starts-with(@class,'o_data_row')])[${row}]//button[@name='action_show_details']`));
        await waitFor(async () => (await text("Detailed Operations").exists()))
        await click(link("Add a line"));
        await waitFor(2000)
        const doneQuantityCell = tableCell({ row: 1, col: await findColumnByName("Done", true) }, within($("//main//table")));
        await click(doneQuantityCell);
        await clear(textBox(within(doneQuantityCell)));
        await write(product.quantity, into(textBox(within(doneQuantityCell))));
        await click(button("CONFIRM"));
        await waitFor(2000)
    }
});

step("Validate the quantities entered along with Cost price, Sale price & MRP", async function () {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;
    for (let product of products) {
        console.log(product);
        let row = await findRowByProduct(product.name, true);
        await assertInTable(row, "Quantity", product.quantity.toFixed(2), true);
        await assertInTable(row, "Cost Price", product["Cost Price"].toFixed(2), true);
        // await assertInTable(row, "Sale Price", product["Sale Price"].toFixed(2), true);
        await assertInTableWithoutDecimal(row, "Sale Price", product["Sale Price"], true);
        await assertInTable(row, "MRP", product["MRP"].toFixed(2), true);
    }
});

step("Validate the quantities entered along with Cost price, Sale price & MRP for product managed by lot", async function () {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;
    for (let product of products) {
        console.log(product);
        for (let lot of product.lots) {
            let row = await findRowByColumnValue("Lot/Serial Number", lot.batchNumber, true);
            await assertInTable(row, "Quantity", lot.value.toFixed(2), true);
            await assertDateInTableWithoutTime(row, "Expiration Date", lot.expiryDate, true);
            await assertInTable(row, "Cost Price", product["Cost Price"].toFixed(2), true);
            // await assertInTable(row, "Sale Price", product["Sale Price"].toFixed(2), true);
            await assertInTableWithoutDecimal(row, "Sale Price", product["Sale Price"], true);
            await assertInTable(row, "MRP", product["MRP"].toFixed(2), true);
        }

    }
});

step("Note the current product count in products page", async function () {
    var purchaseOrder = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/odoo/purchaseQuotation.json`))
    gauge.dataStore.scenarioStore.put("purchaseOrder", purchaseOrder);
    let products = purchaseOrder.products;
    for (let product of products) {
        await enterValueInSearchbox(product.name);
        await press("Enter");
        let row = await findRowByColumnValue("Product Name", product.name)
        let quantityOnHand = await getValueFromTable(row, "Quantity On Hand", false);
        product["Quantity On Hand"] = quantityOnHand;
    }
});

step("Validate current product count in products page after receiving the products and verify the new sales price, cost price & MRP are set", async function () {
    await validateQtySPCPMRP();
});

step("Validate current product count in products page after receiving the products and verify the new sales price, cost price & MRP are set, also the lot serial numbers", async function () {
    await validateQtySPCPMRP(true);
});

async function validateQtySPCPMRP(islot = false) {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;
    for (let product of products) {
        await enterValueInSearchbox(product.name);
        await press("Enter");
        let row = await findRowByColumnValue("Product Name", product.name)
        let quantityOnHand = Number(product["Quantity On Hand"])+ product.quantity;
        if (islot) {
            quantityOnHand = product.quantity;
        }
        await assertInTable(row, "Quantity On Hand", quantityOnHand.toFixed(2));
        await openItemFromListView(product.name)
        await verifyFieldValue("Sales Price", product["Sale Price"].toFixed(2));
        await verifyFieldValue("Cost", product["Unit Price"].toFixed(2));
        await verifyFieldValue("MRP", product["MRP"].toFixed(2));
        if (islot) {
            await click("Lot/Serial Numbers");
            await waitFor(1000);
            for (let lot of product.lots) {
                let lotRow = await findRowByColumnValue("Lot/Serial Number", lot.batchNumber);
                await assertInTable(lotRow, "quantity", lot.value.toFixed(2));
            }
        }
        await clickMenu("Products", "Products");
    }
}

step("Validate current product count in products page after selling the products", async function () {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;
    for (let product of products) {
        await enterValueInSearchbox(product.name);
        await press("Enter");
        let row = await findRowByColumnValue("Product Name", product.name)
        let quantityOnHand = Number(product["Quantity On Hand"]); //the received quantities are sold
        await assertInTable(row, "Quantity On Hand", quantityOnHand.toFixed(2));
        await clickMenu("Products", "Products");
    }
});

step("Validate current product count in products page after selling the products which is managed by lot, also the lot serial numbers", async function () {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;
    for (let product of products) {
        await enterValueInSearchbox(product.name);
        await press("Enter");
        let row = await findRowByColumnValue("Product Name", product.name)
        let lot = product.lots.filter(lot1 => lot1.isEarliestExpiry == true)[0];
        let quantitySold = lot.value;
        let quantityOnHand = product.quantity - quantitySold; //the earliest expiry quantities are sold
        await assertInTable(row, "Quantity On Hand", quantityOnHand.toFixed(2));
        await openItemFromListView(product.name);
        await click("Lot/Serial Numbers");
        await waitFor(1000);
        let lotRow = await findRowByColumnValue("Lot/Serial Number", lot.batchNumber);
        await assertInTable(lotRow, "quantity", "0.00");
        await clickMenu("Products", "Products");
    }
});

step("Select <radioButtonName> in customer type radio button", async function (radioButtonName) {
    await radioButton(radioButtonName).select();
});

step("Select shop as <name> in Quotation page", async function (name) {
    await write(name, into(textBox({ "id": "shop_id" })));
    await selectFromAutoCompleteDropDown(name);
});

step("Add products in Sale Quotation page", async function () {
    await addProductsInSaleQuotation();
});

step("Add products in Sale Quotation page managed by lots and verify the earliest expiry batch is auto selected", async function () {
    await addProductsInSaleQuotation(true);
});

async function addProductsInSaleQuotation(isLot = false) {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;
    let row = 0;
    for (let product of products) {
        row++;
        await click("Add a product");

        await write(product["name"], into(textBox(within(tableCell({ row: row, col: await findColumnByName("Product") })))));
        await click(link(product["description"]));

        await waitFor(2000)
        await assertInTable(row, "Description", product["description"]);
        let quantity = product.quantity;
        if (isLot) {
            let lot = product.lots.filter(lot1 => lot1.isEarliestExpiry == true)[0];
            quantity = lot.value;
            //reduced one day due to bug.
            let batchNo = `${lot.batchNumber} [${moment(lot.expiryDate, 'MM/DD/YYYY').add(-1, 'days').format('MMM DD,YYYY')}], ${quantity.toFixed(1)}`;
            await assertInTable(row, "Batch No", batchNo);
            await assertDateInTableWithoutTime(row, "Expiry Date", lot.expiryDate);
        }

        await clear(textBox(within(tableCell({ row: row, col: await findColumnByName("Quantity") }))));
        await write(quantity, into(textBox(within(tableCell({ row: row, col: await findColumnByName("Quantity") })))));
        await press("Tab");

        await assertInTable(row, "Delivery Quantity", "0.00");

        await assertInTable(row, "UoM", product["UoM"]);

        await assertInTable(row, "Unit Price", product["Sale Price"].toFixed(2));

        await assertInTable(row, "Taxes", "Tax 15%");

        let subTotal = Number(product["Sale Price"].toFixed(2)) * quantity;
        await assertInTable(row, "Subtotal", "$ " + subTotal.toFixed(2));
    }
}

step("Create a storable product which is managed by Lots", async function () {
    var purchaseOrder = JSON.parse(fileExtension.parseContent(`./bahmni-e2e-common-flows/data/odoo/purchaseQuotation.json`))
    gauge.dataStore.scenarioStore.put("purchaseOrder", purchaseOrder);
    let products = purchaseOrder.products;
    for (let product of products) {
        await clickMenu("Products", "Products");
        await click(button("New"))
        await waitFor(500);
        let productName = generateDrugName();
        await write(productName, into($("//div[@name='name']//input")));
        await dropDown({ "id": "detailed_type" }).select("Storable Product");
        await click(link("Inventory", below("Product Name")));
        await radioButton("By Lots").select();
        await checkBox("Expiration Date").check();
        await write("30", into($("//input[@id='expiration_time']")));
        await click(button({ "aria-label": "Save manually" }));
        product.name = productName;
        product.description = productName + " (All)";
    }
});

function generateDrugName() {
    const prefixes = ['Apo', 'Cyto', 'Dura', 'Ecto', 'Glyco', 'Hemo', 'Lipo', 'Neuro', 'Proto', 'Thera'];
    const infixes = ['moxi', 'ceta', 'dina', 'prolo', 'fina', 'vira', 'lexa', 'mura', 'sera', 'xila'];
    const suffixes = ['done', 'fen', 'line', 'zole', 'vir', 'ban', 'dine', 'xine', 'tine', 'zide'];
    const strengths = [1, 2, 5, 10, 25, 50, 100, 150, 200, 250, 500, 650, 1000, 1250];
    const units = ['mg', 'g', 'ml', 'mcg'];


    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const infix = infixes[Math.floor(Math.random() * infixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const strength = strengths[Math.floor(Math.random() * strengths.length)];
    const unit = units[Math.floor(Math.random() * units.length)];

    const now = new Date();
    const hhmmss = now.toTimeString().split(' ')[0].replace(/:/g, '');

    return `${prefix}${infix}${suffix} ${strength}${unit} (${hhmmss})`;
}

step("Add the detailed operations for each product maintained by batch", async function () {
    let products = gauge.dataStore.scenarioStore.get("purchaseOrder").products;
    for (let product of products) {
        let row = await findRowByProduct(product.name);
        await click($(`(//TR[starts-with(@class,'o_data_row')])[${row}]//button[@name='action_show_details']`));
        await waitFor(async () => (await text("Detailed Operations").exists()))
        product.lots = splitAndSetExpiry(product.quantity);
        let rowAdditionalDetails = 0;
        for (let lot of product.lots) {
            rowAdditionalDetails++;
            await click(link("Add a line"));
            await waitFor(2000)
            //enter Lot
            await write(lot.batchNumber, into(textBox(within(tableCell({ row: rowAdditionalDetails, col: await findColumnByName("Lot/Serial Number", true) })))));

            //enter expiry
            const calendarCell = tableCell({ row: rowAdditionalDetails, col: await findColumnByName("Expiration Date", true) }, within($("//main//table")));
            await click(calendarCell);
            await clear(textBox(within(calendarCell)))
            await write(lot.expiryDate, into(textBox(within(calendarCell))));

            //enter done quantity
            const doneQuantityCell = tableCell({ row: rowAdditionalDetails, col: await findColumnByName("Done", true) }, within($("//main//table")));
            await click(doneQuantityCell);
            await clear(textBox(within(doneQuantityCell)));
            await write(lot.value, into(textBox(within(doneQuantityCell))));
        }
        await click(button("CONFIRM"));
        await waitFor(2000)
    }
});

function randomSplit(value, numberOfParts) {
    if (numberOfParts <= 0 || value <= 0) {
        throw new Error("Number of parts and value must be greater than zero.");
    }

    // Generate random points using faker and sort them
    let points = Array.from({ length: numberOfParts - 1 }, () => faker.number.int({ min: 1, max: value })).sort((a, b) => a - b);

    // Generate parts based on points
    let parts = [];
    let previousPoint = 0;

    for (let point of points) {
        let part = Math.floor(point - previousPoint);
        if (part > 0) {  // Only push if part is greater than 0
            parts.push(part);
        }
        previousPoint = point;
    }

    // Calculate the last part
    let lastPart = value - Math.floor(previousPoint);
    if (lastPart > 0) {  // Only push if lastPart is greater than 0
        parts.push(lastPart);
    }

    return parts;
}
function splitAndSetExpiry(value) {
    const numberOfParts = faker.number.int({ min: 1, max: 3 });
    const parts = randomSplit(value, numberOfParts);
    // Set expiry dates and batch numbers
    let partsWithDetails = parts.map(part => {
        return {
            value: part,
            batchNumber: faker.string.alphanumeric(10),
            expiryDate: moment().add(faker.number.int({ min: 60, max: 730 }), 'days').format('MM/DD/YYYY')
        };
    });

    // Find the earliest expiry date
    const earliestExpiryDate = partsWithDetails.reduce((earliest, part) => {
        return moment(part.expiryDate, 'MM/DD/YYYY').isBefore(moment(earliest, 'MM/DD/YYYY')) ? part.expiryDate : earliest;
    }, partsWithDetails[0].expiryDate);

    // Add isEarliestExpiry property
    partsWithDetails = partsWithDetails.map(part => {
        return {
            value: part.value,
            batchNumber: part.batchNumber,
            expiryDate: part.expiryDate,
            isEarliestExpiry: part.expiryDate === earliestExpiryDate
        };
    });

    return partsWithDetails;
}