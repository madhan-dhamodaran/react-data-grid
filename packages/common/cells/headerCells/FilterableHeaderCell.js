import React from 'react';
import Column from 'common/prop-shapes/Column';
import PropTypes from 'prop-types';

class FilterableHeaderCell extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    filterTerm: PropTypes.string
  };

  constructor(props){
    super(props)
    this.state={filterTerm: this.props.filterTerm}
  };

  state = { filterTerm: '' };

  handleChange = (e) => {
    const val = e.target.value;
    this.setState({ filterTerm: val });
    this.props.onChange({ filterTerm: val, column: this.props.column });
  };

  renderInput = () => {
    if (this.props.column.filterable === false) {
      return <span/>;
    }

    const inputKey = 'header-filter-' + this.props.column.key;
    return (<input key={inputKey} type="text" className="form-control input-sm" placeholder="Search" value={this.state.filterTerm} onChange={this.handleChange}/>);
  };

  render() {
    return (
      <div>
        <div className="form-group">
          {this.renderInput()}
        </div>
      </div>
    );
  }
}

module.exports = FilterableHeaderCell;
