project.purchases = {
    showMonthlyExpenses: args => {
        vixenworks.restfulApi.performRequest(`purchases/payments/${args.year}/${args.month}`)
        .then(payments => {
            let monthName = vixenworks.date.months[args.month - 1];
            monthName = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`;
            document.title = `${document.title} (${monthName} de ${args.year})`;

            const suppliers = [];
            let total = new Big(0);

            for (const supplier_ of payments.suppliers) {
                const supplier = {
                    name: supplier_.name,
                    amount: new Big(0),
                    purchases: []
                };

                for (const purchase of supplier_.purchases) {
                    let purchaseTotal = new Big(0);

                    for (const payment of purchase.payments) purchaseTotal = purchaseTotal.plus(payment);
                    supplier.purchases.push({
                        name: purchase.name,
                        amount: purchaseTotal,
                        number: purchase.number
                    });

                    supplier.amount = supplier.amount.plus(purchaseTotal);
                }
                suppliers.push(supplier);

                total = total.plus(supplier.amount);
            }
            const totalSpan = document.createElement('span');
            totalSpan.classList.add('vixenworks-monospaced');
            totalSpan.textContent = `$ ${vixenworks.number.toString(total.toNumber())}`;

            new project.summary.purchasesBySupplier({
                container: 'Main',
                class: 'purchases-monthly-expenses',
                suppliers: suppliers,
                title: [ `Gastos mensuales en compras para el período de ${monthName} de ${args.year}. Monto `, totalSpan ],
            });
        })
        .catch(error => { vixenworks.error.show(error, 'No hay gastos de compras para el período solicitado.'); });
    },
    showMonthlyExpensesAvailablePeriods: () => {
        vixenworks.restfulApi.performRequest('purchases/payments/available-periods')
        .then(availablePeriods => {
            new project.summary.availablePeriods({
                title: 'Gastos mensuales en compras',
                availablePeriods: availablePeriods,
                class: 'purchases-monthly-expenses',
                path: 'compras/gastos-mensuales'
            });
        })
        .catch(error => { vixenworks.error.show(error, 'No hay gastos de compras.'); });
    },
    showPending: () => {
        vixenworks.restfulApi.performRequest('purchases/pending')
        .then(pendingPurchases => {
            const statusesOrder = [ 'Not started', 'Awaiting estimate', 'Estimate received', 'Confirmed', 'In transit' ].map(status => project.purchases.status[status].displayName);

            new vixenworks.tabs({
                title: 'Compras pendientes',
                container: 'Main',
                tabs: pendingPurchases.statuses.map(status => ({
                    displayName: project.purchases.status[status.name].displayName,
                    content: new project.summary.purchasesBySupplier({ suppliers: status.suppliers.map(supplier => ({ expanded: true, ...supplier })) }).div
                })).sort((a, b) => statusesOrder.indexOf(a.displayName) - statusesOrder.indexOf(b.displayName))
            });
        })
        .catch(error => { vixenworks.error.show(error, 'No hay compras pendientes.'); });
    },
    showWithOutstandingBalance: () => {
        vixenworks.restfulApi.performRequest('purchases/with-outstanding-balance')
        .then(purchasesWithOutstandingBalance => {
            const suppliers = [];
            let balance = new Big(0);

            for (const supplier of purchasesWithOutstandingBalance.suppliers) {
                let supplierName = supplier.name;
                let supplierSaldoAFavor = new Big(0);
                supplier.saldosAFavor.forEach(saldoAFavor => supplierSaldoAFavor = supplierSaldoAFavor.plus(saldoAFavor));
                if (supplierSaldoAFavor.gt(0)) {
                    const supplierSaldoAFavorSpan = document.createElement('span');
                    supplierSaldoAFavorSpan.classList.add('vixenworks-monospaced');
                    supplierSaldoAFavorSpan.textContent = `$ ${vixenworks.number.toString(supplierSaldoAFavor.toNumber())}`;
                    supplierName = [ supplierName, ' (saldo a favor ', supplierSaldoAFavorSpan, ')'];
                }
                const supplier_ = {
                    name: supplierName,
                    amount: new Big(0),
                    purchases: []
                };

                for (const purchase of supplier.purchasesWithOutstandingBalance) {
                    let purchaseBalance = new Big(0);

                    for (const outstandingBalance of purchase.outstandingBalances) purchaseBalance = purchaseBalance.plus(outstandingBalance);
                    supplier_.purchases.push({
                        name: purchase.name,
                        amount: purchaseBalance,
                        number: purchase.number
                    });

                    supplier_.amount = supplier_.amount.plus(purchaseBalance);
                }
                suppliers.push(supplier_);

                balance = balance.plus(supplier_.amount);
            }
            const totalSpan = document.createElement('span');
            totalSpan.classList.add('vixenworks-monospaced');
            totalSpan.textContent = `$ ${vixenworks.number.toString(balance.toNumber())}`;

            new project.summary.purchasesBySupplier({
                container: 'Main',
                class: 'purchases-with-outstanding-balance',
                suppliers: suppliers,
                title: [ 'Compras pendientes de pago. Monto ', totalSpan ],
            });
        })
        .catch(error => { vixenworks.error.show(error, 'No hay compras pendientes de pago.'); });
    },
    status: Object.freeze({
        'Not started': {
            class: 'status-not-started',
            displayName: 'No iniciada'
        },
        'Awaiting estimate': {
            class: 'status-awaiting-estimate',
            displayName: 'Esperando cotización'
        },
        'Estimate received': {
            class: 'status-estimate-received',
            displayName: 'Cotización recibida'
        },
        'Confirmed': {
            class: 'status-confirmed',
            displayName: 'Confirmada'
        },
        'In transit': {
            class: 'status-in-transit',
            displayName: 'En viaje'
        },
        'Finalized': {
            class: 'status-finalized',
            displayName: 'Finalizada'
        },
        'Cancelled': {
            class: 'status-cancelled',
            displayName: 'Cancelada'
        }
    })
};
