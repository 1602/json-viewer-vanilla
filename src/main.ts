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
  jv.addEventListener('json-viewer:expandedChange', ({ detail }: any) => {
      expandedNodes.textContent = JSON.stringify(detail.expanded, null, '  ');
  });
  app.appendChild(jv);
  app.appendChild(expandedNodes);

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
}
