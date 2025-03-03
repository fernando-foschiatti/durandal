project.summary = {
    availablePeriods: function AvailablePeriods(args) {
        const summaries = [];

        const currentDate = new Date();
        for (const year of args.availablePeriods.years) {
            const yearDiv = document.createElement('div');
            yearDiv.classList.add('vixenworks-monospaced', 'year');
            yearDiv.textContent = year.number.toString();

            const monthsDiv = document.createElement('div');
            monthsDiv.classList.add('months');
            for (const month of year.months) {
                const monthDiv = document.createElement('div');
                monthDiv.classList.add('month');
                const monthName = vixenworks.date.months[month - 1];
                const monthDivA = document.createElement('a');
                monthDivA.setAttribute('href', `${vixenworks.frontEndBasePath}${args.path}/${year.number}/${monthName}/`);
                let monthDivATextContent = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`;
                if (year.number === currentDate.getFullYear() && month === currentDate.getMonth() + 1) {
                    monthDiv.classList.add('vixenworks-highlighted');
                    monthDivATextContent = `${monthDivATextContent} (actual)`;
                }
                monthDivA.textContent = monthDivATextContent;
                monthDiv.append(monthDivA);
                monthsDiv.append(monthDiv);
            }

            summaries.push({
                expanded: year.number === currentDate.getFullYear(),
                summary: yearDiv,
                details: monthsDiv
            });
        }

        const classes = [ 'available-periods' ];
        if (args.class) classes.push(args.class);

        new vixenworks.summary({
            container: 'Main',
            classes: classes,
            title: `${args.title} - períodos disponibles`,
            summaries: summaries
        });
    },
    purchasesBySupplier: function PurchasesBySupplier(args) {
        const summaries = [];

        const classes = [ 'purchases-by-supplier' ];
        if (args.class) classes.push(args.class);

        for (const supplier of args.suppliers) {
            const supplierNameDiv = document.createElement('div');
            supplierNameDiv.classList.add('supplier-name');
            if (!Array.isArray(supplier.name)) supplier.name = [ supplier.name ];
            supplierNameDiv.append(...supplier.name);

            let supplierAmountDiv;
            if (supplier.amount) {
                supplierAmountDiv = document.createElement('div');
                supplierAmountDiv.classList.add('vixenworks-monospaced', 'supplier-amount');
                supplierAmountDiv.textContent = vixenworks.number.toString(supplier.amount.toNumber());
            }

            const purchasesA = [];
            for (const purchase of supplier.purchases) {
                const purchaseNameDiv = document.createElement('div');
                purchaseNameDiv.classList.add('name');
                purchaseNameDiv.textContent = purchase.name;

                let purchaseAmountDiv;
                if (purchase.amount) {
                    purchaseAmountDiv = document.createElement('div');
                    purchaseAmountDiv.classList.add('vixenworks-monospaced', 'amount');
                    purchaseAmountDiv.textContent = vixenworks.number.toString(purchase.amount.toNumber());
                }

                const purchaseDiv = document.createElement('div');
                purchaseDiv.classList.add('purchase');
                purchaseDiv.append(purchaseNameDiv);
                if (purchaseAmountDiv) purchaseDiv.append(purchaseAmountDiv);

                const purchaseA = document.createElement('a');
                purchaseA.setAttribute('href', `${vixenworks.frontEndBasePath}compra/${purchase.number}`);
                purchaseA.append(purchaseDiv);

                purchasesA.push(purchaseA);
            }

            summaries.push({
                expanded: supplier.expanded,
                summary: supplierAmountDiv ? [ supplierNameDiv, supplierAmountDiv ] : supplierNameDiv,
                details: purchasesA
            });
        }

        const summary = new vixenworks.summary({
            container: args.container,
            classes: classes,
            title: args.title,
            summaries: summaries
        });

        this.div = summary.div;
    }
};
