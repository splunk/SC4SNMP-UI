import {render, queries, within} from '@testing-library/react';
import * as customQueries from './custom-queries';

const allQueries = {
   ...queries,
   ...customQueries,
};

const customScreen = within(document.body, allQueries);
const customWithin = (element) => within(element, allQueries);
const customRender = (ui, options) => render(ui, {queries: allQueries, ...options});


// re-export everything
// eslint-disable-next-line import/export -- render/screen/within are intentionally overridden below
export * from '@testing-library/react';


// override render method
// eslint-disable-next-line import/export -- intentional override of the wildcard export above
export {customScreen as screen, customWithin as within, customRender as render};
