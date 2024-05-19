import { jsonViewer } from './json-viewer.js';

export class JsonViewerWebComponent extends HTMLElement {
    private valueProp: string;
    private appRoot: HTMLDivElement;
    private expandedNodesProp: {[key: string]: boolean};

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.valueProp = '';
        this.expandedNodesProp = {};
        this.appRoot = document.createElement('div');
        this.shadowRoot!.appendChild(this.appRoot);
    }

    connectedCallback() {
        this.valueProp = this.getAttribute('value') || this.textContent || '';
        if (typeof this.valueProp !== 'string') {
          return this.appRoot.innerText = `json-viewer expects value to be string, got ${typeof this.valueProp}`;
        }
        const expandedNodesProp = this.getAttribute('expanded');
        if (typeof expandedNodesProp === 'string') {
            try {
                this.expandedNodesProp = JSON.parse(expandedNodesProp);
            } catch(e) { }
        }
        this.render();
    }

    render() {
        this.shadowRoot!.replaceChild(jsonViewer(this.valueProp, this.expandedNodesProp, () => {
            this.emit('expandedChange', { expanded: this.expandedNodesProp });
        }), this.shadowRoot!.firstElementChild!);
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
        return this.expandedNodesProp;
    }

    set expanded(val) {
        if (this.expandedNodesProp === val) {
            return;
        }
        this.expandedNodesProp = val;
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
            detail
        });

        // Dispatch the event
        return this.dispatchEvent(event);

    }

}
