// import { treeNode } from './tree-node.ts';
import styles from './json-viewer.css?inline';
import {
    ce,
    ctn,
    findNextVisibleListItem,
    findPrevVisibleListItem,
    clickOn,
    isInViewport,
    remAttr,
    setAttr,
} from './dom.js';

export type ExternalState = {
    expandedNodes: {[key: string]: boolean}
    focusedNode: string|null
    selectedPath: string
    value: JsonValue
}

export type JsonValue = object|Array<JsonValue>|string|number|null;

type TreeNodeParams = {
    value: JsonValue,
    path: string,
    k?: string,
    skipPreview?: boolean,
    displayIndexOffset?: number,
}

const ARRAY_CHUNK_LIMIT = 100;
const ariaSelected = 'aria-selected';
const ariaExpanded = 'aria-expanded';

export function jsonViewer(state: ExternalState, onExpandedChange: () => void): [HTMLElement, (el: HTMLLIElement|null) => void] {
    let selectedNode: HTMLLIElement|null = null;
    const jv = ce('div', { class: 'json-tree' }, [
        ce('style', {}, [ctn(styles)]),
        ce('ol', {
           class: 'expanded',
           role: 'tree',
       }, treeNode({ value: state.value, path: '' }))
    ]);

    jv.addEventListener('keydown', onKeyDownHandler);

    function onKeyDownHandler(e: KeyboardEvent) {
        if (e.altKey || e.metaKey || e.ctrlKey) {
            return;
        }

        const selectedElement = jv.querySelector(':scope li.selected');
        if (!selectedElement) {
            select(jv.firstElementChild?.firstElementChild as HTMLLIElement);
            return;
        }

        const isExpanded = selectedElement.ariaExpanded;

        switch (e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                if (isExpanded) {
                    return clickOn(selectedElement);
                }
                select(selectedElement.parentElement?.previousElementSibling as HTMLLIElement);
            break;
            case 'ArrowRight':
                e.preventDefault();
                if (isExpanded) {
                    return select(findNextVisibleListItem(selectedElement));
                }
                clickOn(selectedElement);
            break;
            case 'ArrowDown':
            case 'KeyJ':
                e.preventDefault();
                select(findNextVisibleListItem(selectedElement));
            break;
            case 'ArrowUp':
            case 'KeyK': {
                e.preventDefault();
                select(findPrevVisibleListItem(selectedElement));
            }
            break;
        }
    }

    function select(el: HTMLLIElement|null) {
        if (el) {
            const path = el.getAttribute('json-path');
            if (path !== null) {
                onSelectedNode(el);
                el.focus();
                if (el instanceof HTMLElement) {
                    if (!isInViewport(el)) {
                        el.scrollIntoView({ block: 'center' });
                    }
                }
            }
        }
    }

    return [jv, select];

    function onSelectedNode(li: HTMLLIElement) {
        if (selectedNode) {
            selectedNode.classList.remove('selected');
            remAttr(selectedNode, ariaSelected);
            remAttr(selectedNode, 'tabindex');
        }
        selectedNode = li;
        selectedNode.classList.add('selected');
        setAttr(selectedNode, 'tabindex', '1');
        setAttr(selectedNode, ariaSelected, 'true');
        const jp = li.getAttribute('json-path');
        state.selectedPath = jp || '';
        state.focusedNode = jp;
    }

    function treeNode({
        value,
        path,
        k,
        skipPreview,
        displayIndexOffset = 0,
    }: TreeNodeParams): HTMLElement[] {
        const isParent = typeof value === 'object' && value !== null && Object.keys(value).length > 0;
        let isExpanded = Boolean(state.expandedNodes[path]);
        let isRendered = isExpanded;
        let isSelected = state.selectedPath === path || state.focusedNode === path;

        const li = ce('li', {
            role: 'treeitem',
            'json-path': path,
            class: calcLIClassName(),
            tabindex: isSelected ? '1' : '',
            'aria-expanded': isParent && isExpanded ? 'true' : '',
        }, [
            ce('span', { class: 'key-value-pair' }, skipPreview && k ? [ctn(k)] : keyValuePair(value, k)),
            ce('div', { class: 'fill' }),
        ]) as HTMLLIElement;

        li.addEventListener('blur', () => {
            if (state.focusedNode === path) {
                state.focusedNode = null;
            }
        });
        li.addEventListener('copy', (event: ClipboardEvent) => {
            if (event.clipboardData) {
                event.clipboardData.setData("text/plain", JSON.stringify(value, null, 2));
            }
            event.preventDefault();
        });


        function renderChildren() {
            let children: HTMLElement[] = [];
            if (isParent) {
                if (Array.isArray(value) && value.length > ARRAY_CHUNK_LIMIT) {
                    const a = [];
                    for (let i = 0; i < value.length; i += ARRAY_CHUNK_LIMIT) {
                        const arrayChunkLabel = `[${i} … ${Math.min(value.length - 1, i + ARRAY_CHUNK_LIMIT - 1)}]`;
                        a.push(treeNode({
                            k: arrayChunkLabel,
                            displayIndexOffset: i,
                            skipPreview: true,
                            value: value.slice(i, i + ARRAY_CHUNK_LIMIT),
                            path: path + '/' + i,
                        }));
                    }
                    children = a.flat();
                } else {
                    children = Object.entries(value).map(([k, v]) => {
                        if (Array.isArray(value)) {
                            k = (parseInt(k, 10) + displayIndexOffset).toString();
                        }
                        return treeNode({
                            k,
                            value: v,
                            path: path + '/' + k,
                        });
                    }).flat();
                }
            }
            return children.length ? ce('ol', { role: 'group', class: calcOLClassName() }, children) : null;
        }

        let ol: HTMLElement|null = null;
        if (isParent && isExpanded && isRendered) {
            ol = renderChildren();
        }

        li.addEventListener('click', () => {
            isExpanded = !isExpanded;
            state.expandedNodes[path] = isExpanded;
            onExpandedChange();
            if (isParent && isExpanded && !isRendered) {
                ol = renderChildren();
                li.parentNode!.insertBefore(ol as HTMLElement, li.nextElementSibling);
                isRendered = true;
            }
            if (ol) {
                ol.className = calcOLClassName();
            }
            li.className = calcLIClassName();
            onSelectedNode(li);
            (li as HTMLElement).tabIndex = 1;
            (li as HTMLElement).focus();
            if (isParent) {
                if (isExpanded) {
                    setAttr(li, ariaExpanded, 'true');
                } else {
                    remAttr(li, ariaExpanded);
                }
            }
        });

        return ol ? [li, ol] : [li];

        function calcLIClassName() {
            const classList = [];
            if (isParent) {
                classList.push('parent');
            }
            if (isExpanded) {
                classList.push('expanded');
            }
            if (path === state.focusedNode || path === state.selectedPath) {
                classList.push('selected');
            }
            return classList.join(' ');
        }

        function calcOLClassName() {
            return isExpanded ? 'expanded' : '';
        }
    }

}

