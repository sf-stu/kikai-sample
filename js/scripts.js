document.addEventListener('DOMContentLoaded', () => {
    fetch('data/headersData.json')
        .then(response => response.json())
        .then(headersData => {
            const templates = {};
            fetch('data/templates.json')
                .then(response => response.json())
                .then(data => {
                    Object.assign(templates, data);
                    const headersContainer = document.getElementById('headers-container');
                    renderHeaders(headersData.headers, headersContainer);
                })
                .catch(error => console.error('Error loading templates:', error));
        })
        .catch(error => console.error('Error loading headersData:', error));

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
            const contentElement = createContentElement(templates[header.templateId].html);
            parentElement.appendChild(contentElement);
            if (header.children && header.children.length > 0) {
                renderHeaders(header.children, parentElement);
            }
        });
    }

    function getFormData() {
        const headers = document.querySelectorAll('.sticky-header');
        const formData = {};

        headers.forEach(header => {
            const id = header.getAttribute('id');
            const content = header.nextElementSibling;

            if (content) {
                const formElements = content.querySelectorAll('input, textarea, select');
                formData[id] = Array.from(formElements).reduce((data, element) => {
                    data[element.name || element.id] = element.value;
                    return data;
                }, {});
            }
        });

        return formData;
    }

    document.getElementById('export-json').addEventListener('click', () => {
        const formData = getFormData();
        const json = JSON.stringify(formData, null, 2);
        console.log(json);
    });
});
