
export function ce(tagName: string, attributes?: {[key: string]: string}, children?: (Node|null)[]): HTMLElement {
    const el = document.createElement(tagName);
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== '') {
                setAttr(el, key, value);
            }
        });
    }
    if (children) {
        children.forEach(c => {
            if (c) {
                el.appendChild(c);
            }
        });
    }
    return el;
}

export function ctn(t: string): Text {
    return document.createTextNode(t);
}

export function clickOn(el: Element) {
    const theEvent = document.createEvent('MouseEvent');
    theEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    el.dispatchEvent(theEvent);
}

export function findNextVisibleListItem(el: Element|null): HTMLLIElement|null {
    if (!el) {
        return null;
    }

    const nes = el.nextElementSibling;

    if (!nes) {
        return findNextVisibleListItem(el.parentElement!);
    }

    if (nes.tagName === 'LI') {
        return el.nextElementSibling as HTMLLIElement;
    }

    if (nes.tagName === 'OL') {
        const fec = nes.firstElementChild;;
        if (fec?.tagName === 'LI' && fec.checkVisibility()) {
            return fec as HTMLLIElement;
        }

        return findNextVisibleListItem(nes);
    }

    return null;
}

export function findPrevVisibleListItem(el: Element|null): HTMLLIElement|null {
    if (!el) {
        return null;
    }

    const pes = el.previousElementSibling;

    if (!pes) {
        return findPrevVisibleListItem(el.parentElement!);
    }

    if (pes.tagName === 'LI') {
        return pes as HTMLLIElement;
    }

    if (pes.tagName === 'OL') {
        if (pes.checkVisibility()) {
            let { lastElementChild: lec } = pes;
            while (lec?.tagName === 'OL' && lec.checkVisibility()) {
                lec = lec.lastElementChild;
            }

            if (lec && lec.tagName === 'OL') {
                if (lec.previousElementSibling?.tagName === 'LI') {
                    return lec.previousElementSibling as HTMLLIElement;
                }
            }

            if (lec && lec.tagName === 'LI') {
                return lec as HTMLLIElement;
            }
        }

        return findPrevVisibleListItem(pes);
    }

    return null;
}

export function isInViewport(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const scrollableParent = getScrollParent(element);
    if (!scrollableParent) {
        return true;
    }

    const result = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= scrollableParent.clientHeight
    );

    return result;
}

const isScrollable = (node: Element) => {
    if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
        return false
    }
    const style = getComputedStyle(node)
    return ['overflow', 'overflow-x', 'overflow-y'].some((propertyName) => {
        const value = style.getPropertyValue(propertyName)
        return value === 'auto' || value === 'scroll'
    })
}

function getScrollParent(node: Element): Element {
    let currentParent = node.parentElement
    while (currentParent) {
        if (isScrollable(currentParent)) {
            return currentParent
        }
        currentParent = currentParent.parentElement
    }
    return document.scrollingElement || document.documentElement
}

export function remAttr(el: HTMLElement, attr: string) {
    el.removeAttribute(attr);
}

export function setAttr(el: HTMLElement, attr: string, val: string) {
    el.setAttribute(attr, val);
}
