document.addEventListener('DOMContentLoaded', () => {
    function createHeaderElement(type, text, id) {
        const headerDiv = document.createElement('div');
        headerDiv.className = `sticky-header header-${type}`;
        headerDiv.id = id;
        headerDiv.innerHTML = `<h${type === 'parent' ? '1' : type === 'child' ? '2' : '3'}>${text}</h${type === 'parent' ? '1' : type === 'child' ? '2' : '3'}`;
        return headerDiv;
    }

    function createContentElement(content) {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'header-content';
        contentDiv.innerHTML = content;
        return contentDiv;
    }

    function getFormData() {
        const forms = document.querySelectorAll('.header-content form');
        const formData = {};

        forms.forEach(form => {
            const formId = form.id;
            const formObject = {};
            new FormData(form).forEach((value, key) => {
                formObject[key] = value;
            });
            formData[formId] = formObject;
        });

        return formData;
    }

    function extractHeaderData(headers, formData) {
        return headers.map(header => {
            const result = {
                id: header.id,
                type: header.type,
                text: header.text,
                contentId: header.templateId,
                children: header.children ? extractHeaderData(header.children, formData) : [],
                formData: formData[header.id] || null
            };
            return result;
        });
    }

    function addContentToHeaders(headers, templates) {
        headers.forEach(header => {
            if (header.children && header.children.length > 0) {
                addContentToHeaders(header.children, templates);
            }

            if (header.contentId) {
                header.content = templates[header.contentId].html;
            }
        });
    }

    function renderHeaders(headers, parentElement) {
        headers.forEach(header => {
            const headerElement = createHeaderElement(header.type, header.text, header.id);
            parentElement.appendChild(headerElement);
            if (header.content) {
                const contentElement = createContentElement(header.content);
                parentElement.appendChild(contentElement);
            }

            if (header.children && header.children.length > 0) {
                const childrenContainer = document.createElement('div');
                parentElement.appendChild(childrenContainer);
                renderHeaders(header.children, childrenContainer);
            }
        });
    }

    function handleFormSubmission(headersData) {
        const formData = getFormData();
        const headersInfo = extractHeaderData(headersData.headers, formData);
        const outputData = {
            headers: headersInfo
        };
        return outputData;
    }

    function exportJSON() {
        const headersData = JSON.parse(document.getElementById('headersData').textContent);
        const templates = JSON.parse(document.getElementById('templates').textContent);

        const outputData = handleFormSubmission(headersData);

        const blob = new Blob([JSON.stringify(outputData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'outputData.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    const headersContainer = document.getElementById('headers-container');
    const exportButton = document.getElementById('export-json');

    Promise.all([
        fetch('data/headersData.json').then(response => response.json()),
        fetch('data/templates.json').then(response => response.json())
    ])
    .then(([headersData, templates]) => {
        renderHeaders(headersData.headers, headersContainer);
        exportButton.addEventListener('click', exportJSON);
    })
    .catch(error => console.error('Error loading data:', error));
});
