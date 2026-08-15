
/**
 * Provides document-level mouse behavior shared by renderer windows.
 *
 * `DisplayWindowClient` and `MainWindowClient` call these static methods during initialization.
 * The current behavior prevents native dragging of images and selected text throughout the
 * document, including images added dynamically after the window loads.
 */
export class Mouse {
    constructor() {
    }

    private static applyNoDragToImage = (image: HTMLImageElement) => {
        image.draggable = false;
    };

    private static applyNoDragToNode = (node: Node) => {
        if (node instanceof HTMLImageElement) {
            this.applyNoDragToImage(node);
            return;
        }

        if (node instanceof Element) {
            for (const image of node.querySelectorAll("img")) {
                this.applyNoDragToImage(image);
            }
        }
    };

    private static isDraggingSelectedText = (target: EventTarget | null): boolean => {
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            return target.selectionStart !== null &&
                target.selectionEnd !== null &&
                target.selectionStart !== target.selectionEnd;
        }

        const selection = window.getSelection();
        return target instanceof Node &&
            selection !== null &&
            !selection.isCollapsed &&
            selection.toString().length > 0 &&
            selection.containsNode(target, true);
    };

    static disableImageAndTextDragging = () => {
        for (const image of document.querySelectorAll("img")) {
            this.applyNoDragToImage(image);
        }

        document.addEventListener("dragstart", (event) => {
            if (event.target instanceof HTMLImageElement || this.isDraggingSelectedText(event.target)) {
                event.preventDefault();
            }
        }, true);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const addedNode of mutation.addedNodes) {
                    this.applyNoDragToNode(addedNode);
                }
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    };

}
