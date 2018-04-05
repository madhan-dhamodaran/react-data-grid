import React from 'react';
import PropTypes from 'prop-types';

import SelectionMask from './SelectionMask';
import EditorContainer from '../editors/EditorContainer';
import { isKeyPrintable, isCtrlKeyHeldDown } from '../utils/keyboardUtils';
import {
  getSelectedDimensions,
  getSelectedCellValue,
  getSelectedRowIndex,
  getSelectedRow,
  getSelectedColumn,
  isSelectedCellEditable
} from '../utils/SelectedCellUtils';
import isFunction from '../utils/isFunction';
import * as AppConstants from '../AppConstants';
import * as keyCodes from '../KeyCodes';

const SCROLL_CELL_BUFFER = 2;

class InteractionMasks extends React.Component {
  static propTypes = {
    colVisibleStart: PropTypes.number,
    colVisibleEnd: PropTypes.number,
    visibleStart: PropTypes.number,
    visibleEnd: PropTypes.number,
    columns: PropTypes.array,
    selectedPosition: PropTypes.object,
    rowHeight: PropTypes.number,
    toggleCellEdit: PropTypes.func,
    selectCell: PropTypes.func,
    onHitBottomBoundary: PropTypes.func,
    onHitTopBoundary: PropTypes.func,
    onHitRightBoundary: PropTypes.func,
    onHitLeftBoundary: PropTypes.func,
    onCommit: PropTypes.func,
    onCommitCancel: PropTypes.func,
    isEditorEnabled: PropTypes.bool,
    firstEditorKeyPress: PropTypes.number,
    rowGetter: PropTypes.func,
    enableCellSelect: PropTypes.bool.isRequired,
    onCheckCellIsEditable: PropTypes.func,
    onCellCopyPaste: PropTypes.func,
    onGridRowsUpdated: PropTypes.func.isRequired
  };

  state = {
    lockedPosition: null,
    copied: null
  };

  componentDidUpdate(nextProps) {
    if (this.props.selectedPosition !== nextProps.selectedPosition) {
      this.focus();
    }
  }

  onKeyDown = e => {
    e.preventDefault();
    // TODO: cleanup
    if (isCtrlKeyHeldDown(e)) {
      this.onPressKeyWithCtrl(e);
    } else if (e.keyCode === keyCodes.Escape) {
      this.onPressEscape();
    } else if (this.isKeyboardNavigationEvent(e)) {
      const keyNavAction = this.getKeyNavActionFromEvent(e);
      this.moveUsingKeyboard(keyNavAction);
    } else if (isKeyPrintable(e.keyCode) || e.keyCode === keyCodes.Backspace || e.keyCode === keyCodes.Delete) {
      this.toggleCellEdit(e);
    }
  };

  onKeyUp = e => {
    if (this.isKeyboardNavigationEvent(e)) {
      this._enableSelectionAnimation = false;
      // set selected state from temporary srolling metrics
      if (this._scrollingMetrics != null) {
        this.selectCell(this._scrollingMetrics.position);
      }
    }
  }

  toggleCellEdit = (e) => {
    const { props } = this;
    if (isSelectedCellEditable(props)) {
      const { isEditorEnabled, toggleCellEdit } = props;
      const enableEdit = !isEditorEnabled;
      toggleCellEdit(enableEdit, e.key);
      if (enableEdit === false) {
        this.focus();
      }
    }
  };

  onPressKeyWithCtrl = ({ keyCode }) => {
    const { props } = this;
    if (this.copyPasteEnabled() && isSelectedCellEditable(props)) {
      if (keyCode === keyCodes.c) {
        const value = getSelectedCellValue(props);
        this.handleCopy({ value });
      } else if (keyCode === keyCodes.v) {
        this.handlePaste();
      }
    }
  };

  onPressEscape = () => {
    this.handleCancelCopy();
  };

  onPressTab = (e) => {
    if (e.shiftKey === true) {
      // this.move();
    } else {
      // this.move();
    }
  };

  copyPasteEnabled = () => {
    return this.props.onCellCopyPaste !== null;
  };

  handleCopy = ({ value }) => {
    const { rowIdx } = this.props.selectedPosition;
    this.copied = { value, rowIdx };
  };

  handleCancelCopy = () => {
    this.copied = null;
  };

  handlePaste = () => {
    const { props, copied } = this;
    if (copied == null) { return; }
    const { key: cellKey } = getSelectedColumn(props);
    const { selectedPosition: { rowIdx: toRow }, onCellCopyPaste, onGridRowsUpdated } = props;
    const { rowIdx: fromRow, value: textToCopy } = copied;

    if (isFunction(onCellCopyPaste)) {
      onCellCopyPaste({
        cellKey,
        rowIdx,
        fromRow,
        toRow,
        value: textToCopy
      });
    }

    onGridRowsUpdated(cellKey, toRow, toRow, { [cellKey]: textToCopy }, AppConstants.UpdateActions.COPY_PASTE, fromRow);
  };

