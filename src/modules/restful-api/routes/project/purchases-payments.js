const express = require('express');

const expressValidator = require('../../../express-validator');
const { logError } = require('../../../loggers');
const model = require('../../../model/model');
const { authorization, errors } = require('../../restful-api');

const router = express.Router();

// Get available periods
router.get('/available-periods', authorization('Leer compras'), (req, res) => {
    model.project.purchases.payments.returnAvailablePeriods()
    .then(availablePeriods => {
        const years = {};

        if (!availablePeriods.length) throw new Error(errors.project.payments.notFound.message);

        for (const availablePeriod of availablePeriods) {
            if (!years[availablePeriod.year.toString()]) years[availablePeriod.year.toString()] = { number: availablePeriod.year, months: [] };
            years[availablePeriod.year.toString()].months.push(availablePeriod.month);
        }

        res.status(200).json({ data: { years: Object.values(years).sort((a, b) => b.number - a.number) }, error: null });
    })
    .catch(error => {
        if (error.message === errors.project.payments.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.payments.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.payments.errorFetching });
        }
    });
});

// Get by period
router.get('/:year/:month', authorization('Leer compras'), expressValidator.validate({
    requestTarget: expressValidator.requestTarget.restfulApi,
    params: {
        year: expressValidator.type.year,
        month: expressValidator.type.month.number
    }
}), (req, res) => {
    model.project.purchases.payments.returnByPeriodSortedBySupplierNamePurchaseNumber(req.validated.year, req.validated.month)
    .then(payments => {
        const suppliers = {};

        if (!payments.length) throw new Error(errors.project.payments.notFound.message);

        for (const payment of payments) {
            const supplierSlug = payment.event.purchase.site.supplier.slug;
            const purchaseNumber = payment.event.purchase.number.toString();

            if (!suppliers[supplierSlug]) suppliers[supplierSlug] = {
                name: payment.event.purchase.site.supplier.name,
                purchases: {}
            };

            if (!suppliers[supplierSlug].purchases[purchaseNumber]) suppliers[supplierSlug].purchases[purchaseNumber] = {
                name: payment.event.purchase.name,
                number: payment.event.purchase.number,
                payments: []
            };

            suppliers[supplierSlug].purchases[purchaseNumber].payments.push(payment.amount);
        }

        res.status(200).json({ data: { suppliers: Object.values(suppliers).map(supplier => ({ name: supplier.name, purchases: Object.values(supplier.purchases) })) }, error: null });
    })
    .catch(error => {
        if (error.message === errors.project.payments.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.payments.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.payments.errorFetching });
        }
    });
});

module.exports = {
    name: 'purchases payments',
    path: 'purchases/payments',
    router: router
};
