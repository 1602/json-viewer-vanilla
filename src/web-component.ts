import { jsonViewer, ExternalState } from './json-viewer.js';

export type ExpandedChangeParams = {
    expanded: { [key: string]: boolean };
};

interface CustomEventMap {
    'json-viewer:expanded-change': CustomEvent<ExpandedChangeParams>;
}

declare global {
    interface Document {
        //adds definition to Document, but you can do the same with HTMLElement
        addEventListener<K extends keyof CustomEventMap>(
            type: K,
            listener: (this: Document, ev: CustomEventMap[K]) => void
        ): void;
        dispatchEvent<K extends keyof CustomEventMap>(
            ev: CustomEventMap[K]
        ): void;
    }
}

export class JsonViewerWebComponent extends HTMLElement {
    private valueProp: string;
    private jsonViewerState: ExternalState;
    private appRoot: HTMLDivElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.valueProp = '';
        this.jsonViewerState = {
            expandedNodes: {},
            focusedNode: null,
            value: null,
            selectedPath: '',
        };
        this.appRoot = document.createElement('div');
        this.shadowRoot!.appendChild(this.appRoot);
    }

    connectedCallback() {
        this.valueProp = this.getAttribute('value') || this.textContent || '';
        if (typeof this.valueProp !== 'string') {
            return (this.appRoot.innerText = `json-viewer expects value to be string, got ${typeof this.valueProp}`);
        }
        const expandedNodesProp = this.getAttribute('expanded');
        if (typeof expandedNodesProp === 'string') {
            try {
                this.jsonViewerState.expandedNodes =
                    JSON.parse(expandedNodesProp);
            } catch (e) {}
        }
        this.render();
    }

    render() {
        if (!this.valueProp) {
            return;
        }
        const { focusedNode } = this.jsonViewerState;
        try {
            this.jsonViewerState.value = JSON.parse(this.valueProp);
        } catch (e: any) {
            return (this.appRoot.innerText = e);
        }
        const [jv, select] = jsonViewer(this.jsonViewerState, () => {
            const params: ExpandedChangeParams = {
                expanded: this.jsonViewerState.expandedNodes,
            };
            this.emit('expanded-change', params);
        });
        this.shadowRoot!.replaceChild(jv, this.shadowRoot!.firstElementChild!);
        if (focusedNode) {
            const li = jv.querySelector(
                `:scope li[json-path="${focusedNode}"]`
            );
            if (li) {
                select(li as HTMLLIElement);
            }
        }
    }

    expandAll() {
        this.setExpandedAll(true);
    }

    collapseAll() {
        this.setExpandedAll(false);
    }

    private setExpandedAll(expand: boolean) {
        const expanded: { [key: string]: boolean } = {};
        walk(this.jsonViewerState.value);
        this.expanded = expanded;

        function walk(node: any, path: string = '') {
            if (typeof node === 'object' && node !== null) {
                expanded[path || '/'] = expand;
                Object.keys(node).forEach((key) =>
                    walk(node[key], path + '/' + key)
                );
            }
        }
    }

    get value() {
        return this.valueProp;
    }

    set value(val) {
        if (this.valueProp === val) {
            return;
        }
        this.valueProp = val;
        if (val === '') {
            return;
        }
        if (typeof val !== 'string') {
            this.appRoot.innerText = `json-viewer expects value to be string, got ${typeof val}`;
            return;
        }
        this.render();
    }

    get expanded() {
        return this.jsonViewerState.expandedNodes;
    }

    set expanded(val) {
        if (this.jsonViewerState.expandedNodes === val) {
            return;
        }
        this.jsonViewerState.expandedNodes = val;
        this.render();
    }

    /**
     * Emit a custom event
     * @param  {String} type   The event type
     * @param  {Object} detail Any details to pass along with the event
     */
    emit(eventName: string, detail = {}) {
        // Create a new event
        let event = new CustomEvent(`json-viewer:${eventName}`, {
            bubbles: true,
            cancelable: true,
            detail,
        });

        // Dispatch the event
        return this.dispatchEvent(event);
    }
}
