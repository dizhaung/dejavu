import React, { Component } from 'react';
import { Table, Alert, Button, Modal } from 'antd';
import { arrayOf, object, shape, string, number, func, bool } from 'prop-types';
import { css } from 'react-emotion';
import { connect } from 'react-redux';
import JsonInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';

import MappingsDropdown from '../MappingsDropdown';
import MappingsIcon from '../MappingsIcon';
import Cell from '../Cell';

import { getActiveCell, getError } from '../../reducers/cell';
import * as dataSelectors from '../../reducers/data';
import {
	setCellActive,
	setCellValueRequest,
	addDataRequest,
} from '../../actions';
import { extractColumns } from './utils';

// making DataTable stateful to update data from cell since onAllData is invoked only when data changes due to query
class DataTable extends Component {
	state = {
		data: this.props.data,
		showModal: false,
		addDataError: false,
		addDataValue: null,
	};

	handleChange = (row, column, value) => {
		const { setCellValue } = this.props;
		const { data } = this.state;

		const nextData = [
			...data.slice(0, row),
			{
				...data[row],
				[column]: value,
			},
			...data.slice(row + 1),
		];
		this.setState({
			data: nextData,
		});
		const record = data[row];
		setCellValue(record._id, column, value);
	};

	toggleModal = () => {
		this.setState(({ showModal }) => ({
			showModal: !showModal,
		}));
	};

	handleJsonInput = ({ error, jsObject }) => {
		this.setState({ addDataError: Boolean(error), addDataValue: jsObject });
	};

	addValue = () => {
		const { addDataError, addDataValue } = this.state;
		if (!addDataError && addDataValue) {
			this.toggleModal();
			this.props.addDataRequest(addDataValue);
		}
	};

	render() {
		const {
			activeCell,
			mappings,
			setCellActive: setCellActiveDispatch,
			error,
		} = this.props;
		const { data, showModal, addDataError } = this.state;
		const { addDataIsLoading, addDataRequestError } = this.props;
		const columns = extractColumns(mappings).map(property => ({
			key: property,
			dataIndex: property,
			title: property,
			filterDropdown: (
				<MappingsDropdown mapping={mappings.properties[property]} />
			),
			width: 250,
			filterIcon: (
				<MappingsIcon mapping={mappings.properties[property]} />
			),
			onHeaderCell: () => ({
				className: css({
					padding: '10px !important',
					span: {
						display: 'flex',
						alignItems: 'center',
					},
				}),
			}),
			render: (text, record, row) => (
				<Cell
					row={row}
					column={property}
					active={
						activeCell.row === row && activeCell.column === property
					}
					onFocus={setCellActiveDispatch}
					onChange={this.handleChange}
					mapping={mappings.properties[property]}
				>
					{text}
				</Cell>
			),
		}));
		const columnsWithId = [
			{
				key: '_id',
				dataIndex: '_id',
				title: '_id',
				fixed: 'left',
				width: 250,
				render: text => (
					<div
						css={{
							width: 230,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							padding: 10,
						}}
					>
						{text}
					</div>
				),
			},
			...columns,
		];
		return (
			<>
				{error && <Alert type="error" message={error} banner />}
				{addDataRequestError && (
					<Alert type="error" message={addDataRequestError} banner />
				)}
				<Table
					bordered
					columns={columnsWithId}
					dataSource={data}
					rowKey="_id"
					pagination={false}
					loading={!data.length}
					scroll={{
						x: true,
					}}
					size="medium"
					css={{
						'.ant-table td': { whiteSpace: 'nowrap' },
						'.ant-table-body': {
							overflowX: 'auto !important',
						},
						'.ant-table-fixed': { minWidth: 'auto' },
						'.ant-table-tbody > tr > td': {
							padding: 0,
						},
					}}
				/>
				<Button
					icon="plus"
					type="primary"
					css={{ marginTop: 10 }}
					onClick={this.toggleModal}
					loading={addDataIsLoading}
				>
					Add Row
				</Button>
				<Modal
					visible={showModal}
					onCancel={this.toggleModal}
					onOk={this.addValue}
					okButtonProps={{ disabled: addDataError }}
				>
					<JsonInput
						id="add-row-modal"
						locale={locale}
						placeholder={{}}
						theme="light_mitsuketa_tribute"
						style={{ outerBox: { marginTop: 20 } }}
						onChange={this.handleJsonInput}
					/>
				</Modal>
			</>
		);
	}
}

DataTable.propTypes = {
	data: arrayOf(object).isRequired,
	mappings: object.isRequired,
	activeCell: shape({ row: number, column: string }),
	setCellActive: func.isRequired,
	setCellValue: func.isRequired,
	addDataRequest: func.isRequired,
	error: string,
	addDataRequestError: string,
	addDataIsLoading: bool.isRequired,
};

const mapStateToProps = state => ({
	activeCell: getActiveCell(state),
	error: getError(state),
	addDataRequestError: dataSelectors.getError(state),
	addDataIsLoading: dataSelectors.getIsLoading(state),
});

const mapDispatchToProps = {
	setCellActive,
	setCellValue: setCellValueRequest,
	addDataRequest,
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(DataTable);