function keyValuePair(value: JsonValue, k?: string): HTMLElement[] {
    const valueElement = (() => {switch (typeof value) {
        case 'string':
            return ce('span', { class: 'string-value'}, [ctn(`"${value}"`)]);
        case 'number':
            return ce('span', { class: 'num-value' }, [ctn(value.toString())]);
        case 'boolean':
            return ce('span', { class: 'bool-value' }, [ctn(value ? 'true' : 'false')]);
        case 'object':
            if (value === null) {
                return ce('span', { class: 'null-value' }, [ ctn('null') ]);
            }
            if (Array.isArray(value)) {
                return ce('span', {}, [ ctn(previewValue(value)) ]);
            }
            return ce('span', {}, [ ctn(previewValue(value)) ]);
        default:
            return ce('span', {}, [ ctn('invalid json value') ]);
    }})();

    return [
        k ? [ce('span', { class: 'key-name' }, [ ctn(k) ]), ce('span', { class: 'delim' }, [ ctn(': ') ]) ] : [],
        [ valueElement]
    ].flat();
}

const PREVIEW_CACHE = new Map();

function previewValue(value: JsonValue, depth = 2): string {
    if (depth !== 2) {
        return calc();
    }
    const cached = PREVIEW_CACHE.get(value);
    if (cached) {
        return cached;
    }

    const res = calc();
    PREVIEW_CACHE.set(value, res);
    return res;

    function calc() {
        switch (typeof value) {
            case 'object': {
                if (Array.isArray(value)) {
                    if (depth === 0) {
                        return `[…]`;
                    }
                    const len = value.length;
                    return `[${ value.slice(0, 2).map((v) => previewValue(v, depth - 1)).join(', ') }${ len > 2 ? ',…' : ''}]`;
                }

                if (value === null) {
                    return 'null';
                }

                if (depth === 0) {
                    return `{…}`;
                }

                const entries = Object.entries(value as object);
                const len = entries.length;
                return `{${ entries.slice(0, 2).map(([k, v]) => `${k}: ${previewValue(v as JsonValue, depth - 1)}`).join(', ')}${len > 2 ? ',…' : ''}}`;
            }
            case 'string': {
                return `"${value.substring(0, 100)}"`;
            }
            default: {
                return value.toString();
            }
        }
        return typeof value;
    }
}

