import type { Meta, StoryObj } from '@storybook/web-components';
import { userEvent, expect } from '@storybook/test';

import './index.ts';
import { ce } from './dom.ts';
import { JsonViewerWebComponent } from './web-component.ts';

const meta: Meta = {
    title: 'JsonViewerWebComponent',
    component: 'json-viewer',
    // decorators: [ ... ],
    // parameters: {},
};

export default meta;

type Story = StoryObj;

export const WithValueProp: Story = {
    argTypes: { value: { control: 'object' } },
    args: {
        value: { foo: 'bar' },
    },
    render: ({ value }) => {
        const jv = new JsonViewerWebComponent();
        jv.value = JSON.stringify(value);
        return jv;
    },
};

export const ExpandedNodes: Story = {
    args: {
        value: JSON.stringify({
            foo: 'bar',
            deeply: { nested: { object: { with: { value: null } } } },
        }),
        expanded: { '/': true, '/deeply': true },
    },
};

export const ExpandedChangeEvent: Story = {
    args: {
        value: JSON.stringify({
            foo: 'bar',
            deeply: { nested: { object: { with: { value: null } } } },
        }),
    },
    render: ({ value }) => {
        const pre = new JsonViewerWebComponent();
        pre.expanded = { '/': true };
        const jv = new JsonViewerWebComponent();
        jv.value = value;
        jv.addEventListener(
            'json-viewer:expanded-change',
            ({ detail }: any) => {
                pre.value = JSON.stringify(detail.expanded, null, 2);
            }
        );
        return ce('div', {}, [jv, pre]);
    },
};

export const KeyboardNavigation: Story = {
    args: {
        value: JSON.stringify({
            foo: 'bar',
            array: [1, 2, 3, 4, 5],
            object: { hello: 'world' },
        }),
    },
    play: async ({ canvasElement, step }) => {
        const root = canvasElement
            .querySelector('json-viewer')!
            .shadowRoot!.querySelector('.json-tree');
        if (!root) {
            return;
        }
        const el = root.querySelector('li');
        if (!el) {
            return;
        }
        await step('Focus on root element', async () => {
            await userEvent.click(el);
            await expect(el).toHaveAttribute('aria-expanded');
        });
        // await pause(500);
        await step('Expand/collapse root element', async () => {
            await userEvent.keyboard('{ArrowLeft}');
            await expect(el).not.toHaveAttribute('aria-expanded');
            // await pause(500);
            await userEvent.keyboard('{ArrowRight}');
            // await pause(500);
            await expect(el).toHaveAttribute('aria-expanded');
        });
        await step('Navigate down the tree', async () => {
            await userEvent.keyboard('{ArrowRight}{ArrowDown}{ArrowRight>2}');
            const s = root.querySelector('.selected');
            // await expect(s).toHaveFocus();
            await expect(s).toHaveTextContent('0: 1');
            await expect(s).toHaveAttribute('json-path', '/array/0');
        });
        await pause(500);
        await step('Navigate all the way up', async () => {
            await userEvent.keyboard('{ArrowLeft>4}');
            await expect(el).not.toHaveAttribute('aria-expanded');
        });
    },
};

function pause(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const LargeJsonData: Story = {
    argTypes: {
        source: {
            options: ['array5mb', 'array512kb'],
            control: { type: 'select' },
        },
    },
    args: {
        source: 'array512kb',
    },
    loaders: [
        async () => ({
            array5mb: await (
                await fetch(
                    'https://microsoftedge.github.io/Demos/json-dummy-data/5MB-min.json'
                )
            ).text(),
            array512kb: JSON.stringify(
                (
                    await (
                        await fetch(
                            'https://microsoftedge.github.io/Demos/json-dummy-data/512KB-min.json'
                        )
                    ).json()
                ).reverse()
            ),
        }),
    ],
    render: ({ source }, { loaded }) => {
        const jv = document.createElement(
            'json-viewer'
        ) as JsonViewerWebComponent;
        jv.value = loaded[source];
        return jv;
    },
};

/*
export const VariousJsonExamples: Story = {
    argTypes: {
        value: {
            options: [
                "JSON Schema",
                "Automation Cloud Schemata",
                "512KB Array",
                "5MB Array",
            ],
            control: { type: "select" },
            mapping: {
                "JSON Schema": "https://json-schema.org/draft/2020-12/schema",
                "Automation Cloud Schemata":
                    "https://protocol.automationcloud.net/schema.json",
                "512KB Array":
                    "https://microsoftedge.github.io/Demos/json-dummy-data/512KB-min.json",
            },
        },
    },
};
*/
