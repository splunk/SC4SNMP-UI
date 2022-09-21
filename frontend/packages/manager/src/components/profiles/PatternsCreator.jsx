import React, { Component } from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import FormRows from '@splunk/react-ui/FormRows';
import Text from '@splunk/react-ui/Text';
import P from '@splunk/react-ui/Paragraph';

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

        // 'indexes', 'items', 'reload', 'newSubmit' have the same use as in VarbindsCreator.jsx
        let indexes = {};
        let items = [];
        this.reload = true;
        this.newSubmit = this.props.newSubmit;

        this.state = {
            items,
            indexes
        };

        props.onPatternsCreator(this.patterns);
    }

    reloadItems = () => {
        const indexes = this.state.indexes;
        let item_id = -1;
        const items = this.patterns.map(value => {
            item_id += 1;
            let internal_id = item_id;
            let keyID = createDOMID();
            indexes[`${keyID}`] = internal_id;
            return(
                <FormRows.Row index={internal_id} key={keyID} onRequestRemove={this.handleRequestRemove}>
                    <div style={this.props.validation_group}>
                        <Text defaultValue={value.pattern} onChange={e => this.handleItemValue(indexes[`${keyID}`], e)}
                        error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                        {((this.props.error && indexes[`${keyID}`] in this.props.error) ?
                            this.props.error[indexes[`${keyID}`]].map((el) =>
                                <P key={createDOMID()} style={this.props.validation_message}>{el}</P>) : <P/>)}
                    </div>
                </FormRows.Row>
            );
        });
        this.setState({
            items: items
        });
    };

    handlePatternChange = () => {
        let patterns = this.patterns;
        this.props.onPatternsCreator(this.patterns);
    }

    handleItemValue = (index, e) => {
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
                <FormRows.Row index={internal_id} key={keyID} onRequestRemove={this.handleRequestRemove}>
                    <div style={this.props.validation_group}>
                        <Text defaultValue={""} onChange={e => this.handleItemValue(indexes[`${keyID}`], e)}
                        error={((this.props.error && indexes[`${keyID}`] in this.props.error) ? true : false)}/>
                        {((this.props.error && indexes[`${keyID}`] in this.props.error) ?
                            this.props.error[indexes[`${keyID}`]].map((el) =>
                                <P key={createDOMID()} style={this.props.validation_message}>{el}</P>) : <P/>)}
                    </div>
                </FormRows.Row>,
                state.items
            ),
            indexes: indexes
        }));
        this.props.onPatternsCreator(this.patterns);
    };

    handleRequestMove = ({ fromIndex, toIndex }) => {
        this.reload = true;
        this.setState((state) => ({
            items: FormRows.moveRow(fromIndex, toIndex, state.items),
        }));
    };

    handleRequestRemove = (e, { index }) => {
        this.reload = true;

        // Update indexes after deleting an element
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
            indexes: indexes
        }));
        this.patterns.splice(index, 1);
        this.props.onPatternsCreator(this.patterns);
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
                onChange={this.handlePatternChange}
                style={{ width: 300 }}
            >
                {this.state.items}
            </FormRows>
        );
    }
}

export default PatternsCreator;
