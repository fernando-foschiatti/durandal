const express = require('express');
const glob = require('glob');

const expressValidator = require('../../../express-validator');
const { logError } = require('../../../loggers');
const model = require('../../../model/model');
const { authorization, errors, files: restfulApiFiles } = require('../../restful-api');

const router = express.Router();
router.use(express.json());

// Get details by number
router.get('/:number', authorization('Leer compras'), expressValidator.validate({
    requestTarget: expressValidator.requestTarget.restfulApi,
    params: { number: expressValidator.type.number }
}), (req, res) => {
    let purchase;

    // Details
    model.project.purchases.returnByNumber(req.validated.number)
    .then(purchase_ => {
        if (!purchase_) throw new Error(errors.project.purchase.notFound.message);

        purchase = {
            supplier: {
                name: purchase_.site.supplier.name,
                site: {
                    address: purchase_.site.address,
                    denominacionAdicional: purchase_.site.denominacionAdicional,
                    localidad: purchase_.site.localidad
                }
            },
            name: purchase_.name,
            status: purchase_.status,
            invoices: {},
            balances: {},
            events: {}
        };

        return model.project.purchases.events.returnByPurchaseNumberSortedByTimestamp(req.validated.number);
    })
    // Events
    .then(events => {
        if (!events.length) return;

        for (const event of events) {
            purchase.events[event.uuid] = {
                timestamp: event.timestamp,
                users: [],
                details: event.details,
                files: [],
                status: event.status.status,
                uuid: event.uuid
            };
        }

        return model.project.purchases.events.users.returnByPurchaseNumberSortedByInitials(req.validated.number)
        // Events users
        .then(eventsUsers => {
            eventsUsers.forEach(eventUser => {
                const { event, ...eventUser_ } = eventUser;
                purchase.events[eventUser.event.uuid].users.push(eventUser_);
            });

            return model.project.files.returnByPurchaseNumberSortedByNumber(req.validated.number);
        })
        // Events files
        .then(eventsFiles => {
            const eventsFilesPromises = [];

            for (const eventFile of eventsFiles) {
                const eventFileIndex = purchase.events[eventFile.event.uuid].files.push({
                    name: '',
                    type: eventFile.type
                }) - 1;
                eventsFilesPromises.push(new Promise((resolve, reject) => {
                    glob(`${eventFile.number}.*`, { cwd: restfulApiFiles.project }, (er, files) => {
                        if (er) reject(er);

                        resolve({ eventUuid: eventFile.event.uuid, fileIndex: eventFileIndex, file: files[0] });
                    });
                }));
            }

            return Promise.all(eventsFilesPromises);
        })
        .then(eventsFilesFiles => {
            for (const eventFileFile of eventsFilesFiles) purchase.events[eventFileFile.eventUuid].files[eventFileFile.fileIndex].name = eventFileFile.file;

            return model.project.commercialDocuments.purchases.returnInvoicesByPurchaseNumberSortedByDate(req.validated.number);
        })
        // Invoices
        .then(invoices => {
            if (!invoices.length) return;

            for (const invoice of invoices) {
                purchase.invoices[invoice.uuid] = {
                    date: invoice.date,
                    letter: invoice.letter,
                    puntoDeVenta: invoice.puntoDeVenta,
                    number: invoice.number,
                    total: invoice.total,
                    balance: invoice.balance.balance,
                    file: purchase.events[invoice.event.uuid].files[0]?.name || null,
                    purchasesCategories: [],
                    debitNotes: [],
                    creditNotes: [],
                    payments: [],
                    uuid: invoice.uuid
                };
            }

            return model.project.commercialDocuments.purchases.returnInvoicesPurchasesCategoriesByPurchaseNumberSortedByPurchaseCategoryName(req.validated.number)
            // Invoices purchases categories
            .then(invoicesPurchasesCategories => {
                for (const invoicePurchaseCategory of invoicesPurchasesCategories) {
                    purchase.invoices[invoicePurchaseCategory.invoice.uuid].purchasesCategories.push({
                        name: invoicePurchaseCategory.name,
                        description: invoicePurchaseCategory.description
                    });
                }

                return model.project.commercialDocuments.purchases.returnInvoicesNotesByPurchaseNumberSortedByDate(req.validated.number);
            })
            // Invoices notes
            .then(invoicesNotes => {
                for (const invoiceNote of invoicesNotes) {
                    purchase.invoices[invoiceNote.invoice.uuid][invoiceNote.type === 'Credit note' ? 'creditNotes' : 'debitNotes'].push({
                        date: invoiceNote.date,
                        letter: invoiceNote.letter,
                        puntoDeVenta: invoiceNote.puntoDeVenta,
                        number: invoiceNote.number,
                        amount: invoiceNote.invoice.amount,
                        file: purchase.events[invoiceNote.event.uuid].files[0]?.name || null,
                    });
                }

                return model.project.purchases.payments.returnForInvoicesByPurchaseNumberSortedByEventTimestamp(req.validated.number);
            })
            // Invoices payments
            .then(invoicesPayments => {
                for (const invoicePayment of invoicesPayments) {
                    purchase.invoices[invoicePayment.invoice.uuid].payments.push({
                        timestamp: invoicePayment.event.timestamp,
                        amount: invoicePayment.amount,
                        uuid: invoicePayment.uuid
                    });
                }
            })
        })
        .then(() => model.project.purchases.balances.returnByPurchaseNumberSortedByEventTimestamp(req.validated.number))
        // Balances
        .then(balances => {
            if (!balances.length) return;

            for (const balance of balances) {
                purchase.balances[balance.uuid] = {
                    timestamp: balance.event.timestamp,
                    amount: balance.amount,
                    balance: balance.balance,
                    purchasesCategories: [],
                    payments: [],
                    uuid: balance.uuid
                };
            }

            return model.project.purchases.balances.returnPurchasesCategoriesByPurchaseNumberSortedByPurchaseCategoryName(req.validated.number)
            // Balances purchases categories
            .then(balancesPurchasesCategories => {
                for (const balancePurchaseCategory of balancesPurchasesCategories) {
                    purchase.balances[balancePurchaseCategory.balance.balance.uuid].purchasesCategories.push({
                        name: balancePurchaseCategory.name,
                        description: balancePurchaseCategory.description
                    });
                }

                return model.project.purchases.payments.returnForBalancesByPurchaseNumberSortedByEventTimestamp(req.validated.number);
            })
            // Balances payments
            .then(balancesPayments => {
                for (const balancePayment of balancesPayments) {
                    purchase.balances[balancePayment.balance.uuid].payments.push({
                        timestamp: balancePayment.event.timestamp,
                        amount: balancePayment.amount,
                        uuid: balancePayment.uuid
                    });
                }
            })
        })
    })
    // Response
    .then(() => {
        purchase.invoices = Object.values(purchase.invoices);
        purchase.balances = Object.values(purchase.balances);
        purchase.events = Object.values(purchase.events);

        res.status(200).json({ data: purchase, error: null });
    })
    .catch(error => {
        if (error.message === errors.project.purchase.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.purchase.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.purchase.errorFetching });
        }
    });
});

