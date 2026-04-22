  // Variable globale pour garder la trace de l'instance
  // Utiliser window pour éviter les erreurs de redéclaration dans JSBin
  // On utilise var pour JSBin pour éviter les erreurs de redéclaration

const whiteboardView = {
    x: 0,
    y: 0,
    scale: 1,
    minScale: 0.05,
    maxScale: 10
};

let isDraggingWhiteboard = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let whiteboardEventsInitialized = false;

function applyWhiteboardView() {
    const surface = dom['whiteboard-surface'];
    if (!surface) return;

    surface.style.transformOrigin = '0 0';
    surface.style.transform =
        `translate(${whiteboardView.x}px, ${whiteboardView.y}px) scale(${whiteboardView.scale})`;
}

function setWhiteboardView({ x = whiteboardView.x, y = whiteboardView.y, scale = whiteboardView.scale } = {}) {
    whiteboardView.x = x;
    whiteboardView.y = y;
    whiteboardView.scale = Math.max(
        whiteboardView.minScale,
        Math.min(whiteboardView.maxScale, scale)
    );
    applyWhiteboardView();
}

function handleWhiteboardWheel(event) {
    const frame = dom['whiteboard-frame'];
    if (!frame) return;

    event.preventDefault();

    const rect = frame.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const oldScale = whiteboardView.scale;
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

    let newScale = oldScale * zoomFactor;
    newScale = Math.max(whiteboardView.minScale, Math.min(whiteboardView.maxScale, newScale));

    const ratio = newScale / oldScale;

    whiteboardView.x = mouseX - (mouseX - whiteboardView.x) * ratio;
    whiteboardView.y = mouseY - (mouseY - whiteboardView.y) * ratio;
    whiteboardView.scale = newScale;

    applyWhiteboardView();
}

function handleWhiteboardMouseDown(event) {
    // bouton gauche uniquement
    if (event.button !== 0) return;

    const frame = dom['whiteboard-frame'];
    if (frame) {
        frame.classList.add('dragging');
    }

    isDraggingWhiteboard = true;
    dragOffsetX = event.clientX - whiteboardView.x;
    dragOffsetY = event.clientY - whiteboardView.y;
}

function handleWhiteboardMouseMove(event) {
    if (!isDraggingWhiteboard) return;

    whiteboardView.x = event.clientX - dragOffsetX;
    whiteboardView.y = event.clientY - dragOffsetY;
    applyWhiteboardView();
}

function handleWhiteboardMouseUp() {
    isDraggingWhiteboard = false;

    const frame = dom['whiteboard-frame'];
    if (frame) {
        frame.classList.remove('dragging');
    }
}

function initWhiteboardInteractions() {
    if (whiteboardEventsInitialized) return;

    const frame = dom['whiteboard-frame'];
    if (!frame) {
        console.error("whiteboard-frame introuvable");
        return;
    }

    frame.addEventListener('wheel', handleWhiteboardWheel, { passive: false });
    frame.addEventListener('mousedown', handleWhiteboardMouseDown);
    window.addEventListener('mousemove', handleWhiteboardMouseMove);
    window.addEventListener('mouseup', handleWhiteboardMouseUp);

    whiteboardEventsInitialized = true;
}

function resetWhiteboardView() {
    setWhiteboardView({ x: 0, y: 0, scale: 0.2 });
}

function fitWhiteboardToContent(padding = 20) {
    const frame = dom['whiteboard-frame'];
    const container = dom['mermaid-container'];
    const svgElement = container?.querySelector('svg');

    if (!frame || !container || !svgElement) return;

    const frameRect = frame.getBoundingClientRect();

    const svgWidth =
        parseFloat(svgElement.getAttribute('width')) ||
        svgElement.getBoundingClientRect().width;

    const svgHeight =
        parseFloat(svgElement.getAttribute('height')) ||
        svgElement.getBoundingClientRect().height;

    if (!svgWidth || !svgHeight) return;

    const containerLeft = parseFloat(container.style.left) || 0;
    const containerTop = parseFloat(container.style.top) || 0;

    const availableWidth = Math.max(1, frameRect.width - padding * 2);
    const availableHeight = Math.max(1, frameRect.height - padding * 2);

    const scaleX = availableWidth / svgWidth;
    const scaleY = availableHeight / svgHeight;
    const scale = Math.max(
        whiteboardView.minScale,
        Math.min(whiteboardView.maxScale, Math.min(scaleX, scaleY))
    );

    const x = padding - containerLeft * scale;
    const y = padding - containerTop * scale;

    setWhiteboardView({ x, y, scale });
}

async function dessinerSchema(definition) {
    const container = dom['mermaid-container'];
    const surface = dom['whiteboard-surface'];

    if (!container || !surface) {
        console.error("whiteboard-surface ou mermaid-container introuvable");
        return;
    }

    try {
        container.innerHTML = '';

        // état neutre avant nouveau rendu
        surface.style.transformOrigin = '0 0';
        surface.style.transform = 'translate(0px, 0px) scale(1)';

        const uniqueId = 'svg-' + Date.now();
        const { svg } = await mermaid.render(uniqueId, definition);
        container.innerHTML = svg;

        const svgElement = container.querySelector('svg');
        if (!svgElement) {
            console.error("Impossible de trouver le SVG généré.");
            return;
        }

        let minX = 0;
        let minY = 0;

        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.trim().split(/[\s,]+/).map(Number);
            if (parts.length === 4) {
                const [vbMinX, vbMinY, vbWidth, vbHeight] = parts;
                minX = vbMinX;
                minY = vbMinY;
                svgElement.setAttribute('width', vbWidth);
                svgElement.setAttribute('height', vbHeight);
            }
        }

        svgElement.style.display = 'block';
        svgElement.style.maxWidth = 'none';

        // compense un viewBox qui commencerait en x/y négatifs
        container.style.position = 'absolute';
        container.style.left = `${-minX}px`;
        container.style.top = `${-minY}px`;

        // laisse le DOM appliquer la taille avant de fitter
        requestAnimationFrame(() => {
            fitWhiteboardToContent(20);
        });

    } catch (error) {
        console.error("Erreur Mermaid :", error);
        container.innerHTML = "<pre style='color:red'>" + error + "</pre>";
    }
}  
;
