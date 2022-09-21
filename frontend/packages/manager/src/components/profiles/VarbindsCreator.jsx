import React, { Component, useEffect } from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import FormRows from '@splunk/react-ui/FormRows';
import Text from '@splunk/react-ui/Text';
import P from '@splunk/react-ui/Paragraph';
import axios from "axios";

class VarbindsCreator extends Component {
    constructor(props) {
        super(props);

        if (this.props.value) {
            this.varBinds = this.props.value;
        } else {
            this.varBinds = [{family: "IF-MIB", category: "ifDescr", index: "1"}];
        }

        // 'indexes' is an object storing key:value pairs of key:index of each row from form.
        // When the row with specific 'key' is deleted, other objects with 'index' greater than
        // deleted must have their indexes updated.
        let indexes = {};

        // 'items' list stores HTML rows
        let items = [];

        // If this.reload=true all rows in 'items' list are reloaded. Must be set to true at begining to load items.
        // It is later used to reload items in order to update error messages
        this.reload = true;

        // Each time the submit button is pressed and there were some errors, 'newSubmit' value changes to the
        // opposite one (boolean value). If this.props.newSubmit is different from this.newSubmit it means,
        // that new submit has been sent, new errors arrived and 'items' must be reloaded.
        this.newSubmit = this.props.newSubmit;

        this.state = {
            items,
            indexes
        };

        this.props.onVarbindsCreator(this.varBinds);
    }

    reloadItems = () => {
        const indexes = this.state.indexes;
        let item_id = -1;
        const items = this.varBinds.map(value => {
            item_id += 1;
            let internal_id = item_id;
            let keyID = createDOMID();
            indexes[`${keyID}`] = internal_id;
            return (
                <FormRows.Row index={internal_id} key={keyID} onRequestRemove={this.handleRequestRemove}>
                    <div style={this.props.validation_group}>
                        <div style={{display: 'flex'}}>
                            <Text defaultValue={value.family}
                                  onChange={e => this.handleItemValueFamily(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                            <Text defaultValue={value.category}
                                  onChange={e => this.handleItemValueCategory(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                            <Text defaultValue={value.index}
                                  onChange={e => this.handleItemValueIndex(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                        </div>
                        {((this.props.error && indexes[`${keyID}`] in this.props.error) ?
                            this.props.error[indexes[`${keyID}`]].map((el) => <P key={createDOMID()}
                                                                                 style={this.props.validation_message}>{el}</P>) :
                            <P/>)}
                    </div>
                </FormRows.Row>
            );
        });
        this.setState((state) => ({
            items: items
        }));
    };

    handleRequestAdd = () => {
        this.reload = true;
        let indexes = this.state.indexes;
        let internal_id = this.varBinds.length;
        let keyID = createDOMID();
        indexes[`${keyID}`] = internal_id;

        this.varBinds.push({family: "", category: "", index: ""});
        this.setState((state) => ({
            items: FormRows.addRow(
                <FormRows.Row index={state.items.length} key={keyID} onRequestRemove={this.handleRequestRemove}>
                    <div style={this.props.validation_group}>
                        <div style={{display: 'flex'}}>
                            <Text onChange={e => this.handleItemValueFamily(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                            <Text onChange={e => this.handleItemValueCategory(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                            <Text onChange={e => this.handleItemValueIndex(indexes[`${keyID}`], e)}
                                  error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                        </div>
                        {((this.props.error && indexes[`${keyID}`] in this.props.error) ?
                            this.props.error[indexes[`${keyID}`]].map((el) => <P key={createDOMID()}
                                                                                 style={this.props.validation_message}>{el}</P>) :
                            <P/>)}
                    </div>
                </FormRows.Row>,
                state.items
            ),
            indexes: indexes
        }), () => {this.handleVarbindsChange();});
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

    handleRequestMove = ({fromIndex, toIndex}) => {
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

    handleRequestRemove = (e, {index}) => {
        this.reload = true;

        // Update indexes after deleting an element
        let indexes = this.state.indexes;
        let keyToDelete;
        for (const keyID in indexes){
            if (indexes[`${keyID}`] > index){indexes[`${keyID}`] -= 1;}
            if (indexes[`${keyID}`] == indexes){keyToDelete = keyID;}
        }
        delete indexes[`${keyToDelete}`];

        // Update errors indexes after deleting an element
        let error = this.props.error;
        if (error){
            const errrorKeys = Object.keys(error);
            for (const errorID of errrorKeys){
                if (Number(errorID) === index){delete error[Number(errorID)];}
                if (Number(errorID) > index) {
                    error[Number(errorID)-1] = error[Number(errorID)];
                    delete error[Number(errorID)]
                }
            }
            this.props.setError(error);
        }

        this.setState((state) => ({
            items: FormRows.removeRow(index, state.items),
            indexes: indexes,
        }));
        this.varBinds.splice(index, 1);
        this.props.onVarbindsCreator(this.varBinds);
    };

    componentDidUpdate(){
        if(this.reload){
            this.reload = false;
            this.reloadItems();
        }
    }

    componentDidMount(){
        if(this.reload){
            this.reload = false;
            this.reloadItems();
        }
    }
    render() {
        if (this.props.newSubmit != this.newSubmit){
            this.newSubmit = this.props.newSubmit;
            this.reload = true;
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
