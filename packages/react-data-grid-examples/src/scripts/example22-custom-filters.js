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
        filterValue:[{value:'abcde', label:'abcdef'}],
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
    // var testObj = [
    //   {
    //     id: 1,
    //     name: 'Ringo'
    //   },
    //   {
    //     id: 2,
    //     name: 'Paul'
    //   },
    //   {
    //     id: 3,
    //     name: 'George'
    //   },
    //   {
    //     id: 4,
    //     name: 'James'
    //   }
    // ];
    // if (!searchText)
    //   return testObj;//['Ringo', 'Paul', 'George', 'James'];
    // return ['Rango ', 'Pango', 'Gango', 'Jango'];

    //Added the below code to test how the component would behave if it needs to make an ajax call to get the options. 
    //If it need to make an ajax call, the getOptions method in the component would be expecting a promise.
    //below is the example code

    return Axios.get('https://api.github.com/users/mralexgray/repos').then(function (resp) {
      var filterValues = [];
      for (var i = 0; i < resp.data.length; i++) {
        filterValues.push(resp.data[i].full_name);
      }
      return filterValues;
    });
  }

  getValidFilterValues = (columnId) => {
    //["low4", "medium4", "high4", "low5", "medium5", "high5",  "low6", "medium6", "high6", "low7", "medium7", "high7","low8", "medium8", "high8","low9", "medium9", "high9",]
    
    
    let values = this.state.rows.map(r => r[columnId]);
    return values.filter((item, i, a) => { return i === a.indexOf(item); });
  };

  handleOnClearFilters = () => {
    this.setState({ filters: {} });
  };

  getAllColumns =(revertToDefaults) => {
    return [
      {key: 'one', name: 'One', isSelected: false},
      {key: 'two', name: 'Two', isSelected: true},
      {key: 'three', name: 'Three', isSelected: true}
      ];
  }

  updateSelectedColumns = (value) => {
    console.log(value);
  };

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
        enableHeaderScroll={false}
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this.rowsCount()}
        minHeight={500}
        toolbar={<Toolbar enableFilter={true} />}
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