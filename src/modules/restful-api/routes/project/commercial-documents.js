const express = require('express');
const glob = require('glob');

const expressValidator = require('../../../express-validator');
const { logError } = require('../../../loggers');
const model = require('../../../model/model');
const { authorization, errors, files: restfulApiFiles } = require('../../restful-api');

const router = express.Router();

// Get available periods from purchases
router.get('/purchases/available-periods', authorization('Leer contabilidad'), (req, res) => {
    model.project.commercialDocuments.purchases.returnAvailablePeriods()
    .then(availablePeriods => {
        const years = {};

        if (!availablePeriods.length) throw new Error(errors.project.commercialDocuments.notFound.message);

        for (const availablePeriod of availablePeriods) {
            if (!years[availablePeriod.year.toString()]) years[availablePeriod.year.toString()] = { number: availablePeriod.year, months: [] };
            years[availablePeriod.year.toString()].months.push(availablePeriod.month);
        }

        res.status(200).json({ data: { years: Object.values(years).sort((a, b) => b.number - a.number) }, error: null });
    })
    .catch(error => {
        if (error.message === errors.project.commercialDocuments.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.commercialDocuments.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.commercialDocuments.errorFetching });
        }
    });
});

// Get by period from purchases
router.get('/purchases/:year/:month', authorization('Leer contabilidad'), expressValidator.validate({
    requestTarget: expressValidator.requestTarget.restfulApi,
    params: {
        year: expressValidator.type.year,
        month: expressValidator.type.month.number
    }
}), (req, res) => {
    let response;

    model.project.commercialDocuments.purchases.returnByPeriodSortedByDate(req.validated.year, req.validated.month)
    .then(commercialDocuments => {
        if (!commercialDocuments.length) throw new Error(errors.project.commercialDocuments.notFound.message);

        response = commercialDocuments.map(commercialDocument => ({
            date: commercialDocument.date,
            supplier: {
                apellidoYNombreORazonSocial: commercialDocument.event.purchase.site.supplier.apellidoYNombreORazonSocial,
                cuit: {
                    type: commercialDocument.event.purchase.site.supplier.tipoDeCuit,
                    number: commercialDocument.event.purchase.site.supplier.numeroDeCuit
                }
            },
            type: commercialDocument.type,
            letter: commercialDocument.letter,
            puntoDeVenta: commercialDocument.puntoDeVenta,
            number: commercialDocument.number,
            file: commercialDocument.event.file.number?.toString() || null,
            net105: commercialDocument.net105,
            net21: commercialDocument.net21,
            vat105: commercialDocument.vat105,
            vat21: commercialDocument.vat21,
            otherTaxes: commercialDocument.otherTaxes,
            exempt: commercialDocument.exempt,
            total: commercialDocument.total
        }));

        return Promise.all(response.filter(commercialDocument => commercialDocument.file).map(commercialDocument => new Promise((resolve, reject) => {
            glob(`${commercialDocument.file}.*`, { cwd: restfulApiFiles.project }, (er, files) => {
                if (er) reject(er);

                resolve({ number: commercialDocument.file, name: files[0] });
            });
        })));
    })
    .then(files_ => {
        const files = {};

        files_.forEach(file => { files[file.number] = file.name; });
        response.forEach(commercialDocument => { if (commercialDocument.file) commercialDocument.file = files[commercialDocument.file]; });

        res.status(200).json({ data: response, error: null });
    })
    .catch(error => {
        if (error.message === errors.project.commercialDocuments.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.commercialDocuments.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.commercialDocuments.errorFetching });
        }
    });
});

module.exports = {
    name: 'commercial documents',
    router: router
};
