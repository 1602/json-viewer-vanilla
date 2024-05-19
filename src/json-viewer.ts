// import { treeNode } from './tree-node.ts';
import styles from './json-viewer.css?inline';
import {
    ce,
    ctn,
    findNextVisibleListItem,
    findPrevVisibleListItem,
    clickOn,
    isInViewport,
} from './dom.js';

export function jsonViewer(json: string, expandedNodes: {[key: string]: boolean}, onExpandedChange: () => void): HTMLElement {
    let selectedNode: HTMLLIElement|null = null;
    const value = JSON.parse(json);
    const jv = ce('div', { class: 'json-tree' }, [
        ce('style', {}, [ctn(styles)]),
        ce('ol', {
           class: 'expanded',
           role: 'tree',
           tabIndex: '0'
       }, treeNode({ value, path: '', expandedNodes, onSelectedNode, onExpandedChange }))
    ]);

    jv.addEventListener('keydown', onKeyDownHandler)

    function onKeyDownHandler(e: KeyboardEvent) {
        if (e.altKey || e.metaKey || e.ctrlKey) {
            return;
        }

        const selectedElement = jv.querySelector(':scope li.selected');
        if (!selectedElement) {
            select(jv.firstElementChild?.firstElementChild as HTMLLIElement);
            return;
        }

        switch (e.code) {
            case 'ArrowLeft': {
                e.preventDefault();
                if (selectedElement.getAttribute('aria-expanded')) {
                    clickOn(selectedElement);
                } else {
                    select(selectedElement.parentElement?.previousElementSibling as HTMLLIElement);
                }
            }
            break;
            case 'ArrowRight': {
                e.preventDefault();
                if (selectedElement.getAttribute('aria-expanded')) {
                    select(findNextVisibleListItem(selectedElement) as HTMLLIElement);
                } else {
                    clickOn(selectedElement);
                }
            }
            break;
            case 'ArrowDown':
            case 'KeyJ':
                e.preventDefault();
                select(findNextVisibleListItem(selectedElement) as HTMLLIElement);
            break;
            case 'ArrowUp':
            case 'KeyK': {
                e.preventDefault();
                select(findPrevVisibleListItem(selectedElement) as HTMLLIElement);
            }
            break;
        }
    }

    function select(el?: HTMLLIElement) {
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

    return jv;

    function onSelectedNode(li: HTMLLIElement) {
        if (selectedNode) {
            selectedNode.classList.remove('selected');
            selectedNode.removeAttribute('aria-selected');
            selectedNode.removeAttribute('tabindex');
        }
        selectedNode = li;
        selectedNode.classList.add('selected');
        selectedNode.setAttribute('tabindex', '1');
        selectedNode.setAttribute('aria-selected', 'true');
    }
}

export type JsonValue = object|Array<JsonValue>|string|number|null;

type TreeNodeParams = {
    value: JsonValue,
    path: string,
    k?: string,
    skipPreview?: boolean,
    displayIndexOffset?: number,
    expandedNodes: {[key: string]: boolean },
    onSelectedNode: (li: HTMLLIElement) => void,
    onExpandedChange: () => void,
}

function treeNode({
    value,
    path,
    k,
    skipPreview,
    displayIndexOffset = 0,
    expandedNodes,
    onSelectedNode,
    onExpandedChange,
}: TreeNodeParams): HTMLElement[] {
    const isParent = typeof value === 'object' && value !== null && Object.keys(value).length > 0;
    let isExpanded = Boolean(expandedNodes[path]);
    let isRendered = isExpanded;

    const li = ce('li', {
        role: 'treeitem',
        'json-path': path,
        class: calcLIClassName(),
        'aria-expanded': isParent && isExpanded ? 'true' : '',
    }, [
        ce('span', { class: 'key-value-pair' }, skipPreview && k ? [ctn(k)] : keyValuePair(value, k)),
        ce('div', { class: 'fill' }),
    ]) as HTMLLIElement;

    function renderChildren() {
        let children: HTMLElement[] = [];
        // TODO render children lazily (only when expanded)
        if (isParent) {
            const ARRAY_CHUNK_LIMIT = 5;
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
                        expandedNodes,
                        onSelectedNode,
                        onExpandedChange,
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
                        expandedNodes,
                        onSelectedNode,
                        onExpandedChange,
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
        expandedNodes[path] = isExpanded;
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
                li.setAttribute('aria-expanded', 'true');
            } else {
                li.removeAttribute('aria-expanded');
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
        return classList.join(' ');
    }

    function calcOLClassName() {
        return isExpanded ? 'expanded' : '';
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

