import React from 'react';
import PropTypes from 'prop-types';
import { asyncContainer, Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import './TypeAheadFilterStyles.css';
import { utils, shapes } from 'react-data-grid';
const { isEmptyArray } = utils;
const { ExcelColumn } = shapes;
const AsyncTypeahead = asyncContainer(Typeahead);

class TypeAheadFilter extends React.Component {
    constructor(props) {
        super(props);
        this.getOptions = this.getOptions.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.filterValues = this.filterValues.bind(this);
        this.columnValueContainsSearchTerms = this.columnValueContainsSearchTerms.bind(this);
        let defaultFilters = props.column ? props.column.filterValue : []
        this.state = { options:[], rawValue: '', placeholder: 'Begin typing and select from list', filters: defaultFilters };
        this.getOptions();
    }

    componentWillReceiveProps(newProps) {
        this.getOptions();
        let defaultFilters = newProps.column ? newProps.column.filterValue : [];
        this.setState({ filters  : newProps.column.filterValue });
    }

    //Check the params as it doesn't filter
    columnValueContainsSearchTerms(columnValue, filterTermValue) {
        if (columnValue !== undefined && filterTermValue !== undefined) {
            let strColumnValue = columnValue.toString();
            let strFilterTermValue = filterTermValue.toString();
            let checkValueIndex = strColumnValue.trim().toLowerCase().indexOf(strFilterTermValue.trim().toLowerCase());
            return checkValueIndex !== -1 && (checkValueIndex !== 0 || strColumnValue === strFilterTermValue);
        }
        return false;
    }

   //Check the params as it doesn't filter
    filterValues(row, columnFilter, columnKey) {
        let include = true;
        if (columnFilter === null) {
            include = false;
        } else if (columnFilter.filterTerm && !isEmptyArray(columnFilter.filterTerm)) {
            if (columnFilter.filterTerm.length) {
                include = columnFilter.filterTerm.some(filterTerm => {
                    return this.columnValueContainsSearchTerms(row[columnKey], filterTerm.value) === true;
                });
            } else {
                include = this.columnValueContainsSearchTerms(row[columnKey], columnFilter.filterTerm.value);
            }
        }
        return include;
    }

    getOptions(searchText, event, newProps) {
        // let props = newProps || this.props;
        // let options = props.getValidFilterValuesForTypeAhead(this.props.column.key, searchText);;
        // options = options.map(o => {
        //     if (typeof o.name === 'string' || typeof o === 'string') {
        //         var returnObj = {
        //             value: '',
        //             label: ''
        //         }
        //         if (o.name) {
        //             returnObj.value = o.name;
        //             returnObj.label = o.name;
        //             if (o.id)
        //                 returnObj.id = o.id;
        //         }else{
        //             returnObj.value = returnObj.label = o;
        //         }
        //         return returnObj;
        //     }
        //     return o;
        // });
        // this.setState({ options });
        // return options;

        //Below is the code to handle Ajax calls being made by the consumer and the component would expect a promise to be returned by the consumer. 
        var parentScope = this;
        this.props.getValidFilterValuesForTypeAhead(this.props.column, searchText).then(function (val) {
            parentScope.setState({ options: val });
    });
}

    handleChange(value) {
        let filters = value;
        this.setState({ filters });
        this.props.onChange({ filterTerm: filters, column: this.props.column, rawValue: value, filterValues: this.filterValues });
        return false;
    }

    onOptionSelected(){
        console.log(this);
        var elements = document.getElementsByClassName("rbt-token rbt-token-removeable rbt-token-active");
        setTimeout(function(){
            _.each(elements, function(elmt){
                if(elmt.parentElement){
                elmt.parentElement.parentElement.focus();
                }
            });
        },500);
    }

    render() {
        return (
            <Typeahead
                ref={grid => (this.grid = grid)}
                clearButton
                multiple
                name={`filter-${this.props.column.key}`}
                onInputChange={this.getOptions}
                selected = {this.state.filters}
                onChange={this.handleChange}
                options={this.state.options}
                placeholder={this.state.placeholder}
            />
        );
    }
}

TypeAheadFilter.propTypes = {
    onChange: PropTypes.func.isRequired,
    column: PropTypes.shape(ExcelColumn),
    getValidFilterValuesForTypeAhead: PropTypes.func,
    multiSelection: PropTypes.bool
};

export default TypeAheadFilter;