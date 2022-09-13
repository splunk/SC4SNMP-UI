import React, { Component } from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import FormRows from '@splunk/react-ui/FormRows';
import Text from '@splunk/react-ui/Text';

class PatternsCreator extends Component {

    constructor(props) {
        super(props);

        this.patterns = [
            {pattern: "*.SNMP.*"}
        ]
        const items = [
            <FormRows.Row index={0} key="0" onRequestRemove={e => this.handleRequestRemove(0, e)}>
                <Text defaultValue={this.patterns[0].pattern} onChange={e => this.handleItemValue(0, e)}/>
            </FormRows.Row>
        ];

        this.state = {
            items,
        };

        props.onPatternsCreator(this.patterns);
    }

    handlePatternChange = () => {
        var patterns = this.patterns;
        this.props.onPatternsCreator(this.patterns);
    }

    handleItemValue = (index, e) => {
        this.patterns[index].pattern = e.target.value
    }

    handleRequestAdd = () => {
        this.patterns.push({pattern: ""});
        this.setState((state) => ({
            items: FormRows.addRow(
                <FormRows.Row
                    index={state.items.length}
                    key={createDOMID()}
                    onRequestRemove={this.handleRequestRemove}
                >
                    <Text onChange={e => this.handleItemValue(state.items.length, e)}/>
                </FormRows.Row>,
                state.items
            ),
        }));
    };

    handleRequestMove = ({ fromIndex, toIndex }) => {
        this.setState((state) => ({
            items: FormRows.moveRow(fromIndex, toIndex, state.items),
        }));
    };

    handleRequestRemove = (e, { index }) => {
        this.setState((state) => ({
            items: FormRows.removeRow(index, state.items),
        }));
    };

    render() {
        return (
            <FormRows
                onRequestAdd={this.handleRequestAdd}
                onRequestMove={this.handleRequestMove}
                onChange={this.handlePatternChange}
                style={{ width: 300 }}
            >
                {this.state.items}
            </FormRows>
        );
    }
}

export default PatternsCreator;
