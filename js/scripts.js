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

    function getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return null;
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }

    function extractHeaderData(headers) {
        let headerData = [];
        headers.forEach(header => {
            const headerItem = {
                id: header.id,
                type: header.type,
                text: header.text,
                content: null,  // Placeholder for content
                children: [],
                formData: null  // Placeholder for form data
            };

            if (header.children && header.children.length > 0) {
                headerItem.children = extractHeaderData(header.children);
            }

            headerData.push(headerItem);
        });
        return headerData;
    }

    function addContentToHeaders(headers, templates) {
        headers.forEach(header => {
            if (header.children && header.children.length > 0) {
                addContentToHeaders(header.children, templates);
            }

            // Add content if this header has a templateId
            if (header.templateId) {
                header.content = templates[header.templateId].html;
            }
        });
    }

    function addFormDataToHeaders(headers, formId) {
        headers.forEach(header => {
            if (header.children && header.children.length > 0) {
                addFormDataToHeaders(header.children, formId);
            }

            // Add form data if this header's template is a form
            if (header.templateId === formId) {
                const formData = getFormData(formId);
                header.formData = formData;
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

    function handleFormSubmission(formId, headersData) {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault(); // Prevent the default form submission
                const headersInfo = extractHeaderData(headersData.headers);
                addContentToHeaders(headersInfo, templates);
                addFormDataToHeaders(headersInfo, formId);
                const outputData = {
                    headers: headersInfo
                };
                console.log('Output Data:', JSON.stringify(outputData, null, 2));
            });
        }
    }

    const headersContainer = document.getElementById('headers-container');

    // Fetch headersData.json and templates.json, then render headers
    Promise.all([
        fetch('data/headersData.json').then(response => response.json()),
        fetch('data/templates.json').then(response => response.json())
    ])
    .then(([headersData, templates]) => {
        renderHeaders(headersData.headers, headersContainer);
        handleFormSubmission('form1-form', headersData); // Ensure to call this after headers are rendered
    })
    .catch(error => console.error('Error loading data:', error));
});
