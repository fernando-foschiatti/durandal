const { default: Big } = require('big.js');
const express = require('express');

const { logError } = require('../../../loggers');
const model = require('../../../model/model');
const { authorization, errors } = require('../../restful-api');

const router = express.Router();

router.get('', authorization('Leer compras'), (req, res) => {
    model.project.purchases.returnWithBalanceSortedBySupplierNameNumber()
    .then(purchasesWithBalance => {
        const response = { suppliers: [] };

        if (!purchasesWithBalance.length) throw new Error(errors.project.purchases.notFound.message);

        const suppliers = {};
        for (const purchaseWithBalance of purchasesWithBalance) {
            if (!suppliers[purchaseWithBalance.site.supplier.slug]) {
                suppliers[purchaseWithBalance.site.supplier.slug] = {
                    name: purchaseWithBalance.site.supplier.name,
                    saldosAFavor: [],
                    purchasesWithOutstandingBalance: {}
                };
            }
            if (!suppliers[purchaseWithBalance.site.supplier.slug].purchasesWithOutstandingBalance[purchaseWithBalance.number.toString()]) {
                suppliers[purchaseWithBalance.site.supplier.slug].purchasesWithOutstandingBalance[purchaseWithBalance.number.toString()] = {
                    name: purchaseWithBalance.name,
                    outstandingBalances: []
                }
            }
            const balance = new Big(purchaseWithBalance.event.invoice.balance.balance || purchaseWithBalance.event.balance.balance);
            if (balance.gt(0)) suppliers[purchaseWithBalance.site.supplier.slug].purchasesWithOutstandingBalance[purchaseWithBalance.number.toString()].outstandingBalances.push(balance.toNumber());
            else suppliers[purchaseWithBalance.site.supplier.slug].saldosAFavor.push(balance.abs().toNumber());
        }
        for (const supplier in suppliers) {
            const purchasesWithOutstandingBalance = [];
            for (const purchaseWithOutstandingBalance in suppliers[supplier].purchasesWithOutstandingBalance) {
                if (suppliers[supplier].purchasesWithOutstandingBalance[purchaseWithOutstandingBalance].outstandingBalances.length) {
                    purchasesWithOutstandingBalance.push({
                        name: suppliers[supplier].purchasesWithOutstandingBalance[purchaseWithOutstandingBalance].name,
                        number: parseInt(purchaseWithOutstandingBalance, 10),
                        outstandingBalances: suppliers[supplier].purchasesWithOutstandingBalance[purchaseWithOutstandingBalance].outstandingBalances
                    });
                }
            }
            if (purchasesWithOutstandingBalance.length) {
                response.suppliers.push({
                    name: suppliers[supplier].name,
                    saldosAFavor: suppliers[supplier].saldosAFavor,
                    purchasesWithOutstandingBalance: purchasesWithOutstandingBalance
                });
            }
        }

        res.status(200).json({ data: response, error: null });
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
    name: 'purchases with outstanding balance',
    path: 'purchases/with-outstanding-balance',
    router: router
};
