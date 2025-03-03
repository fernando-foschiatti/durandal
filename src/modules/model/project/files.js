const dataAccess = require('../../data-access/data-access');

const returnByPurchaseNumberSortedByNumber = purchaseNumber => new Promise((resolve, reject) => {
    switch (dataAccess.normalizedTypeName) {
        case 'mysql':
            dataAccess.returnQueryResults(`SELECT \`a\`.\`number\`, \`a\`.\`type\`, ${dataAccess.uuid.returnSelectFunctionName()}(\`c\`.\`uuid\`) AS \`event_uuid\` FROM \`drn_file\` AS \`a\` JOIN \`drn_purchase_event_file\` AS \`b\` ON \`b\`.\`drn_file_id\` = \`a\`.\`drn_file_id\` JOIN \`drn_purchase_event\` AS \`c\` ON \`c\`.\`drn_purchase_event_id\` = \`b\`.\`drn_purchase_event_id\` JOIN \`drn_purchase\` AS \`d\` ON \`d\`.\`drn_purchase_id\` = \`c\`.\`drn_purchase_id\` WHERE \`d\`.\`number\` = ${purchaseNumber} ORDER BY \`a\`.\`number\``)
            .then(rows => resolve(rows.map(row => ({
                number: row.number,
                type: row.type,
                event: {
                    uuid: dataAccess.uuid.toString(row.event_uuid)
                }
            }))))
            .catch(error => reject(error));
            break;
    }
})

module.exports = {
    returnByPurchaseNumberSortedByNumber: returnByPurchaseNumberSortedByNumber
};
