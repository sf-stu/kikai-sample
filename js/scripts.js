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

    // ヘッダーに関連する全てのフォームデータを取得
    function getAllFormData() {
        const formData = [];
        const headers = document.querySelectorAll('.header-content');

        headers.forEach(header => {
            const headerId = header.getAttribute('data-header-id');
            const headerFormData = { headerId };

            // 通常のフォームフィールドとテーブル内のフィールドをすべて取得
            const inputs = header.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                const inputName = input.name || `input${Math.random().toString(36).substring(7)}`;
                if (input.closest('table')) {
                    // テーブル内の入力はテーブルIDに関連付ける
                    const tableId = input.closest('table').getAttribute('data-table-id') || `table${headerFormData.headerId}`;
                    headerFormData[tableId] = headerFormData[tableId] || [];
                    const cellData = { [inputName]: input.value };
                    headerFormData[tableId].push(cellData);
                } else {
                    headerFormData[inputName] = input.value;
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
        a.click();
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

    // デバッグ用にコンソールに出力
    console.log('Headers Data:', getDataFromHeaders(headersData?.headers || []));
    console.log('Form Data:', getAllFormData());
});