  isKeyboardNavigationEvent(e) {
    return this.getKeyNavActionFromEvent(e) != null;
  }

  getKeyNavActionFromEvent(e) {
    const { visibleEnd, visibleStart, onHitBottomBoundary, onHitRightBoundary, onHitLeftBoundary, onHitTopBoundary } = this.props;
    const keyNavActions = {
      ArrowDown: {
        getNext: current => ({ ...current, rowIdx: current.rowIdx + 1 }),
        isCellAtBoundary: cell => cell.rowIdx >= visibleEnd - SCROLL_CELL_BUFFER,
        onHitBoundary: onHitBottomBoundary,
        getBoundaryDimensions: () => this.getSelectedCellDimensions(),
        scrollReadyCondition: scrollMetrics => scrollMetrics.visibleEnd === visibleEnd - 1
      },
      ArrowUp: {
        getNext: current => ({ ...current, rowIdx: current.rowIdx - 1 }),
        isCellAtBoundary: cell => cell.rowIdx !== 0 && cell.rowIdx <= visibleStart - 1,
        onHitBoundary: () => {
          this._enableSelectionAnimation = !this.isScrollingWithKeyboard() ? false : true;
          onHitTopBoundary();
        },
        getBoundaryDimensions: () => ({ ...this.getSelectedCellDimensions(), top: 0 }),
        scrollReadyCondition: scrollMetrics => scrollMetrics.visibleStart === visibleStart
      },
      ArrowRight: {
        getNext: current => ({ ...current, idx: current.idx + 1 }),
        isCellAtBoundary: () => false,
        onHitBoundary: onHitRightBoundary
      },
      ArrowLeft: {
        getNext: current => ({ ...current, idx: current.idx - 1 }),
        isCellAtBoundary: () => false,
        onHitBoundary: onHitLeftBoundary
      }
    };
    return keyNavActions[e.key];
  }

  moveUsingKeyboard(keyNavAction) {
    const { getNext, isCellAtBoundary, onHitBoundary, getBoundaryDimensions } = keyNavAction;
    this._enableSelectionAnimation = true;
    const currentPosition = this.getSelectedCellPosition();
    const next = getNext(currentPosition);
    if (isCellAtBoundary(next)) {
      onHitBoundary();
      this.setScrollingMetrics(next, getBoundaryDimensions());
    } else {
      this.resetScrollingMetrics();
      this.selectCell(next);
    }
  }

  isCellWithinBounds = ({ idx, rowIdx }) => {
    return rowIdx >= 0 && idx >= 0 && idx < this.props.columns.length;
  };

  isGridSelected = () => {
    return this.isCellWithinBounds(this.props.selectedPosition);
  };

  isReadyToScrollWithKeyboard = (scrollReadyCondition) => {
    if (this._scrollingMetrics == null) {
      return true;
    }
    return this._scrollingMetrics && scrollReadyCondition(this._scrollingMetrics) === true;
  };

  isScrollingWithKeyboard() {
    return this._scrollingMetrics != null;
  }

  focus = () => {
    if (this.node && document.activeElement !== this.node) {
      this.node.focus();
    }
  };

  getSelectedCellDimensions() {
    return this._scrollingMetrics ? this._scrollingMetrics.dimensions : getSelectedDimensions(this.props);
  }

  getSelectedCellPosition() {
    return this._scrollingMetrics ? this._scrollingMetrics.position : this.props.selectedPosition;
  }

  selectCell = cell => {
    if (this.isCellWithinBounds(cell)) {
      this.props.selectCell(cell);
    }
  };

  setScrollingMetrics(next, dimensions) {
    const { visibleEnd, visibleStart } = this.props;
    this._scrollingMetrics = {
      dimensions,
      position: next,
      visibleEnd,
      visibleStart
    };
  }

  resetScrollingMetrics() {
    this._scrollingMetrics = null;
  }

  render() {
    const { isEditorEnabled, firstEditorKeyPress, onCommit, onCommitCancel } = this.props;
    const { width, left, top, height } = this.getSelectedCellDimensions();
    const value = getSelectedCellValue(this.props);
    const rowIdx = getSelectedRowIndex(this.props);
    return (
      <div
        ref={node => {
          this.node = node;
        }}
        tabIndex="0"
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
      >
        {!isEditorEnabled && this.isGridSelected() && (
          <SelectionMask
            {...this.props}
            width={width}
            left={left}
            top={top}
            height={height}
            isAnimating={this._enableSelectionAnimation === true}
            isFixed={this.isScrollingWithKeyboard()}
          />
        )}
        {isEditorEnabled && (
          <EditorContainer
            width={width}
            left={left}
            top={top}
            height={height}
            rowData={getSelectedRow(this.props)}
            column={getSelectedColumn(this.props)}
            rowIdx={rowIdx}
            value={value}
            firstEditorKeyPress={firstEditorKeyPress}
            onCommit={onCommit}
            onCommitCancel={onCommitCancel}
          />
        )}
      </div>
    );
  }
}

export default InteractionMasks;