// Get status by number
router.get('/:number/status', authorization('Leer compras'), expressValidator.validate({
    requestTarget: expressValidator.requestTarget.restfulApi,
    params: { number: expressValidator.type.number }
}), (req, res) => {
    return model.project.purchases.returnStatusByNumber(req.validated.number)
    .then(status => {
        if (!status) throw new Error(errors.project.purchase.notFound.message);

        res.status(200).json({ data: status, error: null });
    })
    .catch(error => {
        if (error.message === errors.project.purchase.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.purchase.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.purchase.errorFetching });
        }
    });
});

// Events
// -- Get users
router.get('/events/users', authorization('Escribir compras'), (req, res) => {
    model.vixenworks.users.returnByPermissionNameSortedByUserName('Aparecer en eventos de compras')
    .then(users => {
        if (!users) throw new Error(errors.project.users.notfound.message);

        res.status(200).json({ data: users, error: null });
    })
    .catch(error => {
        if (error.message === errors.project.users.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.users.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.users.errorFetching });
        }
    });
});

// -- Get by purchase number
router.get('/:number/events', authorization('Leer compras'), expressValidator.validate({
    requestTarget: expressValidator.requestTarget.restfulApi,
    params: { number: expressValidator.type.number }
}), (req, res) => {
    const events = {};

    model.project.purchases.returnExistsByNumber(req.validated.number)
    .then(purchaseExists => {
        if (!purchaseExists) throw new Error(errors.project.purchase.notFound.message);

        return model.project.purchases.events.returnByPurchaseNumberSortedByTimestamp(req.validated.number);
    })
    .then(events_ => {
        if (!events_.length) throw new Error(errors.project.events.notFound.message);

        for (const event of events_) {
            events[event.uuid] = {
                timestamp: event.timestamp,
                users: [],
                details: event.details,
                files: [],
                status: event.status.status,
                uuid: event.uuid
            };
        }

        return model.project.purchases.events.users.returnByPurchaseNumberSortedByInitials(req.validated.number);
    })
    .then(users => {
        users.forEach(user => {
            const { event, ...user_ } = user;
            events[user.event.uuid].users.push(user_);
        });

        return model.project.files.returnByPurchaseNumberSortedByNumber(req.validated.number);
    })
    .then(files => {
        const filesPromises = [];

        for (const file of files) {
            const fileIndex = events[file.event.uuid].files.push({
                name: '',
                type: file.type
            }) - 1;
            filesPromises.push(new Promise((resolve, reject) => {
                glob(`${file.number}.*`, { cwd: restfulApiFiles.project }, (er, files) => {
                    if (er) reject(er);

                    resolve({ eventUuid: file.event.uuid, fileIndex: fileIndex, file: files[0] });
                });
            }));
        }

        return Promise.all(filesPromises);
    })
    .then(filesFiles => {
        for (const fileFile of filesFiles) events[fileFile.eventUuid].files[fileFile.fileIndex].name = fileFile.file;
    })
    .then(() => { res.status(200).json({ data: Object.values(events), error: null }); })
    .catch(error => {
        if (error.message === errors.project.purchase.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.purchase.notFound });
        } else if (error.message === errors.project.events.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.events.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.events.errorFetching });
        }
    });
});

