const windowThickness = 8; // Windows のタスクバー分ではなく、ウィンドウ枠の厚さを考慮

/** Move the current window to a specified position
 * アクティブなウィンドウを指定位置に移動する
 * @param {string} position - "left", "right", "top", or "bottom"
 * @returns {void}
 */
function moveWindow(position) {
    chrome.windows.getCurrent({}, (window) => {
        chrome.system.display.getInfo((displays) => {
            const centerX = window.left + window.width / 2;
            const centerY = window.top + window.height / 2;
            const targetDisplay = displays.find(d => {
                const b = d.bounds;
                return (
                    centerX >= b.left &&
                    centerX <= b.left + b.width &&
                    centerY >= b.top &&
                    centerY <= b.top + b.height
                );
            });

            if (!targetDisplay) return;
            const b = targetDisplay.bounds;
            let newLeft = window.left;
            let newTop = window.top;

            switch (position) {
                case "topLeft":
                    newLeft = b.left - windowThickness;
                    newTop = b.top - windowThickness;
                    break;
                case "topRight":
                    newLeft = b.left + b.width - window.width
                        + windowThickness;
                    newTop = b.top - windowThickness;
                    break;
                case "bottomLeft":
                    newLeft = b.left - windowThickness;
                    newTop = b.top + b.height - window.height
                        - windowThickness;
                    break;
                case "bottomRight":
                    newLeft = b.left + b.width - window.width
                        + windowThickness;
                    newTop = b.top + b.height - window.height
                        - windowThickness;
                    break;
                case "center":
                    newLeft = b.left + Math.floor((b.width - window.width) / 2);
                    newTop = b.top + Math.floor((b.height - window.height) / 2);
                    break;
                case "left":
                    newLeft = b.left - windowThickness;
                    break;
                case "right":
                    newLeft = b.left + b.width - window.width
                        + windowThickness;
                    break;
                case "top":
                    newTop = b.top - windowThickness;
                    break;
                case "bottom":
                    newTop = b.top + b.height - window.height
                        - windowThickness;
                    break;
            }

            chrome.windows.update(window.id, { left: newLeft, top: newTop });
        });
    });
}

/** Update and display current window size and position
 * アクティブなウィンドウのサイズと位置を取得して表示する
 * @returns {void}
 */
function updateWindowInfo() {
    let contentText = `- × -`;
    chrome.windows.getCurrent({}, (window) => {
        contentText =
            `${window.width} × ${window.height}`;
        document.getElementById("currentSize").textContent = contentText;
        document.getElementById("currentPosition").textContent =
            `${window.left} , ${window.top}`;
    });

    // タブの表示領域サイズ
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            const url = tabs[0].url || "";
            //testText(url);

            if (url.startsWith("chrome://") || url.startsWith("about:")) {
                // 内部ページはスクリプト注入不可 → 表示領域サイズは取得しない
                contentText += " | Content: (not accessible)";
            } else {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        return { w: window.innerWidth, h: window.innerHeight };
                    }
                }, (results) => {
                    if (results && results[0] && results[0].result) {
                        const { w, h } = results[0].result;
                        contentText += " | " + `${w} × ${h}`;
                    }
                    // ← 結果が返ってきたタイミングで更新
                    document.getElementById("currentSize").textContent = contentText;
                });
            }
        }
    });
}

/** Format display information as a string
 * ディスプレイ情報をdiv文字列化
 * @param {Object} display - display object from chrome.system.display.getInfo
 * @returns {string} formatted display information
 */
function displayInfoDivText(display, number) {
    const name = `Display${number}` + (display.name ? ` : ${display.name}` : "");
    const bounds = display.bounds;
    const position = `( ${bounds.left} , ${bounds.top} )`;
    const size = `${bounds.width} x ${bounds.height}`;
    return `<div class="displayInfo" style="text-align: left;">${name}</div><div class="displayInfo"> ${position} ${size}</div>`;
}


/** Format display information as a string
 * ディスプレイ情報をtbody文字列化
 * @param {Object} display - display object from chrome.system.display.getInfo
 * @returns {string} formatted display information
 */
function displayInfo(display, number) {
    const name = (display.name ? `${display.name}` : `Display${number}`);
    const bounds = display.bounds;
    const position = ` ( ${bounds.left} , ${bounds.top} )`;
    const size = `${bounds.width} x ${bounds.height}`;
    return `<tr><td style="text-align: left;">${name}</td><td style="text-align: left;">${number}${position}</td><td style="text-align: left;">${size}</td></tr>`;
}

/** Display the current display size
 * ディスプレイの表示領域サイズを表示する
 * @returns {void}
 */
function showDisplaySize() {
    chrome.system.display.getInfo((displays) => {
        console.log({ displays });

        // ディスプレイ情報の表示
        //const displayInfoDiv = document.getElementById("displays");
        const displayInfoElement = document.getElementById("displaySize");
        displayInfoElement.innerHTML = "";
        let displayInfoText = "";
        if (displays && displays.length > 0) {
            let number = 1;
            // 全ディスプレイ情報の取得
            displays.forEach(display => {
                //testText(JSON.stringify(display));
                displayInfoText += displayInfo(display, number);
                number++;
            });

            // 現在のメインディスプレイを取得
            /*
            const primary = displays.find(d => d.isPrimary) || displays[0];
            const width = primary.bounds.width;
            const height = primary.bounds.height;
            testText({ primary, width, height });

            document.getElementById("displaySize").innerHTML =
                `<tr><td>Display</td><td>Primary</td><td style="text-align: center;">${width} × ${height}</td></tr>`;
            */
            displayInfoElement.innerHTML = displayInfoText;
        }
        //displayInfoDiv.innerHTML = displayInfoText;
    });
}
