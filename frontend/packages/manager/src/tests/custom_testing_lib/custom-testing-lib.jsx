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
export * from '@testing-library/react';


// override render method
export {customScreen as screen, customWithin as within, customRender as render};
