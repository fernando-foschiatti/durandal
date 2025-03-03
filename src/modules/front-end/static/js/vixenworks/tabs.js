vixenworks.tabs = function Tabs(args) {
    const select = index => {
        if (selectedIndex !== -1) {
            tabsDiv.children[selectedIndex].classList.remove('selected');
            contentsDiv.children[selectedIndex].classList.remove('selected');
        }
        selectedIndex = index;
        tabsDiv.children[selectedIndex].classList.add('selected');
        contentsDiv.children[selectedIndex].classList.add('selected');
    };

    let titleDiv;
    if (args.title) {
        titleDiv = document.createElement('div');
        titleDiv.classList.add('title');
        titleDiv.textContent = args.title;
    }

    const tabsDiv = document.createElement('div');
    tabsDiv.classList.add('tabs');

    const contentsDiv = document.createElement('div');
    contentsDiv.classList.add('contents');
    for (const [ tabIndex, tabElement ] of args.tabs.entries()) {
        const tabDiv = document.createElement('div');
        tabDiv.classList.add('tab');
        tabDiv.textContent = tabElement.displayName;
        tabDiv.addEventListener('click', e => { select(tabIndex); });
        tabsDiv.append(tabDiv);

        const contentDiv = document.createElement('content');
        contentDiv.classList.add('content');
        contentDiv.append(tabElement.content);
        contentsDiv.append(contentDiv);
    }

    this.div = document.createElement('div');
    this.div.classList.add('vixenworks-tabs');
    if (titleDiv) this.div.append(titleDiv);
    this.div.append(tabsDiv, contentsDiv);

    let selectedIndex = -1;
    select(0);

    if (args.container) {
        const container = document.createElement('div');
        container.classList.add('vixenworks-main');
        container.append(this.div);
        document.body.append(container);
    }
};
