import React, { Component } from 'react';
import PropTypes from 'prop-types';

class DropdownTrigger extends Component {
  render () {
    const { children, className, ...dropdownTriggerProps } = this.props;
    dropdownTriggerProps.className = `dropdown__trigger ${className}`;

    return (
      <a {...dropdownTriggerProps}>
        {children}
      </a>
    );
  }
}

DropdownTrigger.displayName = 'DropdownTrigger';

DropdownTrigger.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

DropdownTrigger.defaultProps = {
  className: ''
};

export default DropdownTrigger;
