import React, { Component } from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import FormRows from '@splunk/react-ui/FormRows';
import Text from '@splunk/react-ui/Text';

class PatternsCreator extends Component {

    constructor(props) {
        super(props);

        if(this.props.value){
            this.patterns = this.props.value
        }else{
            this.patterns = [
                {pattern: ".*SNMP.*"}
            ]
        }

        let indexes = {};
        let item_id = -1;
        const items = this.patterns.map(value => {
            item_id += 1;
            let internal_id = item_id;
            let keyID = createDOMID();
            indexes[`${keyID}`] = internal_id;
            return(
                <FormRows.Row index={internal_id} key={keyID} onRequestRemove={this.handleRequestRemove}>
                    <Text defaultValue={value.pattern} onChange={e => this.handleItemValue(indexes[`${keyID}`], e)}/>
                </FormRows.Row>
            );
        });

        this.state = {
            items,
            indexes
        };

        props.onPatternsCreator(this.patterns);
    }

    handlePatternChange = () => {
        var patterns = this.patterns;
        this.props.onPatternsCreator(this.patterns);
    }

    handleItemValue = (index, e) => {
        console.log(`hndling pattern index: ${index}`);
        this.patterns[index].pattern = e.target.value
    }

    handleRequestAdd = () => {
        let indexes = this.state.indexes;
        let internal_id = this.patterns.length;
        let keyID = createDOMID();
        indexes[`${keyID}`] = internal_id;
        this.patterns.push({pattern: ""});
        this.setState((state) => ({
            items: FormRows.addRow(
                <FormRows.Row
                    index={state.items.length}
                    key={keyID}
                    onRequestRemove={this.handleRequestRemove}
                >
                    <Text onChange={e => this.handleItemValue(indexes[`${keyID}`], e)}/>
                </FormRows.Row>,
                state.items
            ),
            indexes: indexes
        }));
    };

    handleRequestMove = ({ fromIndex, toIndex }) => {
        this.setState((state) => ({
            items: FormRows.moveRow(fromIndex, toIndex, state.items),
        }));
    };

    handleRequestRemove = (e, { index }) => {
        let indexes = this.state.indexes;
        let keyToDelete;
        for (const keyID in indexes){
            if (indexes[`${keyID}`] > index){
                indexes[`${keyID}`] -= 1;
            }
            if (indexes[`${keyID}`] == indexes){
                keyToDelete = keyID;
            }
        }
        delete indexes[`${keyToDelete}`];
        this.setState((state) => ({
            items: FormRows.removeRow(index, state.items),
            indexes: indexes
        }));
        this.patterns.splice(index, 1);
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
