vixenworks.summary = function Summary(args) {
    let titleDiv;

    this.div = document.createElement('div');
    this.div.classList.add('vixenworks-summary');
    if (args.class) args.classes = [ args.class ];
    if (args.classes) this.div.classList.add(...args.classes);

    this.update = {
        title: content => {
            titleDiv.innerHTML = '';
            if (!Array.isArray(content)) content = [ content ];
            titleDiv.append(...content);
        },
        summary: (index, summaryElementIndex, summaryElementContent) => {
            const node = this.div.querySelectorAll(':scope > .summary')[index].querySelectorAll(':scope > .summary > .elements > div')[summaryElementIndex];
            node.innerHTML = '';
            if (!Array.isArray(summaryElementContent)) summaryElementContent = [ summaryElementContent ];
            node.append(...summaryElementContent);
        }
    };

    if (args.title) {
        titleDiv = document.createElement('div');
        titleDiv.classList.add('title');
        this.update.title(args.title);
        this.div.append(titleDiv);
    }

    this.add = (summary, index) => {
        let detailsDiv;

        const detailsToggleImg = vixenworks.icon.returnImg(
            !summary.expanded ? vixenworks.icon.type.plusSign : vixenworks.icon.type.minusSign,
            vixenworks.icon.size.small,
            !summary.expanded ? 'Mostrar detalles' : 'Ocultar detalles',
            'details-toggle'
        );
        detailsToggleImg.addEventListener('click', e => {
            detailsDiv.classList.toggle('visible');
            const { src, alt } = vixenworks.icon.returnImgSrcAndAlt(
                detailsDiv.classList.contains('visible') ? vixenworks.icon.type.minusSign : vixenworks.icon.type.plusSign,
                vixenworks.icon.size.small
            );
            detailsToggleImg.setAttribute('src', src);
            detailsToggleImg.setAttribute('alt', alt);
            detailsToggleImg.setAttribute('title', detailsDiv.classList.contains('visible') ? 'Ocultar detalles' : 'Mostrar detalles');
        });

        const summaryElementsDiv = document.createElement('div');
        summaryElementsDiv.classList.add('elements');
        if (!Array.isArray(summary.summary)) summary.summary = [ summary.summary ];
        summaryElementsDiv.append(...summary.summary);

        const summaryDiv = document.createElement('div');
        summaryDiv.classList.add('summary');
        summaryDiv.append(detailsToggleImg, summaryElementsDiv);

        detailsDiv = document.createElement('div');
        detailsDiv.classList.add('details');
        if (summary.expanded) detailsDiv.classList.add('visible');
        if (!Array.isArray(summary.details)) summary.details = [ summary.details ];
        detailsDiv.append(...summary.details);

        const div = document.createElement('div');
        div.classList.add('summary');
        div.append(summaryDiv, detailsDiv);

        this.div.insertBefore(div, this.div.querySelectorAll(':scope > .summary')[index] || null);
    };

    args.summaries?.forEach(this.add);

    if (args.container) {
        const container = document.createElement('div');
        container.classList.add('vixenworks-main');
        container.append(this.div);
        document.body.append(container);
    }

    this.remove = index => { this.div.querySelectorAll(':scope > .summary')[index].remove(); };
};
