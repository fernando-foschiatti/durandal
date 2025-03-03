vixenworks.listing = function Listing(args) {
    // Update
    this.update = data => {
        let zebraRowTracker = false;

        if (title?.showAmount) title.amountSpan.textContent = data.length.toString();

        tbody.innerHTML = '';

        for (const row of data) {
            const tr = document.createElement('tr');
            if (zebraRowTracker) tr.classList.add('zebra');
            for (const column in columns) {
                const td = document.createElement('td');
                if (columns[column].classes.length) td.classList.add(...columns[column].classes);
                const tdContent = columns[column].modification(row[column]);
                if (!Array.isArray(tdContent)) {
                    if (tdContent) {
                        let tdContentA;
                        if (columns[column].onClick) {
                            tdContentA = document.createElement('a');
                            tdContentA.setAttribute('href', columns[column].onClick.url.replace(columns[column].onClick.placeholder, row[columns[column].onClick.propertyName].toString()));
                            tdContentA.setAttribute('title', columns[column].onClick.tooltip);
                            if (columns[column].onClick.target) tdContentA.setAttribute('target', columns[column].onClick.target);
                            td.append(tdContentA);
                        }
                        if (typeof tdContent === 'string') {
                            if (!columns[column].onClick) td.innerHTML = tdContent;
                            else tdContentA.innerHTML = tdContent;
                        } else if (!columns[column].onClick) td.append(tdContent);
                        else tdContentA.append(tdContent);
                    }
                } else td.append(...tdContent);
                tr.append(td);
                tbody.append(tr);
            }
            zebraRowTracker = !zebraRowTracker;
        }

        if (tableFooter) {
            tableFooter.tfoot.innerHTML = '';
            const tr = document.createElement('tr');
            for (const column of tableFooter.columns) {
                const td = document.createElement('td');
                if (column.classes.length) td.classList.add(...column.classes);
                if (column.columnsWidth) td.setAttribute('colspan', column.columnsWidth.toString());
                td.innerHTML = column.modification(column.content);
                tr.append(td);
            }
            tableFooter.tfoot.append(tr);
        }
    };

    // Columns
    const returnNormalizedColumn = column => {
        const response = {
            classes: [],
            modification: text => vixenworks.text.returnSanitized(text)
        };

        if (column.type) {
            if (column.type.class) response.classes.push(column.type.class);
            else if (column.type.classes) response.classes = column.type.classes;

            if (column.type.modification) response.modification = column.type.modification;
        }

        return response;
    };

    const columns = {};
    const theadTr = document.createElement('tr');
    for (const column in args.columns) {
        const newColumn = {
            ...returnNormalizedColumn(args.columns[column]),
            onClick: null
        };

        if (args.columns[column].onClick) {
            const url = `${vixenworks.frontEndBasePath}${args.columns[column].onClick.url}`;
            const propertyName = url.substring(url.indexOf('{') + 1, url.indexOf('}'));
            newColumn.onClick = {
                url: url,
                placeholder: `{${propertyName}}`,
                propertyName: propertyName,
                tooltip: args.columns[column].onClick.tooltip,
                target: args.columns[column].onClick.target
            };
        }
        columns[column] = newColumn;

        const th = document.createElement('th');
        th.textContent = args.columns[column].displayName || args.columns[column].type?.displayName || args.columns[column];
        theadTr.append(th);
    }

    // Title
    let title;
    if (args.title) {
        title = {
            div: document.createElement('div'),
            amountSpan: null,
            showAmount: args.title.showAmount || false
        };
        title.div.classList.add('title');
        title.div.append(args.title.text || args.title);
        if (title.showAmount) {
            title.amountSpan = document.createElement('span');
            title.amountSpan.classList.add('vixenworks-monospaced');
            title.div.append(' (', title.amountSpan, ')');
        }
    }

    // Actions
    let actionsDiv;
    if (args.actions) {
        actionsDiv = document.createElement('div');
        actionsDiv.classList.add('actions');
        if (!Array.isArray(args.actions)) args.actions = [ args.actions ];
        for (const action of args.actions) {
            const img = vixenworks.icon.returnImg(action.icon, vixenworks.icon.size.large, action.tooltip);
            img.addEventListener('click', action.onClick);
            actionsDiv.append(img);
        }
    }

    // Header
    let headerDiv;
    if (title || actionsDiv) {
        headerDiv = document.createElement('div');
        headerDiv.classList.add('header');
        if (title) headerDiv.append(title.div);
        if (actionsDiv) headerDiv.append(actionsDiv);
    }

    // Table
    // -- Header
    const thead = document.createElement('thead');
    thead.append(theadTr);

    // -- Body
    const tbody = document.createElement('tbody');

    // -- Footer
    let tableFooter;
    if (args.tableFooter) {
        tableFooter = {
            tfoot: document.createElement('tfoot'),
            columns: []
        };
        for (const column of args.tableFooter.columns) {
            tableFooter.columns.push({
                ...returnNormalizedColumn(column),
                columnsWidth: column.columnsWidth || null,
                content: column.content
            });
        }
    }

    // -- Table
    const table = document.createElement('table');
    table.append(thead, tbody);
    if (tableFooter) table.append(tableFooter.tfoot);

    // Div
    this.div = document.createElement('div');
    this.div.classList.add('vixenworks-listing');
    if (headerDiv) this.div.append(headerDiv);
    this.div.append(table);

    this.update(args.data);

    // Container
    if (args.container) {
        const container = document.createElement('div');
        container.classList.add('vixenworks-main');
        container.append(this.div);
        document.body.append(container);
    }
};

// Column types
vixenworks.listing.column = {
    type: Object.freeze({
        date: {
            displayName: 'Fecha',
            classes: [ 'vixenworks-monospaced', 'vixenworks-right-aligned' ],
            modification: date_ => {
                const date = new Date(date_);
                return [ date.getUTCDate(), (date.getUTCMonth() + 1).toString().padStart(2, '0'), date.getUTCFullYear() ].join('/');
            }
        },
        icon: {
            displayName: 'Fichero',
            classes: [ 'vixenworks-centered', 'icon' ],
            modification: args => args ? vixenworks.icon.returnImg(args.type, args.size, args.tooltip, args.class) : null
        },
        number: {
            classes: [ 'vixenworks-monospaced', 'vixenworks-right-aligned' ],
            modification: args => vixenworks.number.toString(args)
        },
        timestamp: {
            displayName: 'Fecha y hora',
            classes: [ 'vixenworks-monospaced', 'vixenworks-right-aligned' ],
            modification: timestamp => {
                const date = new Date(timestamp);
                return `${[ date.getDate(), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear() ].join('/')}&nbsp;${[ date.getHours().toString().padStart(2, ' '), date.getMinutes().toString().padStart(2, '0') ].join(':')}`;
            }
        },
        users: {
            displayName: 'Usuarios',
            class: 'users',
            modification: users => {
                const response = [];

                for (const user of users) {
                    const div = document.createElement('div');
                    div.setAttribute('title', user.name);
                    div.style.backgroundColor = `#${user.backgroundColor}`;
                    div.style.color = user.isForegroundColorBlack ? '#000000' : '#ffffff';
                    div.textContent = user.initials;
                    response.push(div);
                }

                return response;
            }
        }
    })
};
