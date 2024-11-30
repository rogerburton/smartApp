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
        // Vérifier si l'élément est un document
        const nsResolver = element.createNSResolver
            ? element.createNSResolver(element.documentElement)
            : element.ownerDocument.createNSResolver(element.ownerDocument.documentElement);
        
        // Construire l'expression XPath
        let xpathExpr = `//${tagName}`;
        if (attrName && attrValue) {
            xpathExpr += `[@${attrName}="${attrValue}"]`;
        }

        // Utiliser XPath pour trouver le nœud
        const xpathResult = element.evaluate
            ? element.evaluate(xpathExpr, element, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
            : element.ownerDocument.evaluate(xpathExpr, element, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            
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
