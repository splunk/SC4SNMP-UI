import React, { Component, useEffect } from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import FormRows from '@splunk/react-ui/FormRows';
import Text from '@splunk/react-ui/Text';
import P from '@splunk/react-ui/Paragraph';
import axios from "axios";

class VarbindsCreator extends Component {
    constructor(props) {
        super(props);

        if(this.props.value){
            this.varBinds = this.props.value;
        }else{
            this.varBinds = [{family: "IF-MIB", category: "ifDescr", index: "1"}];
        }

        let indexes = {};
        const items = [];
        this.reload = true;

        this.state = {
            items,
            indexes
        };

        this.reloadItems();
        this.props.onVarbindsCreator(this.varBinds);
    }

    reloadItems = () => {
        const indexes = this.state.indexes;
        let item_id = -1;
        const items = this.varBinds.map(value => {
            item_id +=1;
            let internal_id = item_id;
            let keyID = createDOMID();
            indexes[`${keyID}`] = internal_id;
            return (
            <FormRows.Row index={ internal_id } key={ keyID } onRequestRemove={this.handleRequestRemove}>
                <div style={this.props.validation_group}>
                    <div style={{ display: 'flex' }}>
                        <Text defaultValue={value.family} onChange={e => this.handleItemValueFamily(indexes[`${keyID}`], e)}
                              error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                        <Text defaultValue={value.category} onChange={e => this.handleItemValueCategory(indexes[`${keyID}`], e)}
                              error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                        <Text defaultValue={value.index} onChange={e => this.handleItemValueIndex(indexes[`${keyID}`], e)}
                              error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                    </div>
                    {((this.props.error && indexes[`${keyID}`] in this.props.error) ?
                        this.props.error[indexes[`${keyID}`]].map((el) => <P key={createDOMID()} style={this.props.validation_message}>{el}</P>) : <P/>)}
                </div>
            </FormRows.Row>
        );});
        const formRowsKey = createDOMID();
        this.setState((state) => ({
            items: items
        }));
    };

    handleRequestAdd = () => {
        this.reload = true;
        console.log("Adding new element", this.reload);
        let indexes = this.state.indexes;
        let internal_id = this.varBinds.length;
        let keyID = createDOMID();
        indexes[`${keyID}`] = internal_id;

        this.varBinds.push({family: "", category: "", index: ""});
        this.setState((state) => ({
            items: FormRows.addRow(
                <FormRows.Row index={state.items.length} key={keyID} onRequestRemove={this.handleRequestRemove}>
                    <div style={this.props.validation_group}>
                        <div style={{ display: 'flex' }}>
                            <Text onChange={e => this.handleItemValueFamily(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                            <Text onChange={e => this.handleItemValueCategory(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                            <Text onChange={e => this.handleItemValueIndex(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                        </div>
                        {((this.props.error && indexes[`${keyID}`] in this.props.error) ?
                            this.props.error[indexes[`${keyID}`]].map((el) => <P key={createDOMID()} style={this.props.validation_message}>{el}</P>) : <P/>)}
                    </div>
                </FormRows.Row>,
                state.items
            ),
            indexes: indexes
        }));
    };

    handleItemValueFamily = (index, e) => {
        this.varBinds[index].family = e.target.value
    }

    handleItemValueCategory = (index, e) => {
        this.varBinds[index].category = e.target.value
    }

    handleItemValueIndex = (index, e) => {
        this.varBinds[index].index = e.target.value
    }

    handleRequestMove = ({ fromIndex, toIndex }) => {
        this.reload = true;
        this.setState((state) => ({
            items: FormRows.moveRow(fromIndex, toIndex, state.items),
        }));
    };

    handleVarbindsChange = () => {
        this.reload = true;
        var varBinds = this.varBinds;
        this.props.onVarbindsCreator(varBinds);
    }

    handleRequestRemove = (e, { index }) => {
        this.reload = true;
        let indexes = this.state.indexes;
        let keyToDelete;
        for (const keyID in indexes){
            if (indexes[`${keyID}`] > index){indexes[`${keyID}`] -= 1;}
            if (indexes[`${keyID}`] == indexes){keyToDelete = keyID;}
        }
        delete indexes[`${keyToDelete}`];

        let error = this.props.error;
        if (error){
            for (const errorID in error){
                if (errorID > index) {error[errorID] -= 1;}
            }
            delete error[index];
            this.props.setError(error);
        }

        this.setState((state) => ({
            items: FormRows.removeRow(index, state.items),
            indexes: indexes,
        }));
        this.varBinds.splice(index, 1);
    };


    render() {
        console.log("reloading", this.reload)
        if(this.reload){
            this.reload = false;
            this.reloadItems();
        }
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
