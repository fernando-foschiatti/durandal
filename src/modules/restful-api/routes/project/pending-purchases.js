const express = require('express');

const { logError } = require('../../../loggers');
const model = require('../../../model/model');
const { authorization, errors } = require('../../restful-api');

const router = express.Router();

router.get('', authorization('Leer compras'), (req, res) => {
    model.project.purchases.returnByStatusSortedByStatusSupplierNameNumber([ 'Awaiting estimate', 'Confirmed', 'Estimate received', 'In transit', 'Not started' ])
    .then(purchases => {
        const statuses = {};

        if (!purchases.length) throw new Error(errors.project.purchases.notFound.message);

        for (const purchase of purchases) {
            if (!statuses[purchase.status]) statuses[purchase.status] = { name: purchase.status, suppliers: {} };
            if (!statuses[purchase.status].suppliers[purchase.site.supplier.slug]) statuses[purchase.status].suppliers[purchase.site.supplier.slug] = {
                name: purchase.site.supplier.name,
                purchases: []
            };
            statuses[purchase.status].suppliers[purchase.site.supplier.slug].purchases.push({
                name: purchase.name,
                number: purchase.number
            });
        }

        res.status(200).json({ data: { statuses: Object.values(statuses).map(status => ({ name: status.name, suppliers: Object.values(status.suppliers)})) }, error: null });
    })
    .catch(error => {
        if (error.message === errors.project.purchases.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.purchases.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.purchases.errorFetching });
        }
    });
});

module.exports = {
    name: 'pending purchases',
    path: 'purchases/pending',
    router: router
};
