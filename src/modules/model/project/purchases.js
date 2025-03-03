const dataAccess = require('../../data-access/data-access');

const balances = {
    returnByPurchaseNumberSortedByEventTimestamp: purchaseNumber => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT ${dataAccess.uuid.returnSelectFunctionName()}(\`a\`.\`uuid\`) AS \`uuid\`, \`a\`.\`amount\`, \`a\`.\`balance\`, \`b\`.\`timestamp\` FROM \`drn_purchase_balance\` AS \`a\` JOIN \`drn_purchase_event\` AS \`b\` ON \`b\`.\`drn_purchase_event_id\` = \`a\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`c\` ON \`c\`.\`drn_purchase_id\` = \`b\`.\`drn_purchase_id\` WHERE \`c\`.\`number\` = ${purchaseNumber} ORDER BY \`b\`.\`timestamp\``)
                .then(rows => resolve(rows.map(row => ({
                    uuid: dataAccess.uuid.toString(row.uuid),
                    amount: row.amount,
                    balance: row.balance,
                    event: {
                        timestamp: row.timestamp,
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnPurchasesCategoriesByPurchaseNumberSortedByPurchaseCategoryName: purchaseNumber => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`description\`, \`a\`.\`name\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`c\`.\`uuid\`) AS \`balance_uuid\` FROM \`drn_purchase_category\` AS \`a\` JOIN \`drn_purchase_balance_category\` AS \`b\` ON \`b\`.\`drn_purchase_category_id\` = \`a\`.\`drn_purchase_category_id\` JOIN \`drn_purchase_balance\` AS \`c\` ON \`c\`.\`drn_purchase_balance_id\` = \`b\`.\`drn_purchase_balance_id\` JOIN \`drn_purchase_event\` AS \`d\` ON \`d\`.\`drn_purchase_event_id\` = \`c\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`e\` ON \`e\`.\`drn_purchase_id\` = \`d\`.\`drn_purchase_id\` WHERE \`e\`.\`number\` = ${purchaseNumber} ORDER BY \`a\`.\`name\``)
                .then(rows => resolve(rows.map(row => ({
                    description: row.description,
                    name: row.name,
                    balance: {
                        balance: {
                            uuid: dataAccess.uuid.toString(row.balance_uuid)
                        }
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    updateBalance: uuid => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`drn_purchase_balance_id\`, \`a\`.\`amount\` - IFNULL(SUM(\`c\`.\`amount\`), 0) AS \`updated_balance\` FROM \`drn_purchase_balance\` AS \`a\` JOIN \`drn_purchase_balance_payment\` AS \`b\` ON \`b\`.\`drn_purchase_balance_id\` = \`a\`.\`drn_purchase_balance_id\` JOIN \`drn_purchase_payment\` AS \`c\` ON \`c\`.\`drn_purchase_payment_id\` = \`b\`.\`drn_purchase_payment_id\` WHERE \`a\`.\`uuid\` = ${dataAccess.uuid.returnWhereFunction(uuid)}`)
                .then(rows => dataAccess.returnQueryResults(`UPDATE \`drn_purchase_balance\` AS \`a\` SET \`a\`.\`balance\` = ${rows[0].updated_balance} WHERE \`a\`.\`drn_purchase_balance_id\` = ${rows[0].drn_purchase_balance_id}`))
                .then(() => resolve())
                .catch(error => reject(error));
                break;
        }
    })
};

const events = {
    add: (details, purchaseNumber, status, timestamp, usersUuids) => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                let identifier;
                dataAccess.transaction.start()
                .then(() => dataAccess.returnQueryResults(`INSERT INTO \`drn_purchase_event\` VALUES(NULL, ${dataAccess.returnEscaped(details)}, (SELECT \`a\`.\`drn_purchase_id\` FROM \`drn_purchase\` AS \`a\` WHERE \`a\`.\`number\` = ${purchaseNumber}), ${dataAccess.returnEscaped(timestamp)}, ${dataAccess.uuid.returnInsertFunction()})`))
                .then(identifier_ => {
                    identifier = identifier_;
                    if (!status) return;

                    return dataAccess.returnQueryResults(`INSERT INTO \`drn_purchase_event_status\` VALUES(${identifier}, '${status}')`)
                    .then(() => dataAccess.returnQueryResults(`SELECT \`a\`.\`status\` FROM \`drn_purchase_event_status\` AS \`a\` JOIN \`drn_purchase_event\` AS \`b\` ON \`b\`.\`drn_purchase_event_id\` = \`a\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`c\` ON \`c\`.\`drn_purchase_id\` = \`b\`.\`drn_purchase_id\` WHERE \`c\`.\`number\` = ${purchaseNumber} ORDER BY \`b\`.\`timestamp\` DESC LIMIT 1`))
                    .then(rows => dataAccess.returnQueryResults(`UPDATE \`drn_purchase\` AS \`a\` SET \`a\`.\`status\` = '${rows[0]?.status || 'Not started'}' WHERE \`a\`.\`number\` = ${purchaseNumber}`))
                })
                .then(() => Promise.all(usersUuids.map(userUuid => dataAccess.returnQueryResults(`INSERT INTO \`drn_purchase_event_user\` VALUES(${identifier}, (SELECT \`a\`.\`vxn_user_id\` FROM \`vxn_user\` AS \`a\` WHERE \`a\`.\`uuid\` = ${dataAccess.uuid.returnWhereFunction(userUuid)}))`))))
                .then(() => dataAccess.transaction.commit())
                .then(() => dataAccess.returnQueryResults(`SELECT ${dataAccess.uuid.returnSelectFunctionName()}(\`a\`.\`uuid\`) AS \`uuid\` FROM \`drn_purchase_event\` AS \`a\` WHERE \`a\`.\`drn_purchase_event_id\` = ${identifier}`))
                .then(rows => resolve(dataAccess.uuid.toString(rows[0].uuid)))
                .catch(error => {
                    dataAccess.transaction.rollBack()
                    .then(() => reject(error))
                    .catch(error => reject(error))
                });
                break;
        }
    }),
    returnByPurchaseNumberSortedByTimestamp: purchaseNumber => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`details\`, \`a\`.\`timestamp\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`a\`.\`uuid\`) AS \`uuid\`, \`c\`.\`status\` FROM \`drn_purchase_event\` AS \`a\` JOIN \`drn_purchase\` AS \`b\` ON \`b\`.\`drn_purchase_id\` = \`a\`.\`drn_purchase_id\` LEFT JOIN \`drn_purchase_event_status\` AS \`c\` ON \`c\`.\`drn_purchase_event_id\` = \`a\`.\`drn_purchase_event_id\` WHERE \`b\`.\`number\` = ${purchaseNumber} ORDER BY \`a\`.\`timestamp\``)
                .then(rows => resolve(rows.map(row => ({
                    details: row.details,
                    timestamp: row.timestamp,
                    uuid: dataAccess.uuid.toString(row.uuid),
                    status: {
                        status: row.status
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnExistsByTimestampPurchaseNumber: (timestamp, purchaseNumber) => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`drn_purchase_event_id\` FROM \`drn_purchase_event\` AS \`a\` JOIN \`drn_purchase\` AS \`b\` ON \`b\`.\`drn_purchase_id\` = \`a\`.\`drn_purchase_id\` WHERE \`a\`.\`timestamp\` = ${dataAccess.returnEscaped(timestamp)} AND \`b\`.\`number\` = ${purchaseNumber}`)
                .then(rows => resolve(rows.length))
                .catch(error => reject(error));
                break;
        }
    }),
    returnTimestampPurchaseNumberByUuid: uuid => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`timestamp\`, \`b\`.\`number\` FROM \`drn_purchase_event\` AS \`a\` JOIN \`drn_purchase\` AS \`b\` ON \`b\`.\`drn_purchase_id\` = \`a\`.\`drn_purchase_id\` WHERE \`a\`.\`uuid\` = ${dataAccess.uuid.returnWhereFunction(uuid)}`)
                .then(rows => resolve(rows[0] ? { timestamp: rows[0].timestamp, purchase: { number: rows[0].number } } : null))
                .catch(error => reject(error));
                break;
        }
    }),
    users: {
        returnByPurchaseNumberSortedByInitials: purchaseNumber => new Promise((resolve, reject) => {
            switch (dataAccess.normalizedTypeName) {
                case 'mysql':
                    dataAccess.returnQueryResults(`SELECT \`a\`.\`backgroundcolor\`, \`a\`.\`initials\`, \`a\`.\`isforegroundcolorblack\`, \`a\`.\`name\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`a\`.\`uuid\`) AS \`uuid\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`c\`.\`uuid\`) AS \`event_uuid\` FROM \`vxn_user\` AS \`a\` JOIN \`drn_purchase_event_user\` AS \`b\` ON \`b\`.\`vxn_user_id\` = \`a\`.\`vxn_user_id\` JOIN \`drn_purchase_event\` AS \`c\` ON \`c\`.\`drn_purchase_event_id\` = \`b\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`d\` ON \`d\`.\`drn_purchase_id\` = \`c\`.\`drn_purchase_id\` WHERE \`d\`.\`number\` = ${purchaseNumber} ORDER BY \`a\`.\`initials\``)
                    .then(rows => resolve(rows.map(row => ({
                        backgroundColor: row.backgroundcolor,
                        initials: row.initials,
                        isForegroundColorBlack: row.isforegroundcolorblack ? true : false,
                        name: row.name,
                        uuid: dataAccess.uuid.toString(row.uuid),
                        event: {
                            uuid: dataAccess.uuid.toString(row.event_uuid)
                        }
                    }))))
                    .catch(error => reject(error));
                    break;
            }
        })
    }
};

const payments = {
    returnAvailablePeriods: () => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults('SELECT YEAR(`b`.`timestamp`) AS `year`, MONTH(`b`.`timestamp`) AS `month` FROM `drn_purchase_payment` AS `a` JOIN `drn_purchase_event` AS `b` ON `b`.`drn_purchase_event_id` = `a`.`drn_purchase_event_id` GROUP BY `year`, `month` ORDER BY `year` DESC, `month` DESC')
                .then(rows => resolve(rows.map(row => ({
                    year: row.year,
                    month: row.month
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnByPeriodSortedBySupplierNamePurchaseNumber: (year, month) => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`amount\`, \`c\`.\`name\` AS \`purchase_name\`, \`c\`.\`number\`, \`e\`.\`name\` AS \`customer_and_supplier_name\`, \`e\`.\`slug\` FROM \`drn_purchase_payment\` AS \`a\` JOIN \`drn_purchase_event\` AS \`b\` ON \`b\`.\`drn_purchase_event_id\` = \`a\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`c\` ON \`c\`.\`drn_purchase_id\` = \`b\`.\`drn_purchase_id\` JOIN \`drn_site\` AS \`d\` ON \`d\`.\`drn_site_id\` = \`c\`.\`drn_site_id\` JOIN \`drn_customer_and_supplier\` AS \`e\` ON \`e\`.\`drn_customer_and_supplier_id\` = \`d\`.\`drn_customer_and_supplier_id\` WHERE YEAR(\`b\`.\`timestamp\`) = ${year} AND MONTH(\`b\`.\`timestamp\`) = ${month + 1} ORDER BY \`e\`.\`name\`, \`c\`.\`number\``)
                .then(rows => resolve(rows.map(row => ({
                    amount: row.amount,
                    event: {
                        purchase: {
                            name: row.purchase_name,
                            number: row.number,
                            site: {
                                supplier: {
                                    name: row.customer_and_supplier_name,
                                    slug: row.slug
                                }
                            }
                        }
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnExistsByUuid: uuid => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`drn_purchase_payment_id\` FROM \`drn_purchase_payment\` AS \`a\` WHERE \`a\`.\`uuid\` = ${dataAccess.uuid.returnWhereFunction(uuid)}`)
                .then(rows => resolve(rows.length))
                .catch(error => reject(error));
                break;
        }
    }),
    returnForBalancesByPurchaseNumberSortedByEventTimestamp: purchaseNumber => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`amount\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`a\`.\`uuid\`) AS \`uuid\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`c\`.\`uuid\`) AS \`balance_uuid\`, \`d\`.\`timestamp\` FROM \`drn_purchase_payment\` AS \`a\` JOIN \`drn_purchase_balance_payment\` AS \`b\` ON \`b\`.\`drn_purchase_payment_id\` = \`a\`.\`drn_purchase_payment_id\` JOIN \`drn_purchase_balance\` AS \`c\` ON \`c\`.\`drn_purchase_balance_id\` = \`b\`.\`drn_purchase_balance_id\` JOIN \`drn_purchase_event\` AS \`d\` ON \`d\`.\`drn_purchase_event_id\` = \`a\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`e\` ON \`e\`.\`drn_purchase_id\` = \`d\`.\`drn_purchase_id\` WHERE \`e\`.\`number\` = ${purchaseNumber} ORDER BY \`d\`.\`timestamp\``)
                .then(rows => resolve(rows.map(row => ({
                    amount: row.amount,
                    uuid: dataAccess.uuid.toString(row.uuid),
                    balance: {
                        uuid: dataAccess.uuid.toString(row.balance_uuid)
                    },
                    event: {
                        timestamp: row.timestamp
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    returnForInvoicesByPurchaseNumberSortedByEventTimestamp: purchaseNumber => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.returnQueryResults(`SELECT \`a\`.\`amount\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`a\`.\`uuid\`) AS \`uuid\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`c\`.\`uuid\`) AS \`invoice_uuid\`, \`d\`.\`timestamp\` FROM \`drn_purchase_payment\` AS \`a\` JOIN \`drn_purchase_invoice_payment\` AS \`b\` ON \`b\`.\`drn_purchase_payment_id\` = \`a\`.\`drn_purchase_payment_id\` JOIN \`drn_commercial_document\` AS \`c\` ON \`c\`.\`drn_commercial_document_id\` = \`b\`.\`drn_commercial_document_id\` JOIN \`drn_purchase_event\` AS \`d\` ON \`d\`.\`drn_purchase_event_id\` = \`a\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`e\` ON \`e\`.\`drn_purchase_id\` = \`d\`.\`drn_purchase_id\` WHERE \`e\`.\`number\` = ${purchaseNumber} ORDER BY \`d\`.\`timestamp\``)
                .then(rows => resolve(rows.map(row => ({
                    amount: row.amount,
                    uuid: dataAccess.uuid.toString(row.uuid),
                    invoice: {
                        uuid: dataAccess.uuid.toString(row.invoice_uuid)
                    },
                    event: {
                        timestamp: row.timestamp
                    }
                }))))
                .catch(error => reject(error));
                break;
        }
    }),
    update: (uuid, amount) => new Promise((resolve, reject) => {
        switch (dataAccess.normalizedTypeName) {
            case 'mysql':
                dataAccess.transaction.start()
                .then(() => dataAccess.returnQueryResults(`UPDATE \`drn_purchase_payment\` AS \`a\` SET \`a\`.\`amount\` = ${amount} WHERE \`a\`.\`uuid\` = ${dataAccess.uuid.returnWhereFunction(uuid)}`))
                .then(() => dataAccess.returnQueryResults(`SELECT ${dataAccess.uuid.returnSelectFunctionName()}(\`c\`.\`uuid\`) AS \`balance_uuid\` FROM \`drn_purchase_payment\` AS \`a\` JOIN \`drn_purchase_balance_payment\` AS \`b\` ON \`b\`.\`drn_purchase_payment_id\` = \`a\`.\`drn_purchase_payment_id\` JOIN \`drn_purchase_balance\` AS \`c\` ON \`c\`.\`drn_purchase_balance_id\` = \`b\`.\`drn_purchase_balance_id\` WHERE \`a\`.\`uuid\` = ${dataAccess.uuid.returnWhereFunction(uuid)}`))
                .then(rows => balances.updateBalance(dataAccess.uuid.toString(rows[0].balance_uuid)))
                .then(() => resolve())
                .catch(error => {
                    dataAccess.transaction.rollBack()
                    .then(() => reject(error))
                    .catch(error => reject(error))
                });
                break;
        }
    })
};

const returnByNumber = number => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            dataAccess.returnQueryResults(`SELECT \`a\`.\`name\` AS \`purchase_name\`, \`a\`.\`status\`, \`b\`.\`address\`, \`b\`.\`denominacionadicional\`, \`c\`.\`name\` AS \`localidad_name\`, \`c\`.\`province\`, \`d\`.\`name\` AS \`customer_and_supplier_name\` FROM \`drn_purchase\` AS \`a\` JOIN \`drn_site\` AS \`b\` ON \`b\`.\`drn_site_id\` = \`a\`.\`drn_site_id\` JOIN \`drn_localidad\` AS \`c\` ON \`c\`.\`drn_localidad_id\` = \`b\`.\`drn_localidad_id\` JOIN \`drn_customer_and_supplier\` AS \`d\` ON \`d\`.\`drn_customer_and_supplier_id\` = \`b\`.\`drn_customer_and_supplier_id\` WHERE \`a\`.\`number\` = ${number}`)
            .then(rows => resolve(
                rows[0]
                    ? {
                        name: rows[0].purchase_name,
                        status: rows[0].status,
                        site: {
                            address: rows[0].address,
                            denominacionAdicional: rows[0].denominacionadicional,
                            localidad: {
                                name: rows[0].localidad_name,
                                province: rows[0].province
                            },
                            supplier: {
                                name: rows[0].customer_and_supplier_name
                            }
                        }
                    }
                    : null
            ))
            .catch(error => reject(error));
            break;
    }
});

const returnByStatusSortedByStatusSupplierNameNumber = (statuses = null) => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            let where = '';

            if (statuses) {
                if (!Array.isArray(statuses)) statuses = [ statuses ];
                where = ` WHERE \`a\`.\`status\` IN(${statuses.map(status => `'${status}'`).join(', ')})`;
            }
            dataAccess.returnQueryResults(`SELECT \`a\`.\`name\` AS \`purchase_name\`, \`a\`.\`number\`, \`a\`.\`status\`, \`c\`.\`name\` AS \`customer_and_supplier_name\`, \`c\`.\`slug\` FROM \`drn_purchase\` AS \`a\` JOIN \`drn_site\` AS \`b\` ON \`b\`.\`drn_site_id\` = \`a\`.\`drn_site_id\` JOIN \`drn_customer_and_supplier\` AS \`c\` ON \`c\`.\`drn_customer_and_supplier_id\` = \`b\`.\`drn_customer_and_supplier_id\`${where} ORDER BY \`a\`.\`status\`, \`customer_and_supplier_name\`, \`a\`.\`number\``)
            .then(rows => resolve(rows.map(row => ({
                name: row.purchase_name,
                number: row.number,
                status: row.status,
                site: {
                    supplier: {
                        name: row.customer_and_supplier_name,
                        slug: row.slug
                    }
                }
            }))))
            .catch(error => reject(error));
            break;
    }
});

const returnExistsByNumber = number => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            dataAccess.returnQueryResults(`SELECT \`a\`.\`drn_purchase_id\` FROM \`drn_purchase\` AS \`a\` WHERE \`a\`.\`number\` = ${number}`)
            .then(rows => resolve(rows.length))
            .catch(error => reject(error));
            break;
    }
});

