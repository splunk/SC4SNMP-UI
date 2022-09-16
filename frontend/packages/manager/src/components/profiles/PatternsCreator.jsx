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

        let item_id = -1;
        const items = this.patterns.map(value => {
            item_id += 1;
            let internal_id = item_id;
            return(
                <FormRows.Row index={internal_id} key={createDOMID()} onRequestRemove={this.handleRequestRemove}>
                    <Text defaultValue={value.pattern} onChange={e => this.handleItemValue(internal_id, e)}/>
                </FormRows.Row>
            );
        });

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
        console.log(`hndling pattern index: ${index}`);
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
         console.log(`pattern: ${this.patterns[index].pattern}, index: ${index}`)
        this.setState((state) => ({
            items: FormRows.removeRow(index, state.items),
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
