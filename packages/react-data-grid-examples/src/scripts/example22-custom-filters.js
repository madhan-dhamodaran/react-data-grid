const ReactDataGrid = require('react-data-grid');
const exampleWrapper = require('../components/exampleWrapper');
const React = require('react');
const Axios = require('axios');
const { Toolbar, Filters: { NumericFilter, AutoCompleteFilter, MultiSelectFilter, SingleSelectFilter, TypeAheadFilter }, Data: { Selectors } } = require('react-data-grid-addons');
class Example extends React.Component {
  constructor(props, context) {
    super(props, context);
    this._columns = [
      {
        key: 'id',
        name: 'ID',
        width: 120,
        filterable: true,
        filterRenderer: NumericFilter
      },
      {
        key: 'task',
        name: 'Title',
        filterable: true
      },
      {
        key: 'priority',
        name: 'Priority',
        filterable: true,
        filterRenderer: MultiSelectFilter
      },
      {
        key: 'issueType',
        name: 'Issue Type',
        filterable: true,
        filterRenderer: SingleSelectFilter
      },
      {
        key: 'developer',
        name: 'Developer',
        filterable: true,
        filterRenderer: AutoCompleteFilter
      },
      {
        key: 'typeAheadTest',
        name: 'TypeAhead Test',
        filterable: true,
        sortable: true,
        filterRenderer: TypeAheadFilter,
        //filterValue:[{value:'abcde', label:'abcdef'}],
        width: 250
      },
      {
        key: 'complete',
        name: '% Complete',
        filterable: true,
        filterRenderer: NumericFilter
      },
      {
        key: 'startDate',
        name: 'Start Date',
        filterable: true
      },
      {
        key: 'completeDate',
        name: 'Expected Complete',
        filterable: true
      }
    ];

    this.state = { rows: this.createRows(1000), filters: {}, filterValues: [] };
  }

  getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toLocaleDateString();
  };

  createRows = (numberOfRows) => {
    let rows = [];
    for (let i = 1; i < numberOfRows; i++) {
      rows.push({
        id: i,
        task: 'Task ' + i,
        complete: Math.min(100, Math.round(Math.random() * 110)),
        priority: ['Critical', 'High', 'Medium', 'Low'][Math.floor((Math.random() * 3) + 1)],
        issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.floor((Math.random() * 3) + 1)],
        developer: ['James', 'Tim', 'Daniel', 'Alan'][Math.floor((Math.random() * 3) + 1)],
        typeAheadTest: ['mralexgray/-REPONAME', 'mralexgray/...', 'mralexgray/2200087-Serial-Protocol', 'mralexgray/ace'][Math.floor(Math.random() * 3 + 1)],
        startDate: this.getRandomDate(new Date(2015, 3, 1), new Date()),
        completeDate: this.getRandomDate(new Date(), new Date(2016, 0, 1))
      });
    }
    return rows;
  };

  rowGetter = (index) => {
    return Selectors.getRows(this.state)[index];
  };

  rowsCount = () => {
    return Selectors.getRows(this.state).length;
  };

  handleFilterChange = (filter) => {
    let newFilters = Object.assign({}, this.state.filters);
    if (filter.filterTerm) {
      newFilters[filter.column.key] = filter;
    } else {
      delete newFilters[filter.column.key];
    }
    this.setState({ filters: newFilters });
  };

  getValidFilterValuesForTypeAhead = (columnId, searchText) => {
    return Axios.get('https://api.github.com/users/mralexgray/repos').then(function (resp) {
    var filterValues = [];
      for (var i = 0; i < resp.data.length; i++) {
        var value = {
          id:i,
          value: resp.data[i].full_name,
          label: resp.data[i].full_name
        };
        filterValues.push(value);
      }
      return filterValues;
    });
  }

  getValidFilterValues = (columnId) => {
    let values = this.state.rows.map(r => r[columnId]);
    return values.filter((item, i, a) => { return i === a.indexOf(item); });
  };

  handleOnClearFilters = () => {
    this.setState({ filters: {} });
  };
  
  getOptionsTemplate = (option,column) => {
    return (
      <div style={{ padding: "2px" }}>    
          <strong>{option.label}</strong> <br />
          {option.value}
      </div>
    );
  }

  getOptionsValue = option => {
    return option.value;
  }

  getTotalNoOfRecords = () => {
    return this.rowsCount();
  }

  handleGridSort = (sortColumn, sortDirection) => {
    this.setState({ sortColumn: sortColumn, sortDirection: sortDirection });
  };

  render() {
    return (
      <div>
        
      <ReactDataGrid
        onGridSort={this.handleGridSort}
        enableCellSelect={true}
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this.rowsCount()}
        useTemplatingForTypeaheadFilter={true}
        getOptionsTemplateForFilter={this.getOptionsTemplate}
        getOptionValueForFilter={this.getOptionsValue}
        isMultiSelection = {true}
        minHeight={500}
        isTypeaheadFilterClearable={true}
        toolbar={<Toolbar totalRecords={this.getTotalNoOfRecords} enableFilter={true} displayTotalNoOfRecords={false}  />}
        onAddFilter={this.handleFilterChange}
        getValidFilterValues={this.getValidFilterValues}
        getValidFilterValuesForTypeAhead={this.getValidFilterValuesForTypeAhead}
        onClearFilters={this.handleOnClearFilters} />
        </div>);
        
  }
}

const exampleDescription = (
  <p>Using the same approach as regular Filters setting <code>column.filterable = true</code>, Custom Filters can be implemented and applied as below. Add the attribute <code>code.filterRenderer = NumberFilterableHeaderCell</code> to the column object will
  allow having a Numeric Filter.</p>
);

module.exports = exampleWrapper({
  WrappedComponent: Example,
  exampleName: 'Custom Filters Example',
  exampleDescription,
  examplePath: './scripts/example22-custom-filters.js',
  examplePlaygroundLink: undefined
});