
export function ce(tagName: string, attributes?: {[key: string]: string}, children?: (Node|null)[]): HTMLElement {
    const el = document.createElement(tagName);
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            el.setAttribute(key, value);
        });
    }
    if (children) {
        children.forEach(c => {
            if (c) {
                el.appendChild(c)
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

    if (!el.nextElementSibling) {
        return findNextVisibleListItem(el.parentElement!);
    }

    if (el.nextElementSibling.tagName === 'LI') {
        return el.nextElementSibling as HTMLLIElement;
    }

    if (el.nextElementSibling.tagName === 'OL') {
        const nes = el.nextElementSibling.firstElementChild;;
        if (nes && nes.checkVisibility() && nes.tagName === 'LI') {
            return el.nextElementSibling.firstElementChild as HTMLLIElement;
        }

        return findNextVisibleListItem(el.nextElementSibling);
    }

    return null;
}

export function findPrevVisibleListItem(el: Element|null): HTMLLIElement|null {
    if (!el) {
        return null;
    }

    if (!el.previousElementSibling) {
        return findPrevVisibleListItem(el.parentElement!);
    }

    if (el.previousElementSibling.tagName === 'LI') {
        return el.previousElementSibling as HTMLLIElement;
    }

    if (el.previousElementSibling.tagName === 'OL') {
        if (el.previousElementSibling.checkVisibility()) {
            let { lastElementChild } = el.previousElementSibling;
            while (lastElementChild && lastElementChild.tagName === 'OL' && lastElementChild.checkVisibility()) {
                lastElementChild = lastElementChild.lastElementChild;
            }

            if (lastElementChild && lastElementChild.tagName === 'OL') {
                if (lastElementChild.previousElementSibling && lastElementChild.previousElementSibling.tagName === 'LI') {
                    return lastElementChild.previousElementSibling as HTMLLIElement;
                }
            }

            if (lastElementChild && lastElementChild.tagName === 'LI') {
                return lastElementChild as HTMLLIElement;
            }
        }

        return findPrevVisibleListItem(el.previousElementSibling);
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
