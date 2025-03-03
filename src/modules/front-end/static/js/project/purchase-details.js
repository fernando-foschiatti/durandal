project.purchase = {
    details: {
        balance: {
            add: invoiceOrBalance => {
                const isInvoice = !Object.hasOwn(invoiceOrBalance, 'amount');
                const balanceTimestamp = isInvoice ? null : new Date(invoiceOrBalance.timestamp).getTime() - new Date(invoiceOrBalance.timestamp).getTimezoneOffset() * 60 * 1000;

                // Summary
                // -- Summary elements
                // ---- Date
                const dateDiv = document.createElement('div');
                dateDiv.classList.add('vixenworks-monospaced', 'vixenworks-right-aligned', 'date');
                const dateDivDate = new Date(invoiceOrBalance.date || balanceTimestamp);
                dateDiv.textContent = [ dateDivDate.getUTCDate(), (dateDivDate.getUTCMonth() + 1).toString().padStart(2, '0'), dateDivDate.getUTCFullYear() ].join('/');

                // ---- Operation
                const operationDiv = document.createElement('div');
                operationDiv.classList.add('vixenworks-centered', 'operation');
                if (isInvoice) {
                    const operationSpan = document.createElement('span');
                    operationSpan.classList.add('vixenworks-monospaced');
                    operationSpan.textContent = project.commercialDocuments.toString(invoiceOrBalance);
                    operationDiv.append('Factura ', operationSpan);
                } else operationDiv.textContent = 'Saldo';

                // ---- File
                const fileDiv = document.createElement('div');
                fileDiv.classList.add('file');
                if (isInvoice && invoiceOrBalance.file) {
                    const fileA = document.createElement('a');
                    fileA.setAttribute('href', `${vixenworks.frontEndBasePath}files/project/${invoiceOrBalance.file}?${new Date().getTime()}`);
                    fileA.setAttribute('target', '_blank');
                    fileA.append(vixenworks.icon.returnImg(vixenworks.icon.type.foldedPaper, vixenworks.icon.size.small, 'Ver factura'));
                    fileDiv.append(fileA);
                }

                // ---- Purchase categories
                const categoriesDiv = document.createElement('div');
                categoriesDiv.classList.add('categories');
                for (const purchaseCategory of invoiceOrBalance.purchasesCategories) {
                    const cetegoryDiv = document.createElement('div');
                    cetegoryDiv.setAttribute('title', purchaseCategory.description);
                    cetegoryDiv.textContent = purchaseCategory.name;
                    categoriesDiv.append(cetegoryDiv);
                }

                // ---- Total or amount
                const totalOrAmountDiv = document.createElement('div');
                totalOrAmountDiv.classList.add('total-or-amount');
                const totalOrAmountSpan = document.createElement('span');
                totalOrAmountSpan.classList.add('vixenworks-monospaced');
                if (!isInvoice) totalOrAmountSpan.textContent = `$ ${vixenworks.number.toString(invoiceOrBalance.amount)}`;
                totalOrAmountDiv.append(isInvoice ? 'Total' : 'Monto', ' ', totalOrAmountSpan);

                // ---- Balance
                const balanceDiv = document.createElement('div');
                balanceDiv.classList.add('balance');
                const balanceSpan = document.createElement('span');
                balanceSpan.classList.add('vixenworks-monospaced');
                const summaryBalance = new Big(invoiceOrBalance.balance);
                let balanceSpanTextContent = `$ ${vixenworks.number.toString(summaryBalance.abs().toNumber())}`;
                if (summaryBalance.lt(0)) balanceSpanTextContent = `${balanceSpanTextContent} (a favor)`;
                balanceSpan.textContent = balanceSpanTextContent;
                balanceDiv.append('Saldo ', balanceSpan);

                // -- Details
                // ---- Invoice or balance
                const listingData = [];
                const listingDataFirstRow = {
                    date: invoiceOrBalance.date || new Date(balanceTimestamp).toISOString(),
                    operation: isInvoice ? { type: 'Factura', commercialDocument: invoiceOrBalance } : 'Saldo'
                };
                if (isInvoice) {
                    listingDataFirstRow.file = invoiceOrBalance.file ? { type: vixenworks.icon.type.foldedPaper, size: vixenworks.icon.size.small, tooltip: 'Ver factura' } : null;
                    listingDataFirstRow.fileName = invoiceOrBalance.file;
                }
                listingDataFirstRow.debe = invoiceOrBalance.total || invoiceOrBalance.amount;
                listingDataFirstRow.haber = 0;
                listingDataFirstRow.balance = invoiceOrBalance.total || invoiceOrBalance.amount;
                listingData.push(listingDataFirstRow);

                let detailsBalance = new Big(invoiceOrBalance.total || invoiceOrBalance.amount);
                let toPay;
                // ---- Notes
                if (isInvoice) {
                    for (const noteType of [ project.commercialDocuments.type['Credit note'], project.commercialDocuments.type['Debit note'] ]) {
                        for (const note of invoiceOrBalance[noteType === project.commercialDocuments.type['Credit note'] ? 'creditNotes' : 'debitNotes']) {
                            if (noteType === project.commercialDocuments.type['Credit note']) detailsBalance = detailsBalance.minus(note.amount);
                            else detailsBalance = detailsBalance.plus(note.amount);
                            listingData.push({
                                date: note.date,
                                operation: { type: noteType.displayName, commercialDocument: note },
                                file: note.file ? { type: vixenworks.icon.type.foldedPaper, size: vixenworks.icon.size.small, tooltip: `Ver ${noteType.displayName.charAt(0).toLowerCase()}${noteType.displayName.slice(1)}` } : null,
                                fileName: note.file,
                                debe: noteType === project.commercialDocuments.type['Credit note'] ? 0 : note.amount,
                                haber: noteType === project.commercialDocuments.type['Credit note'] ? note.amount : 0,
                                balance: detailsBalance.toNumber()
                            });
                        }
                    }
                    toPay = detailsBalance.toNumber();
                    totalOrAmountSpan.textContent = `$ ${vixenworks.number.toString(toPay)}`;
                }

                // ---- Payments
                for (const payment of invoiceOrBalance.payments) {
                    detailsBalance = detailsBalance.minus(payment.amount);
                    const listingDataRow = {
                        date: new Date(new Date(payment.timestamp).getTime() - new Date(payment.timestamp).getTimezoneOffset() * 60 * 1000).toISOString(),
                        operation: 'Pago'
                    };
                    listingDataRow.debe = 0;
                    listingDataRow.haber = payment.amount;
                    listingDataRow.balance = detailsBalance.toNumber();
                    listingData.push(listingDataRow);
                }

                const listingColumns = { date: { type: vixenworks.listing.column.type.date } };
                listingColumns.operation = isInvoice ?  {
                    displayName: 'Operación',
                    type: {
                        modification: args => {
                            if (typeof args !== 'string') {
                                const numberSpan = document.createElement('span');
                                numberSpan.classList.add('vixenworks-monospaced');
                                numberSpan.textContent = project.commercialDocuments.toString(args.commercialDocument);
                                return [ args.type, ' ', numberSpan ];
                            } else return args;
                        }
                    } } : 'Operación';
                if (isInvoice) {
                    listingColumns.file = {
                        displayName: 'Fichero',
                        type: vixenworks.listing.column.type.icon,
                        onClick: {
                            url: `files/project/{fileName}?${new Date().getTime()}`,
                            tooltip: 'Ver fichero',
                            target: '_blank'
                        }
                    };
                }
                listingColumns.debe = {
                    displayName: 'Debe',
                    type: vixenworks.listing.column.type.number
                };
                listingColumns.haber = {
                    displayName: 'Haber',
                    type: vixenworks.listing.column.type.number
                };
                listingColumns.balance = {
                    displayName: 'Saldo',
                    type: vixenworks.listing.column.type.number
                };
                const listing = new vixenworks.listing({
                    columns: listingColumns,
                    data: listingData
                });

                const invoiceOrBalance_ = { uuid: invoiceOrBalance.uuid, timestamp: isInvoice ? new Date(invoiceOrBalance.date).getTime() : balanceTimestamp, toPay: toPay || invoiceOrBalance.amount, balance: invoiceOrBalance.balance, listing: listing };
                project.purchase.details.balance.invoicesAndBalances.push(invoiceOrBalance_);
                project.purchase.details.balance.invoicesAndBalances.sort((a, b) => a.timestamp - b.timestamp);

                project.purchase.details.balance.summary.summary.add({
                    summary: [ dateDiv, operationDiv, fileDiv, categoriesDiv, totalOrAmountDiv, balanceDiv ],
                    details: listing.div
                }, project.purchase.details.balance.invoicesAndBalances.indexOf(invoiceOrBalance_));

                project.purchase.details.balance.summary.updateTitle();
            },
            remove: uuid => {
                const index = project.purchase.details.balance.invoicesAndBalances.findIndex(invoiceOrBalance => invoiceOrBalance.uuid === uuid);
                project.purchase.details.balance.invoicesAndBalances.splice(index, 1);
                project.purchase.details.balance.summary.summary.remove(index);
                project.purchase.details.balance.summary.updateTitle();
            },
            invoicesAndBalances: [],
            summary: {
                summary: new vixenworks.summary({ class: 'purchase-balance', title: 'No hay facturas en esta compra.' }),
                updateTitle: () => {
                    if (project.purchase.details.balance.invoicesAndBalances.length === 0) project.purchase.details.balance.summary.summary.update.title('No hay facturas en esta compra.');
                    else {
                        let toPay = new Big(0);
                        let balance = new Big(0);
                        project.purchase.details.balance.invoicesAndBalances.forEach(invoiceOrBalance => {
                            toPay = toPay.plus(invoiceOrBalance.toPay);
                            balance = balance.plus(invoiceOrBalance.balance);
                        });

                        let text = 'El saldo de esta compra ';
                        let spanTextContent;
                        if (balance.lt(0)) {
                            text = `${text}ha sido cancelado en su totalidad, dejando un saldo a favor de`;
                            spanTextContent = balance.abs();
                        } else if (balance.eq(0)) {
                            text = `${text}ha sido cancelado en su totalidad por`;
                            spanTextContent = toPay;
                        } else if (balance.eq(toPay)) {
                            text = `${text}se adeuda en su totalidad por`;
                            spanTextContent = toPay;
                        } else {
                            text = `${text}ha sido cancelado parcialmente. Se adeudan`;
                            spanTextContent = balance;
                        }
                        const span = document.createElement('span');
                        span.classList.add('vixenworks-monospaced');
                        span.textContent = `$ ${vixenworks.number.toString(spanTextContent.toNumber())}`;
                        project.purchase.details.balance.summary.summary.update.title([ text, ' ', span ]);
                    }
                }
            }
        },
        showByNumber: (number, userHasWritePermission) => {
            let purchase;

            project.purchase.details.userHasWritePermission = userHasWritePermission;

            vixenworks.restfulApi.performRequest(`purchases/${number}`)
            .then(purchase_ => {
                purchase = purchase_;

                return project.purchase.details.userHasWritePermission
                    ? vixenworks.restfulApi.performRequest('purchases/events/users').catch(() => { project.purchase.details.userHasWritePermission = false; })
                    : null;
            })
            .then(eventsUsers => {
                document.title = `${document.title} ${number}`;

                const eventsListing = new vixenworks.listing({
                    actions: project.purchase.details.userHasWritePermission ? {
                        icon: vixenworks.icon.type.plusSign,
                        tooltip: 'Nuevo evento',
                        onClick: e => {
                            new vixenworks.form({
                                title: 'Nuevo evento',
                                fields: {
                                    timestamp: {
                                        label: 'Fecha y hora',
                                        type: vixenworks.form.field.type.dateAndTime
                                    },
                                    usersUuids: {
                                        label: 'Usuario(s)',
                                        type: vixenworks.form.field.type.options.horizontal,
                                        options: eventsUsers.map(eventUser => ({ displayName: eventUser.name, value: eventUser.uuid })),
                                        multiple: true,
                                        validations: { notEmpty: true }
                                    },
                                    details: {
                                        label: 'Detalles',
                                        type: vixenworks.form.field.type.text.freeForm,
                                        validations: { notEmpty: true }
                                    },
                                    status: {
                                        label: 'Estado',
                                        type: vixenworks.form.field.type.options.dropDown,
                                        options: [{ displayName: '-- ninguno --', value: 'None' }].concat(Object.entries(project.purchases.status).map(purchaseStatus => ({ displayName: purchaseStatus[1].displayName, value: purchaseStatus[0] }))),
                                    }
                                },
                                restfulApiRequest: {
                                    route: `purchases/${number}/events`,
                                    method: vixenworks.restfulApi.method.post,
                                    success: {
                                        notificationText: 'El evento ha sido agregado.',
                                        callback: () => {
                                            Promise.all([
                                                vixenworks.restfulApi.performRequest(`purchases/${number}/status`),
                                                vixenworks.restfulApi.performRequest(`purchases/${number}/events`)
                                            ])
                                            .then(statusAndEvents => {
                                                details.update({
                                                    topRight: {
                                                        row3: {
                                                            right: {
                                                                text: project.purchases.status[statusAndEvents[0]].displayName,
                                                                class: project.purchases.status[statusAndEvents[0]].class
                                                            }
                                                        }
                                                    }
                                                });
                                                eventsListing.update(statusAndEvents[1]);
                                            })
                                            .catch(() => {
                                                new vixenworks.modal({
                                                    type: vixenworks.modal.type.notification,
                                                    text: 'Ha ocurrido un error al buscar los detalles de la compra.'
                                                });
                                            });
                                        }
                                    },
                                    failureCallback: error => {
                                        new vixenworks.modal({
                                            type: vixenworks.modal.type.notification,
                                            text: error === vixenworks.restfulApi.responseStatusCode.conflict ? 'Ya existe un evento con la fecha y hora especificadas.' : 'El evento no se ha creado debido a un error.'
                                        });
                                    }
                                }
                            });
                        }
                    } : null,
                    columns: {
                        timestamp: { type: vixenworks.listing.column.type.timestamp },
                        users: { type: vixenworks.listing.column.type.users },
                        details: 'Detalles',
                        files: {
                            displayName: 'Ficheros',
                            type: {
                                class: 'files',
                                modification: files => {
                                    const response = [];

                                    for (const file of files) {
                                        const a = document.createElement('a');
                                        a.setAttribute('href', `${vixenworks.frontEndBasePath}files/project/${file.name}?${new Date().getTime()}`);
                                        a.setAttribute('title', `Ver ${project.files.type[file.type].displayName.charAt(0).toLowerCase()}${project.files.type[file.type].displayName.slice(1)}`);
                                        a.setAttribute('target', '_blank');
                                        const div = document.createElement('div');
                                        div.classList.add('vixenworks-button');
                                        div.textContent = project.files.type[file.type].initials;
                                        a.append(div);
                                        response.push(a);
                                    }

                                    return response;
                                }
                            }
                        },
                        status: {
                            displayName: 'Estado',
                            type: {
                                class: 'status',
                                modification: status => {
                                    let response = null;

                                    if (status) {
                                        response = document.createElement('div');
                                        response.classList.add(project.purchases.status[status].class);
                                        response.textContent = project.purchases.status[status].displayName;
                                    }

                                    return response;
                                }
                            }
                        }
                    },
                    data: purchase.events
                });

                const details = new vixenworks.details({
                    class: 'purchase',
                    content: {
                        topLeft: {
                            row2: `Compra ${number}`
                        },
                        topRight: {
                            row1: purchase.supplier.name,
                            row2: project.sites.toString(purchase.supplier.site),
                            row3: {
                                left: purchase.name,
                                right: {
                                    text: project.purchases.status[purchase.status].displayName,
                                    class: project.purchases.status[purchase.status].class
                                }
                            }
                        },
                        bottom: new vixenworks.tabs({
                            tabs: [{
                                displayName: 'Eventos',
                                content: eventsListing.div
                            },
                            {
                                displayName: 'Saldo',
                                content: project.purchase.details.balance.summary.summary.div
                            }]
                        }).div
                    }
                });

                purchase.invoices.concat(purchase.balances).forEach(project.purchase.details.balance.add);
            })
            .catch(error => {
                vixenworks.error.show(error, 'La compra solicitada no ha sido encontrada.');
            });
        },
        userHasWritePermission: false
    }
};
