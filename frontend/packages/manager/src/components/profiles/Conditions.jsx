import React, {Component} from 'react';
import Select from '@splunk/react-ui/Select';
import ControlGroup from "@splunk/react-ui/ControlGroup";
import Text from "@splunk/react-ui/Text";
import PatternsCreator from "./PatternsCreator";
import P from '@splunk/react-ui/Paragraph';
import { createDOMID } from '@splunk/ui-utils/id';

class Conditions extends Component {
    constructor(props) {
        super(props);
        let stateValue;
        if(this.props.value){
            stateValue = this.props.value;
        }else{
            stateValue = {
                condition: 'None',
                field: '',
                patterns: null
            };
        }
        this.state = stateValue;
        this.props.onConditionsCreator(this.state);
    }

    handleChange = (e, {value}) => {
        if (value != "field"){
            this.setState({condition: value, field: '', patterns :null},
                () => {this.props.onConditionsCreator(this.state);});
        }else{
           this.setState({condition: value}, () => {this.props.onConditionsCreator(this.state);});
        };
    };

    handleFieldChange = (e, {value}) => {
        this.setState({field: value}, () => {this.props.onConditionsCreator(this.state);});
    };

    handlePatterns = (value) => {
        this.setState({patterns: value}, () => {this.props.onConditionsCreator(this.state);});
    }

    render() {
        return (
            <div>
                <ControlGroup label="Condition"
                    labelFor="customized-select-after">
                <Select value={this.state.condition} onChange={this.handleChange} filter>
                    <Select.Option label="None" value="None"/>
                    <Select.Option label="base" value="base"/>
                    <Select.Option label="field" value="field"/>
                    <Select.Option label="walk" value="walk"/>
                </Select>
                </ControlGroup>
                {this.state.condition === 'field' ? (
                <div>
                    <ControlGroup label="field">
                        <div className={this.props.validationGroup}>
                            <Text value={this.state.field} onChange={this.handleFieldChange} error={((this.props.errorField) ? true : false)}/>
                            {((this.props.errorField) ? this.props.errorField.map((el) =>
                                <P key={createDOMID()} style={this.props.validationMessage}>{el}</P>) : <P/>)}
                        </div>
                    </ControlGroup>
                    <ControlGroup label="patterns">
                        <PatternsCreator onPatternsCreator={this.handlePatterns} value={this.state.patterns} newSubmit={this.props.newSubmit}
                                         error={this.props.errorPatterns} setError={this.props.setErrorPatterns}
                        validationGroup={this.props.validationGroup} validationMessage={this.props.validationMessage}/>
                    </ControlGroup>
                </div>
                ) : <div/>}
            </div>)
    }
}

export default Conditions;
