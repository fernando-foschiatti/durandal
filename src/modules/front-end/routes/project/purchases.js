const express = require('express');

const { project } = require('../../../configuration');
const expressValidator = require('../../../express-validator');
const { authorization } = require('../../front-end');

const router = express.Router();

const title = `${project.Name} - `;

// Monthly expenses
// -- Get available periods
router.get('/gastos-mensuales', authorization, (req, res) => {
    res.render('project/purchases/monthly-expenses', {
        title: `${title}Gastos mensuales en compras`,
        css: { project: [ 'summary' ], vixenworks: [ 'summary' ] },
        js: { project: [ 'purchases', 'summary' ], vixenworks: [ 'summary' ] },
        showAvailablePeriods: true
    });
});

// -- Get by period
router.get('/gastos-mensuales/:year/:month', authorization, expressValidator.validate({
    requestTarget: expressValidator.requestTarget.frontEnd,
    params: {
        year: expressValidator.type.year,
        month: expressValidator.type.month.name
    },
    notFound: {
        title: title,
        message: 'No hay gastos de compras para el período solicitado.'
    }
}), (req, res) => {
    res.render('project/purchases/monthly-expenses', {
        title: `${title}Gastos mensuales en compras`,
        css: { project: [ 'summary' ], vixenworks: [ 'summary' ] },
        js: { project: [ 'purchases', 'summary' ], vixenworks: [ 'big', 'summary' ] },
        showAvailablePeriods: false,
        year: req.validated.year,
        month: req.validated.month
    });
});

// Pending
router.get('/pendientes', authorization, (req, res) => {
    res.render('project/purchases/pending', {
        title: `${title}Compras pendientes`,
        css: { project: [ 'summary' ], vixenworks: [ 'summary', 'tabs' ] },
        js: { project: [ 'purchases', 'summary' ], vixenworks: [ 'summary', 'tabs' ] }
    });
});

// With oustanding balance
router.get('/pendientes-de-pago', authorization, (req, res) => {
    res.render('project/purchases/with-outstanding-balance', {
        title: `${title}Compras pendientes de pago`,
        css: { project: [ 'summary' ], vixenworks: [ 'summary' ] },
        js: { project: [ 'purchases', 'summary' ], vixenworks: [ 'big', 'summary' ] }
    });
});

module.exports = {
    router: router
};
