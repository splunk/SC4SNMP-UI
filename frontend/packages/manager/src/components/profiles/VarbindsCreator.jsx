import React, { Component } from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import FormRows from '@splunk/react-ui/FormRows';
import Text from '@splunk/react-ui/Text';

class VarbindsCreator extends Component {
    constructor(props) {
        super(props);

        if(this.props.value){
            this.varBinds = this.props.value;
        }else{
            this.varBinds = [{family: "IF-MIB", category: "ifDescr", index: "1"}];
        }

        let item_id = -1;
        const items = this.varBinds.map(value => {
            item_id +=1;
            let internal_id = item_id;
            return (
            <FormRows.Row index={internal_id} key={ createDOMID() } onRequestRemove={this.handleRequestRemove}>
                <div style={{ display: 'flex' }}>
                <Text defaultValue={value.family} onChange={e => this.handleItemValueFamily(internal_id, e)}/>
                <Text defaultValue={value.category} onChange={e => this.handleItemValueCategory(internal_id, e)}/>
                <Text defaultValue={value.index} onChange={e => this.handleItemValueIndex(internal_id, e)}/>
                </div>
            </FormRows.Row>
        );});

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
        this.varBinds.splice(index, 1)
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