const returnStatusByNumber = number => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            dataAccess.returnQueryResults(`SELECT \`a\`.\`status\` FROM \`drn_purchase\` AS \`a\` WHERE \`a\`.\`number\` = ${number}`)
            .then(rows => resolve(rows[0]?.status || null))
            .catch(error => reject(error));
            break;
    }
});

const returnWithBalanceSortedBySupplierNameNumber = () => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            dataAccess.returnQueryResults('SELECT `c`.`name` AS `purchase_name`, `c`.`number`, `e`.`name` AS `customer_and_supplier_name`, `e`.`slug`, `a`.`balance_balance`, `a`.`invoice_balance` FROM (SELECT `a`.`drn_purchase_event_id`, `a`.`balance` AS `balance_balance`, 0 AS `invoice_balance` FROM `drn_purchase_balance` AS `a` WHERE `a`.`balance` != 0 UNION SELECT `a`.`drn_purchase_event_id`, 0 AS `balance_balance`, `b`.`balance` AS `invoice_balance` FROM `drn_purchase_event_commercial_document` AS `a` JOIN `drn_invoice_balance` AS `b` ON `b`.`drn_commercial_document_id` = `a`.`drn_commercial_document_id` WHERE `b`.`balance` != 0) AS `a` JOIN `drn_purchase_event` AS `b` ON `b`.`drn_purchase_event_id` = `a`.`drn_purchase_event_id` JOIN `drn_purchase` AS `c` ON `c`.`drn_purchase_id` = `b`.`drn_purchase_id` JOIN `drn_site` AS `d` ON `d`.`drn_site_id` = `c`.`drn_site_id` JOIN `drn_customer_and_supplier` AS `e` ON `e`.`drn_customer_and_supplier_id` = `d`.`drn_customer_and_supplier_id` ORDER BY `e`.`name`, `c`.`number`')
            .then(rows => resolve(rows.map(row => ({
                name: row.purchase_name,
                number: row.number,
                site: {
                    supplier: {
                        name: row.customer_and_supplier_name,
                        slug: row.slug
                    }
                },
                event: {
                    balance: {
                        balance: row.balance_balance
                    },
                    invoice: {
                        balance: {
                            balance: row.invoice_balance
                        }
                    }
                }
            }))))
            .catch(error => reject(error));
            break;
    }
});

module.exports = {
    balances: balances,
    events: events,
    payments: payments,

    returnByNumber: returnByNumber,
    returnByStatusSortedByStatusSupplierNameNumber: returnByStatusSortedByStatusSupplierNameNumber,
    returnExistsByNumber: returnExistsByNumber,
    returnWithBalanceSortedBySupplierNameNumber: returnWithBalanceSortedBySupplierNameNumber,
    returnStatusByNumber: returnStatusByNumber
};
