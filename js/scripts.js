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

    // 全てのフォームデータを取得
    function getAllFormData() {
        const formData = [];
        const headers = document.querySelectorAll('.header-content');

        headers.forEach(header => {
            const headerId = header.getAttribute('data-header-id');
            const headerFormData = { headerId };

            // 通常のフォームフィールドとテーブル内のフィールドをすべて取得
            const inputs = header.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'radio') {
                    if (input.checked) {
                        headerFormData[input.name] = input.value;
                    }
                } else if (input.closest('table')) {
                    // テーブル内の入力はテーブルIDに関連付ける
                    const tableId = input.closest('table').getAttribute('data-table-id') || `table_${headerId}`;
                    if (!headerFormData[tableId]) {
                        headerFormData[tableId] = [];
                    }
                    const cellData = { name: input.name, value: input.value };
                    headerFormData[tableId].push(cellData);
                } else {
                    headerFormData[input.name] = input.value;
                }
            });

            formData.push(headerFormData);
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ボタンクリック時の処理
    document.getElementById('export-json').addEventListener('click', () => {
        // 最新のフォームデータを取得
        const forms = getAllFormData();
        const headers = getDataFromHeaders(headersData?.headers || []);
        const combinedData = combineData(headers, forms);
        downloadJSON(combinedData, 'combinedData.json');
    });

    // ヘッダーデータ取得用関数
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
});
