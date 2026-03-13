const applyNoDragToImage = (image: HTMLImageElement) => {
    image.draggable = false;
};

const applyNoDragToNode = (node: Node) => {
    if (node instanceof HTMLImageElement) {
        applyNoDragToImage(node);
        return;
    }

    if (node instanceof Element) {
        for (const image of node.querySelectorAll("img")) {
            applyNoDragToImage(image);
        }
    }
};

export const disableImageDragging = () => {
    for (const image of document.querySelectorAll("img")) {
        applyNoDragToImage(image);
    }

    document.addEventListener("dragstart", (event) => {
        if (event.target instanceof HTMLImageElement) {
            event.preventDefault();
        }
    }, true);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                applyNoDragToNode(addedNode);
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
};
