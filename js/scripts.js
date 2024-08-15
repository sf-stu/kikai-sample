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

    // フォームデータ取得用
    function getFormData() {
        const forms = document.querySelectorAll('.header-content form');
        const formData = [];

        forms.forEach(form => {
            const headerId = form.closest('.header-content').getAttribute('data-header-id');
            const formObject = { headerId }; // ヘッダーIDを含める
            new FormData(form).forEach((value, key) => {
                formObject[key] = value;
            });
            formData.push(formObject);
        });

        return formData;
    }

    // JSONデータをテキストファイルとしてダウンロード
    function downloadTextFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ボタンクリック時の処理
    document.getElementById('export-json').addEventListener('click', () => {
        const headers = JSON.stringify(getDataFromHeaders(headersData?.headers || []), null, 2);
        const forms = JSON.stringify(getFormData(), null, 2);
        const combinedText = `Headers Data:\n${headers}\n\nForm Data:\n${forms}`;
        downloadTextFile(combinedText, 'combinedData.txt');
    });

    // デバッグ用にコンソールに出力
    console.log('Headers Data:', getDataFromHeaders(headersData?.headers || []));
    console.log('Form Data:', getFormData());
});
