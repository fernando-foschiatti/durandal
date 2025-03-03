vixenworks.details = function Details(arguments) {
    this.update = content => {
        if (content.topRight.row3.right.class) {
            topRightRow3RightDiv.className = '';
            topRightRow3RightDiv.classList.add('right', content.topRight.row3.right.class);
        }
        if (content.topRight.row3.right.text) topRightRow3RightDiv.textContent = content.topRight.row3.right.text;
    };

    const handleWindowResize = e => { topRightRow3LeftDiv.style.width = `${topRightRow3Div.clientWidth - topRightRow3LeftDivWidthDeficit}px`; };

    const logoImg = document.createElement('img');
    logoImg.setAttribute('src', `${vixenworks.frontEndBasePath}img/project/instance/logo.jpg`);
    logoImg.setAttribute('alt', 'Logo');
    const topLeftRow1Div = document.createElement('div');
    topLeftRow1Div.classList.add('row-1');
    topLeftRow1Div.append(logoImg);

    const topLeftRow2Div = document.createElement('div');
    topLeftRow2Div.classList.add('row-2');
    topLeftRow2Div.textContent = arguments.content.topLeft.row2;

    const topLeftRow3Div = document.createElement('div');
    topLeftRow3Div.classList.add('row-3', 'empty');
    if (arguments.content.topLeft.row3) {
        topLeftRow3Div.classList.remove('empty');
        topLeftRow3Div.textContent = vixenworks.date.toString({ date: arguments.content.topLeft.row3, expandedFormat: true });
    }

    const topLeftDiv = document.createElement('div');
    topLeftDiv.classList.add('topLeft');
    topLeftDiv.append(topLeftRow1Div, topLeftRow2Div, topLeftRow3Div);

    const topRightRow1Div = document.createElement('div');
    topRightRow1Div.classList.add('row-1');
    topRightRow1Div.textContent = arguments.content.topRight.row1;

    const topRightRow2Div = document.createElement('div');
    topRightRow2Div.classList.add('row-2');
    topRightRow2Div.textContent = arguments.content.topRight.row2;

    const topRightRow3LeftDiv = document.createElement('div');
    topRightRow3LeftDiv.classList.add('left');
    topRightRow3LeftDiv.textContent = arguments.content.topRight.row3.left;

    let topRightRow3RightDiv;
    if (arguments.content.topRight.row3.right) {
        topRightRow3LeftDiv.style.float = 'left';

        topRightRow3RightDiv = document.createElement('div');
        this.update({
            topRight: {
                row3: {
                    right: {
                        class: arguments.content.topRight.row3.right.class,
                        text: arguments.content.topRight.row3.right.text
                    }
                }
            }
        });
    }

    const topRightRow3Div = document.createElement('div');
    topRightRow3Div.classList.add('row-3');
    topRightRow3Div.append(topRightRow3LeftDiv);
    if (topRightRow3RightDiv) topRightRow3Div.append(topRightRow3RightDiv);

    const topRightDiv = document.createElement('div');
    topRightDiv.classList.add('topRight');
    topRightDiv.append(topRightRow1Div, topRightRow2Div, topRightRow3Div);

    const bottomDiv = document.createElement('div');
    bottomDiv.classList.add('bottom');
    bottomDiv.append(arguments.content.bottom);

    const div = document.createElement('div');
    div.classList.add('vixenworks-details', arguments.class);
    div.append(topLeftDiv, topRightDiv, bottomDiv);

    const container = document.createElement('div');
    container.classList.add('vixenworks-main');
    container.append(div);
    document.body.append(container);

    let topRightRow3LeftDivWidthDeficit;
    if (topRightRow3RightDiv) {
        topRightRow3LeftDivWidthDeficit = topRightRow3RightDiv.offsetWidth + 227;
        handleWindowResize();
        window.addEventListener('resize', handleWindowResize);
    }
};
