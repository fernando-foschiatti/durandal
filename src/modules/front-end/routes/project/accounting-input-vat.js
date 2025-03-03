const express = require('express');

const { project } = require('../../../configuration');
const expressValidator = require('../../../express-validator');
const { authorization } = require('../../front-end');

const router = express.Router();

const title = `${project.Name} - IVA compras`;

// Get available periods
router.get('', authorization, (req, res) => {
    res.render('project/accounting-input-vat', {
        title: title,
        css: { project: [ 'summary' ], vixenworks: [ 'summary' ] },
        js: { project: [ 'accounting', 'summary' ], vixenworks: [ 'summary' ] },
        showAvailablePeriods: true
    });
});

// Get by period
router.get('/:year/:month', authorization, expressValidator.validate({
    requestTarget: expressValidator.requestTarget.frontEnd,
    params: {
        year: expressValidator.type.year,
        month: expressValidator.type.month.name
    },
    notFound: {
        title: title,
        message: 'No hay documentos comerciales de compras para el período solicitado.'
    }
}), (req, res) => {
    res.render('project/accounting-input-vat', {
        title: title,
        css: { vixenworks: [ 'listing' ] },
        js: { project: [ 'accounting', 'commercial-documents' ], vixenworks: [ 'big', 'listing' ] },
        showAvailablePeriods: false,
        year: req.validated.year,
        month: req.validated.month
    });
});

module.exports = {
    router: router
};
