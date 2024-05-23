import './style.css'
// import { jsonViewer } from './json-viewer.ts'
import './index.js';
import { JsonViewerWebComponent } from './web-component.js';
import { ce } from './dom.js';

const app = document.querySelector<HTMLDivElement>('#app');

const json = `
{ "demo":
    { "types":
        { "boolean": [true, false]
        , "number": [0, 1, 3.14]
        , "string": ["hello world", "👻"]
        , "null": null
        , "array": [1, 2]
        , "object": { "foo": "bar" }
        }
    , "longArray":
        [ 0
        , 1
        , 2
        , 3
        , 4
        , 5
        , 6
        , 7
        , 8
        , 9
        , 10
        , 11
        , 12
        ]
    }
}
`;

if (app) {
    const jv = ce('json-viewer', { value: json, expanded: '{"": true, "/demo": true}' }) as JsonViewerWebComponent;
    const expandedNodes = ce('pre');
    jv.addEventListener('json-viewer:expanded-change', ({ detail }: any) => {
        expandedNodes.textContent = JSON.stringify(detail.expanded, null, '  ');
    });
    app.appendChild(jv);
    app.appendChild(expandedNodes);
    app.appendChild(ce('json-viewer'));

    let expand = true;
    const expandAllButton = ce('button');
    expandAllButton.addEventListener('click', () => {
        const expanded: {[key: string]: boolean} = {};
        walk(JSON.parse(json), '');
        jv.expanded = expanded;

        expand = !expand;
        expandAllButton.textContent = expand ? 'Expand all' : 'Collapse all';

        function walk(node: any, path: string = '') {
            if (typeof node === 'object' && node !== null) {
                expanded[path] = expand;
                Object.keys(node).forEach((key) => walk(node[key], path + '/' + key));
            }
        }
    });

    expandAllButton.textContent = 'Expand all';
    app.before(ce('div', {style: 'padding: 10px'}, [expandAllButton]), jv);

    // const data = JSON.parse(json);
    // setInterval(() => {
    //     data.demo.longArray[0] = Math.floor(Math.random() * 10);
    //     // data.demo.longArray.push(Math.floor(Math.random() * 10));
    //     jv.value = JSON.stringify(data);
    // }, 5000);
    //
    const urls = ['https://json-schema.org/draft/2020-12/schema', 'https://protocol.automationcloud.net/schema.json', 'https://microsoftedge.github.io/Demos/json-dummy-data/512KB-min.json', 'https://microsoftedge.github.io/Demos/json-dummy-data/5MB-min.json'];

    (async () => {
        for (let url of urls) {
            await loadUrl(url);
        }
    })();

    document.body.appendChild(jv);

    async function loadUrl(url: string) {
        const data = await (await fetch(url)).json();
        const jv = document.createElement('json-viewer');
        jv.setAttribute('value', JSON.stringify(data));
        document.body.appendChild(jv);
    }
}
