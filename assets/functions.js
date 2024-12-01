const cl = console.log;

const w_fetch = `
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
                    self.postMessage({ success: true, xsdDoc: xsdText });
                })
                .catch(error => {
                    self.postMessage({ success: false, error: error.message });
                });
        };
        `;
function findNode(element, tagName, attrName = null, attrValue = null, returnAttr = null) {
    // Si l'élément n'est pas un document, créer un document XML vide et insérer l'élément
    if (!(element instanceof Document)) {
        const parser = new DOMParser();
        const emptyDoc = parser.parseFromString("<root xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:ccts=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\"></root>", "application/xml");
        const importedNode = emptyDoc.importNode(element, true);
        emptyDoc.documentElement.appendChild(importedNode);
        element = emptyDoc;
    }

    // Résolution des namespaces
    const nsResolver = (prefix) => {
        const namespaces = {
            'xsd': 'http://www.w3.org/2001/XMLSchema',
            'ccts': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2' // Ajout du namespace ccts
        };
        return namespaces[prefix] || null;
    };

    // Construire l'expression XPath
    let xpathExpr = `//${tagName}`;
    if (attrName && attrValue) {
        xpathExpr += `[@${attrName}="${attrValue}"]`;
    }

    // Utiliser XPath pour trouver le nœud
    const xpathResult = element.evaluate(xpathExpr, element, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const foundNode = xpathResult.singleNodeValue;

    // Si aucun nœud n'est trouvé, retourner null
    if (!foundNode) {
        return null;
    }

    // Retourner en fonction des options fournies
    if (returnAttr) {
        // Retourner la valeur de l'attribut demandé
        return foundNode.getAttribute(returnAttr);
    } else if (foundNode.childNodes.length === 1 && foundNode.firstChild.nodeType === Node.TEXT_NODE) {
        // Si le nœud est de type texte, retourner le texte
        return foundNode.textContent;
    } else {
        // Sinon, retourner le nœud lui-même
        return foundNode;
    }
}
    const w_fetchBlob = new Blob([w_fetch], { type: 'application/javascript' });
    const w_fetchURL = URL.createObjectURL(w_fetchBlob);
    // Création du worker de récupération des fichiers XSD
    const w_fetchWorker = new Worker(w_fetchURL);

    // Gestion des messages du worker
    w_fetchWorker.onmessage = function(event) {
        const { success, xsdDoc, error } = event.data;
        if (success) {
            // Effectuer le parsing dans le thread principal
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xsdDoc, "application/xml");
            SAM({xelem:xmlDoc})
        } else {
            console.error('Erreur lors de la récupération du XSD:', error);
        }
    };
