const express = require('express');

const { project } = require('../../../configuration');
const expressValidator = require('../../../express-validator');
const { authorization } = require('../../front-end');

const router = express.Router();

// Get details by number
const title = `${project.Name} - Detalles de la compra`;
router.get('/:number', authorization, expressValidator.validate({
    requestTarget: expressValidator.requestTarget.frontEnd,
    params: { number: expressValidator.type.number },
    notFound: {
        title: title,
        message: 'La compra solicitada no ha sido encontrada.'
    }
}), (req, res) => {
    res.render('project/purchases/details', {
        title: title,
        css: { vixenworks: [ 'details', 'flatpickr', 'form', 'listing', 'modal', 'summary', 'tabs' ] },
        js: { project: [ 'commercial-documents', 'files', 'purchase-details', 'purchases', 'sites' ], vixenworks: [ 'big', 'details', 'flatpickr/flatpickr', 'flatpickr/l10n/es', 'form', 'listing', 'modal', 'summary', 'tabs' ] },
        number: req.validated.number
    });
});

module.exports = {
    router: router
};
