project.commercialDocuments = {
    toString: commercialDocument => `${commercialDocument.letter}${commercialDocument.puntoDeVenta}-${commercialDocument.number}`,
    type: Object.freeze({
        'Credit note': { displayName: 'Nota de crédito' },
        'Debit note': { displayName: 'Nota de débito' },
        'Invoice': { displayName: 'Factura' }
    })
};
