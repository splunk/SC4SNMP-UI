import React, { Component } from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import FormRows from '@splunk/react-ui/FormRows';
import Text from '@splunk/react-ui/Text';

class VarbindsCreator extends Component {
    constructor(props) {
        super(props);
        this.varBinds = [{family: "IF-MIB", category: "ifDescr", index: "1"}]
        const items = [
            <FormRows.Row index={0} key="0" onRequestRemove={this.handleRequestRemove}>
                <div style={{ display: 'flex' }}>
                <Text defaultValue={this.varBinds[0].family} onChange={e => this.handleItemValueFamily(0, e)}/>
                <Text defaultValue={this.varBinds[0].category} onChange={e => this.handleItemValueCategory(0, e)}/>
                <Text defaultValue={this.varBinds[0].index} onChange={e => this.handleItemValueIndex(0, e)}/>
                </div>
            </FormRows.Row>
        ];

        this.state = {
            items,
        };

        this.props.onVarbindsCreator(this.varBinds);
    }

    handleItemValueFamily = (index, e) => {
        this.varBinds[index].family = e.target.value
    }

    handleItemValueCategory = (index, e) => {
        this.varBinds[index].category = e.target.value
    }

    handleItemValueIndex = (index, e) => {
        this.varBinds[index].index = e.target.value
    }
    handleRequestAdd = () => {
        this.varBinds.push({family: "", category: "", index: ""});
        this.setState((state) => ({
            items: FormRows.addRow(
                <FormRows.Row
                    index={state.items.length}
                    key={createDOMID()}
                    onRequestRemove={this.handleRequestRemove}
                >
                    <div style={{ display: 'flex' }}>
                <Text onChange={e => this.handleItemValueFamily(state.items.length, e)}/>
                <Text onChange={e => this.handleItemValueCategory(state.items.length, e)}/>
                <Text onChange={e => this.handleItemValueIndex(state.items.length, e)}/>
                    </div>
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

    handleVarbindsChange = () => {
        var varBinds = this.varBinds;
        this.props.onVarbindsCreator(varBinds);
    }

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
                onChange={this.handleVarbindsChange}
                style={{ width: 300 }}
            >
                {this.state.items}
            </FormRows>
        );
    }
}

export default VarbindsCreator;
