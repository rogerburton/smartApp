self.onmessage = function(event) {
    const { xsdType, fileName } = event.data;
    const baseUrl = 'https://cdn.jsdelivr.net/gh/rogerburton/smartApp@main/xsd/';
    const url = baseUrl + xsdType + '/' + fileName;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur HTTP! Statut: ' + response.status);
            }
            return response.text();
        })
        .then(xsdText => {
            const parser = new DOMParser();
            const xsdDoc = parser.parseFromString(xsdText, "application/xml");
            self.postMessage({ success: true, xsdDoc });
        })
        .catch(error => {
            self.postMessage({ success: false, error: error.message });
        });
};

