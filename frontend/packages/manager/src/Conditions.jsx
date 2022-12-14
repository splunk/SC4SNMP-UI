import React, {Component} from 'react';
import Select from '@splunk/react-ui/Select';
import ControlGroup from "@splunk/react-ui/ControlGroup";
import Text from "@splunk/react-ui/Text";
import PatternsCreator from "./PatternsCreator";

class Conditions extends Component {
    constructor(props) {
        super(props);

        this.state = {
            condition: 'base',
            field: '',
            patterns: null
        };
    }

    handleChange = (e, {value}) => {
        this.setState({condition: value});
    };

    handleFieldChange = (e, {value}) => {
        this.setState({field: value});
    };

    handlePatterns = (value) => {
        this.setState({patterns: value});
    }

    handleConditionChange = (value) => {
        var state = this.state;
        this.props.onConditionsCreator(state);
    }

    render() {
        return (
            <div onChange={this.handleConditionChange}>
                <ControlGroup label="Condition"
                    labelFor="customized-select-after">
                <Select value={this.state.condition} onChange={this.handleChange} filter>
                    <Select.Option label="base" value="base"/>
                    <Select.Option label="field" value="field"/>
                    <Select.Option label="walk" value="walk"/>
                </Select>
                </ControlGroup>
                {this.state.condition === 'field' ? (
                <div>
                    <ControlGroup label="field">
                        <Text value={this.state.field} onChange={this.handleFieldChange}/>
                    </ControlGroup>
                    <ControlGroup label="patterns">
                        <PatternsCreator onPatternsCreator={this.handlePatterns}/>
                    </ControlGroup>
                </div>
                ) : <div/>}
            </div>)
    }
}

export default Conditions;
