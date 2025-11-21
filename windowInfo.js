const windowFrameThickness = -8; // Windows のタスクバー分ではなく、ウィンドウ枠の厚さを考慮

/** Test function to display text in the popup
 * @param {string} textContent - text to display
 * @returns {void}
 */
function testText(textContent) {
    document.getElementById("testText").textContent = textContent;
}

/** Move the current window to a specified position
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
                    newLeft = b.left + windowFrameThickness;
                    newTop = b.top + windowFrameThickness;
                    break;
                case "topRight":
                    newLeft = b.left + b.width - window.width
                        - windowFrameThickness;
                    newTop = b.top + windowFrameThickness;
                    break;
                case "bottomLeft":
                    newLeft = b.left + windowFrameThickness;
                    newTop = b.top + b.height - window.height
                        + windowFrameThickness;
                    break;
                case "bottomRight":
                    newLeft = b.left + b.width - window.width
                        - windowFrameThickness;
                    newTop = b.top + b.height - window.height
                        + windowFrameThickness;
                    break;
                case "center":
                    newLeft = b.left + Math.floor((b.width - window.width) / 2);
                    newTop = b.top + Math.floor((b.height - window.height) / 2);
                    break;
                case "left":
                    newLeft = b.left + windowFrameThickness;
                    break;
                case "right":
                    newLeft = b.left + b.width - window.width
                        - windowFrameThickness;
                    break;
                case "top":
                    newTop = b.top + windowFrameThickness;
                    break;
                case "bottom":
                    newTop = b.top + b.height - window.height
                        + windowFrameThickness;
                    break;
            }

            chrome.windows.update(window.id, { left: newLeft, top: newTop });
        });
    });
}

/** Update and display current window size and position
 * @returns {void}
 */
function updateWindowInfo() {
    let contentText = `- × -`;
    chrome.windows.getCurrent({}, (win) => {
        contentText =
            `Size: ${win.width} × ${win.height}`;
        document.getElementById("currentSize").textContent = contentText;
        document.getElementById("currentPosition").textContent =
            `Position: ${win.left} × ${win.top}`;
    });

    // タブの表示領域サイズ
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            const url = tabs[0].url || "";
            testText(url);

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

/** Display the current display size
 * @returns {void}
 */
function showDisplaySize() {
    chrome.system.display.getInfo((displays) => {
        console.log({ displays });
        if (displays && displays.length > 0) {
            // 現在のメインディスプレイを取得
            const primary = displays.find(d => d.isPrimary) || displays[0];
            const width = primary.bounds.width;
            const height = primary.bounds.height;
            testText({ primary, width, height });

            document.getElementById("displaySize").textContent =
                `Display: ${width} × ${height}`;
        }
    });
}
