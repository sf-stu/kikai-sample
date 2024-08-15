document.addEventListener('DOMContentLoaded', () => {
    const headersDataUrl = 'headersData.json';
    const templatesUrl = 'templates.json';

    function fetchJSON(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error loading data:', error);
                throw error;
            });
    }

    function createHeaderElement(type, text, id) {
        const headerDiv = document.createElement('div');
        headerDiv.className = `sticky-header header-${type}`;
        headerDiv.setAttribute('data-header-id', id); // ヘッダーIDを属性として設定
        headerDiv.innerHTML = `<h${type === 'parent' ? '1' : type === 'child' ? '2' : '3'}>${text}</h${type === 'parent' ? '1' : 'child' ? '2' : '3'}`;
        return headerDiv;
    }

    function createContentElement(content, headerId) {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'header-content';
        contentDiv.setAttribute('data-header-id', headerId); // ヘッダーIDを属性として設定
        contentDiv.innerHTML = content;
        return contentDiv;
    }

    function renderHeaders(headers, parentElement) {
        headers.forEach(header => {
            const headerElement = createHeaderElement(header.type, header.text, header.id);
            parentElement.appendChild(headerElement);
            const contentElement = createContentElement(templates[header.templateId]?.html || '', header.id);
            parentElement.appendChild(contentElement);
            if (header.children && header.children.length > 0) {
                renderHeaders(header.children, parentElement);
            }
        });
    }

    let headersData, templates;

    Promise.all([fetchJSON(headersDataUrl), fetchJSON(templatesUrl)])
        .then(([data, tmpl]) => {
            headersData = data;
            templates = tmpl;
            const headersContainer = document.getElementById('headers-container');
            renderHeaders(headersData.headers, headersContainer);
        })
        .catch(error => {
            console.error('Error:', error);
        });

    // データ取得用関数
    function getDataFromHeaders(headers) {
        return headers.map(header => {
            const result = {
                id: header.id,
                type: header.type,
                text: header.text,
                contentId: header.templateId,
                children: header.children ? getDataFromHeaders(header.children) : []
            };
            return result;
        });
    }

    // フォームデータおよびテーブルデータ取得用
    function getFormData() {
        const forms = document.querySelectorAll('.header-content form');
        const formData = [];

        forms.forEach(form => {
            const headerId = form.closest('.header-content').getAttribute('data-header-id');
            const formObject = { headerId }; // ヘッダーIDを含める

            // 通常のフォームデータ取得
            new FormData(form).forEach((value, key) => {
                formObject[key] = value;
            });

            // テーブルデータ取得
            const tables = form.querySelectorAll('table');
            tables.forEach((table, index) => {
                const tableData = [];
                const rows = table.querySelectorAll('tr');
                rows.forEach((row, rowIndex) => {
                    const rowData = {};
                    const cells = row.querySelectorAll('td');
                    cells.forEach((cell, cellIndex) => {
                        const input = cell.querySelector('input, select, textarea');
                        if (input) {
                            rowData[`row${rowIndex + 1}_cell${cellIndex + 1}`] = input.value;
                        }
                    });
                    tableData.push(rowData);
                });
                formObject[`table${index + 1}`] = tableData;
            });

            formData.push(formObject);
        });

        return formData;
    }

    // Headers Data と Form Data を合体
    function combineData(headers, formData) {
        return headers.map(header => {
            const combinedHeader = { ...header };
            combinedHeader.forms = formData.filter(form => form.headerId === header.id);
            if (header.children && header.children.length > 0) {
                combinedHeader.children = combineData(header.children, formData);
            }
            return combinedHeader;
        });
    }

    // JSONデータをテキストファイルとしてダウンロード
    function downloadJSON(jsonData, filename) {
        const jsonStr = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ボタンクリック時の処理
    document.getElementById('export-json').addEventListener('click', () => {
        // 最新のフォームデータを取得
        const forms = getFormData();
        const headers = getDataFromHeaders(headersData?.headers || []);
        const combinedData = combineData(headers, forms);
        downloadJSON(combinedData, 'combinedData.json');
    });

    // デバッグ用にコンソールに出力
    console.log('Headers Data:', getDataFromHeaders(headersData?.headers || []));
    console.log('Form Data:', getFormData());
});
