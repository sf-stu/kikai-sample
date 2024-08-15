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

    function createHeaderElement(type, text) {
        const headerDiv = document.createElement('div');
        headerDiv.className = `sticky-header header-${type}`;
        headerDiv.innerHTML = `<h${type === 'parent' ? '1' : type === 'child' ? '2' : '3'}>${text}</h${type === 'parent' ? '1' : type === 'child' ? '2' : '3'}`;
        return headerDiv;
    }

    function createContentElement(content) {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'header-content';
        contentDiv.innerHTML = content;
        return contentDiv;
    }

    function renderHeaders(headers, parentElement) {
        headers.forEach(header => {
            const headerElement = createHeaderElement(header.type, header.text);
            parentElement.appendChild(headerElement);
            const contentElement = createContentElement(templates[header.templateId]?.html || '');
            parentElement.appendChild(contentElement);
            if (header.children && header.children.length > 0) {
                renderHeaders(header.children, parentElement);
            }
        });
    }

    let headersData, templates;

    Promise.all([fetchJSON(headersDataUrl), fetchJSON(templatesUrl)])
        .then(([data, tmpl]) => {
            console.log('Fetched headers data:', data);
            console.log('Fetched templates:', tmpl);
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
            const formObject = {};
            new FormData(form).forEach((value, key) => {
                formObject[key] = value;
            });
            formData.push(formObject);
        });

        return formData;
    }

    // デバッグ用にコンソールに出力
    console.log('Headers Data:', getDataFromHeaders(headersData?.headers || []));
    console.log('Form Data:', getFormData());
});
