import {queryHelpers, buildQueries} from '@testing-library/react';

const queryAllByDataTest = (...args) => queryHelpers.queryAllByAttribute('data-test', ...args);
const [getByDataTest, getAllByDataTest] = buildQueries(queryAllByDataTest);
export {getByDataTest, getAllByDataTest};