// -- Add by purchase number
router.post('/:number/events', authorization('Escribir compras'), expressValidator.validate({
    requestTarget: expressValidator.requestTarget.restfulApi,
    params: { number: expressValidator.type.number },
    body: {
        timestamp: expressValidator.type.timestamp,
        usersUuids: {
            type: expressValidator.type.uuid,
            multiple: true,
            notEmpty: true
        },
        details: {
            type: expressValidator.type.text.freeForm,
            notEmpty: true
        },
        status: {
            type: expressValidator.type.text.regular,
            values: [ 'None', 'Not started', 'Awaiting estimate', 'Estimate received', 'Confirmed', 'In transit', 'Finalized', 'Cancelled' ]
        }
    }
}), (req, res) => {
    const status = req.validated.status !== 'None' ? req.validated.status : null;

    model.project.purchases.returnExistsByNumber(req.validated.number)
    .then(purchaseExists => {
        if (!purchaseExists) throw new Error(errors.project.purchase.notFound.message);

        return model.vixenworks.users.returnExistsByUuids(req.validated.usersUuids);
    })
    .then(usersExists => {
        if (!usersExists) throw new Error(errors.project.users.notFound.message);

        return model.project.purchases.events.returnExistsByTimestampPurchaseNumber(req.validated.timestamp, req.validated.number);
    })
    .then(exists => {
        if (exists) throw new Error(errors.project.event.exists.message);

        return model.project.purchases.events.add(req.validated.details, req.validated.number, status, req.validated.timestamp, req.validated.usersUuids);
    })
    .then(uuid => { res.status(201).json({ data: { uuid: uuid }, error: null }); })
    .catch(error => {
        if (error.message === errors.project.purchase.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.purchase.notFound });
        } else if (error.message === errors.project.users.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.users.notFound });
        } else if (error.message === errors.project.event.exists.message) res.status(409).json({ data: null, error: errors.project.event.exists });
        else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.event.errorCreating });
        }
    });
});

// Payments
// -- Update by UUID
router.patch('/payments/:uuid', authorization('Escribir compras'), expressValidator.validate({
    requestTarget: expressValidator.requestTarget.restfulApi,
    params: { uuid: expressValidator.type.uuid },
    body: {
        amount: {
            type: expressValidator.type.number,
            range: [ 0, 999999999.99 ]
        }
    }
}), (req, res) => {
    model.project.purchases.payments.returnExistsByUuid(req.validated.uuid)
    .then(exists => {
        if (!exists) throw new Error(errors.project.payment.notFound.message);

        return model.project.purchases.payments.update(req.validated.uuid, req.validated.amount);
    })
    .then(() => { res.status(200).json({ data: null, error: null }); })
    .catch(error => {
        if (error.message === errors.project.payment.notFound.message) {
            res.status(404).json({ data: null, error: errors.project.payment.notFound });
        } else {
            logError({ error: error, exit: false });
            res.status(500).json({ data: null, error: errors.project.purchase.errorUpdating });
        }
    });
});

module.exports = {
    router: router
};
