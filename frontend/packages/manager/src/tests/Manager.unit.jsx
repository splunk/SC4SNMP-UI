// /* eslint-env jest */
//
// import React from 'react';
// import { assert } from 'chai';
// import Enzyme, { mount } from 'enzyme';
// import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';
// //import Manager from '../Manager';
// import Menu from "../components/menu_header/Menu";
//
// // This sets up the enzyme adapter
// const adapter = new EnzymeAdapterReact16();
// Enzyme.configure({ adapter });
//
// describe('Manager', () => {
//     it('renders with default name', () => {
//         const wrapper = mount(<Menu />);
//         assert.include(wrapper.text(), 'Hello, User!');
//         wrapper.unmount();
//     });
//
//     it('renders with custom name', () => {
//         const wrapper = mount(<Manager name="World" />);
//         assert.include(wrapper.text(), 'Hello, World!');
//         wrapper.unmount();
//     });
//
//     it('increases the counter when button is clicked', () => {
//         const wrapper = mount(<Manager name="World" />);
//         assert.equal(wrapper.state('counter'), 0);
//         wrapper.find('button').simulate('click');
//         assert.equal(wrapper.state('counter'), 1);
//         wrapper.unmount();
//     });
// });
