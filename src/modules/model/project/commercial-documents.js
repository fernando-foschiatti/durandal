const dataAccess = require('../../data-access/data-access');

const purchases = {
    returnAvailablePeriods: () => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults('SELECT YEAR(`a`.`date`) AS `year`, MONTH(`a`.`date`) AS `month` FROM `drn_commercial_document` AS `a` JOIN `drn_purchase_event_commercial_document` AS `b` ON `b`.`drn_commercial_document_id` = `a`.`drn_commercial_document_id` GROUP BY `year`, `month` ORDER BY `year` DESC, `month` DESC')
                .then(rows => resolve(rows.map(row => ({
                    year: row.year,
                    month: row.month
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnByPeriodSortedByDate: (year, month) => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`date\`, \`a\`.\`exempt\`, \`a\`.\`letter\`, \`a\`.\`net105\`, \`a\`.\`net21\`, \`a\`.\`number\`, \`a\`.\`othertaxes\`, \`a\`.\`puntodeventa\`, \`a\`.\`total\`, \`a\`.\`type\`, \`a\`.\`vat105\`, \`a\`.\`vat21\`, \`f\`.\`apellidoynombreorazonsocial\`, \`f\`.\`numerodecuit\`, \`f\`.\`tipodecuit\`, \`h\`.\`number\` AS \`file_number\` FROM \`drn_commercial_document\` AS \`a\` JOIN \`drn_purchase_event_commercial_document\` AS \`b\` ON \`b\`.\`drn_commercial_document_id\` = \`a\`.\`drn_commercial_document_id\` JOIN \`drn_purchase_event\` AS \`c\` ON \`c\`.\`drn_purchase_event_id\` = \`b\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`d\` ON \`d\`.\`drn_purchase_id\` = \`c\`.\`drn_purchase_id\` JOIN \`drn_site\` AS \`e\` ON \`e\`.\`drn_site_id\` = \`d\`.\`drn_site_id\` JOIN \`drn_customer_and_supplier\` AS \`f\` ON \`f\`.\`drn_customer_and_supplier_id\` = \`e\`.\`drn_customer_and_supplier_id\` LEFT JOIN \`drn_purchase_event_file\` AS \`g\` ON \`g\`.\`drn_purchase_event_id\` = \`c\`.\`drn_purchase_event_id\` LEFT JOIN \`drn_file\` AS \`h\` ON \`h\`.\`drn_file_id\` = \`g\`.\`drn_file_id\` WHERE YEAR(\`a\`.\`date\`) = ${year} AND MONTH(\`a\`.\`date\`) = ${month + 1} ORDER BY \`a\`.\`date\``)
                .then(rows => resolve(rows.map(row => ({
                    date: row.date,
                    exempt: row.exempt,
                    letter: row.letter,
                    net105: row.net105,
                    net21: row.net21,
                    number: row.number,
                    otherTaxes: row.othertaxes,
                    puntoDeVenta: row.puntodeventa,
                    total: row.total,
                    type: row.type,
                    vat105: row.vat105,
                    vat21: row.vat21,
                    event: {
                        file: {
                            number: row.file_number
                        },
                        purchase: {
                            site: {
                                supplier: {
                                    apellidoYNombreORazonSocial: row.apellidoynombreorazonsocial,
                                    numeroDeCuit: row.numerodecuit,
                                    tipoDeCuit: row.tipodecuit
                                }
                            }
                        }
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnInvoicesByPurchaseNumberSortedByDate: purchaseNumber => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`date\`, \`a\`.\`letter\`, \`a\`.\`number\`, \`a\`.\`puntodeventa\`, \`a\`.\`total\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`a\`.\`uuid\`) AS \`uuid\`, \`b\`.\`balance\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`d\`.\`uuid\`) AS \`event_uuid\` FROM \`drn_commercial_document\` AS \`a\` JOIN \`drn_invoice_balance\` AS \`b\` ON \`b\`.\`drn_commercial_document_id\` = \`a\`.\`drn_commercial_document_id\` JOIN \`drn_purchase_event_commercial_document\` AS \`c\` ON \`c\`.\`drn_commercial_document_id\` = \`a\`.\`drn_commercial_document_id\` JOIN \`drn_purchase_event\` AS \`d\` ON \`d\`.\`drn_purchase_event_id\` = \`c\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`e\` ON \`e\`.\`drn_purchase_id\` = \`d\`.\`drn_purchase_id\` WHERE \`a\`.\`type\` = 'Invoice' AND \`e\`.\`number\` = ${purchaseNumber} ORDER BY \`a\`.\`date\``)
                .then(rows => resolve(rows.map(row => ({
                    date: row.date,
                    letter: row.letter,
                    number: row.number,
                    puntoDeVenta: row.puntodeventa,
                    total: row.total,
                    uuid: dataAccess.uuid.toString(row.uuid),
                    balance: {
                        balance: row.balance
                    },
                    event: {
                        uuid: dataAccess.uuid.toString(row.event_uuid)
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnInvoicesNotesByPurchaseNumberSortedByDate: purchaseNumber => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`date\`, \`a\`.\`letter\`, \`a\`.\`number\`, \`a\`.\`puntodeventa\`, \`a\`.\`type\`, \`b\`.\`amount\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`c\`.\`uuid\`) AS \`invoice_uuid\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`h\`.\`uuid\`) AS \`event_uuid\` FROM \`drn_commercial_document\` AS \`a\` JOIN \`drn_invoice_note\` AS \`b\` ON \`b\`.\`drn_note_id\` = \`a\`.\`drn_commercial_document_id\` JOIN \`drn_commercial_document\` AS \`c\` ON \`c\`.\`drn_commercial_document_id\` = \`b\`.\`drn_invoice_id\` JOIN \`drn_purchase_event_commercial_document\` AS \`d\` ON \`d\`.\`drn_commercial_document_id\` = \`c\`.\`drn_commercial_document_id\` JOIN \`drn_purchase_event\` AS \`e\` ON \`e\`.\`drn_purchase_event_id\` = \`d\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`f\` ON \`f\`.\`drn_purchase_id\` = \`e\`.\`drn_purchase_id\` JOIN \`drn_purchase_event_commercial_document\` AS \`g\` ON \`g\`.\`drn_commercial_document_id\` = \`a\`.\`drn_commercial_document_id\` JOIN \`drn_purchase_event\` AS \`h\` ON \`h\`.\`drn_purchase_event_id\` = \`g\`.\`drn_purchase_event_id\` WHERE \`f\`.\`number\` = ${purchaseNumber} ORDER BY \`a\`.\`date\``)
                .then(rows => resolve(rows.map(row => ({
                    date: row.date,
                    letter: row.letter,
                    number: row.number,
                    puntoDeVenta: row.puntodeventa,
                    type: row.type,
                    invoice: {
                        amount: row.amount,
                        uuid: dataAccess.uuid.toString(row.invoice_uuid)
                    },
                    event: {
                        uuid: dataAccess.uuid.toString(row.event_uuid)
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnInvoicesPurchasesCategoriesByPurchaseNumberSortedByPurchaseCategoryName: purchaseNumber => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`description\`, \`a\`.\`name\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`c\`.\`uuid\`) AS \`invoice_uuid\` FROM \`drn_purchase_category\` AS \`a\` JOIN \`drn_purchase_invoice_category\` AS \`b\` ON \`b\`.\`drn_purchase_category_id\` = \`a\`.\`drn_purchase_category_id\` JOIN \`drn_commercial_document\` AS \`c\` ON \`c\`.\`drn_commercial_document_id\` = \`b\`.\`drn_commercial_document_id\` JOIN \`drn_purchase_event_commercial_document\` AS \`d\` ON \`d\`.\`drn_commercial_document_id\` = \`c\`.\`drn_commercial_document_id\` JOIN \`drn_purchase_event\` AS \`e\` ON \`e\`.\`drn_purchase_event_id\` = \`d\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`f\` ON \`f\`.\`drn_purchase_id\` = \`e\`.\`drn_purchase_id\` WHERE \`f\`.\`number\` = ${purchaseNumber} ORDER BY \`a\`.\`name\``)
                .then(rows => resolve(rows.map(row => ({
                    description: row.description,
                    name: row.name,
                    invoice: {
                        uuid: dataAccess.uuid.toString(row.invoice_uuid)
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    })
};

module.exports = {
    name_: 'commercialDocuments',
    purchases: purchases
};
