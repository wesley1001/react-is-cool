'use strict'

let parseDate = d3.time.format("%Y-%m-%d").parse;
let formatDate = d3.time.format("%Y-%m-%d");

let { Button, Input, Modal, Grid, Row, Col, Glyphicon } = ReactBootstrap;

// 筛选选项区域
let FilterOptionsBox = React.createClass({
    // 过滤股票按钮点击事件
    handleFilterClick: function(event) {
        $.ajax({
            url: this.props.filterUrl,
            dataType: 'json',
            data: {
                dealDate: this.state.dealDate,
                rsi: this.state.rsi
            },
            cache: false,
            success: function(data) {
                this.setState({'filteredData': data});
                this.props.onFilterClick(data);
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    // 模拟买入按钮点击事件
    handleMockBuyClick: function(event) {
        $.ajax({
            url: this.props.mockBuyUrl,
            dataType: 'json',
            type: 'POST',
            data: {jsonData: JSON.stringify(this.state)},
            cache: false,
            success: function(data) {
                console.log(data);

                let result = '<p>您的战绩如下：</p><p>每股各买入100股，总买入金额为：' + data.buyAmount +
                    '元</p><p>' + data.holdDay + '天后总卖出金额为：' + data.saleAmount +
                    '元</p><p>结果为：' + data.diff + '元</p>';
                this.setState({
                    showBuyResult: true,
                    buyAmount: data.buyAmount,
                    holdDay: data.holdDay,
                    saleAmount: data.saleAmount,
                    diff: data.diff
                });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    handleDealDateChange: function(data) {
        this.setState({dealDate: data});
    },
    handleRSIChange: function(data) {
        this.setState({rsi: data});
    },
    handleHoldDateChange: function(data) {
        this.setState({holdDay: data});
    },
    getInitialState: function() {
        return { showBuyResult: false, buyAmount: 0, holdDay: 0, saleAmount: 0, diff: 0 };
    },
    close() {
        this.setState({ showBuyResult: false });
    },
    open() {
        this.setState({ showBuyResult: true });
    },
    render: function() {
        return (
            <Grid>
                <Row className="show-grid">
                    <Col lg={12}>
                        <h4>股票筛选</h4>
                    </Col>
                </Row>
                <CheckOptionBox label="指定交易日期" holder="请输入交易日期（如果不输入则默认为当前日期）。样例：2015-01-01"
                    defaultChecked={false}
                    onContentChange={this.handleDealDateChange} />
                <h1 />
                <CheckOptionBox label="RSI1" holder="请输入范围。样例：>80 or <=20"
                    defaultChecked={false}
                    onContentChange={this.handleRSIChange} />
                <h1 />
                <CheckOptionBox label="MACD" holder="请输入范围。样例：>80 or <=20" />
                <h1 />
                <Button bsStyle="default" onClick={this.handleFilterClick}>
                    <Glyphicon glyph="search" />过滤股票
                </Button>

                <hr />
                <Row className="show-grid">
                    <Col lg={12}>
                        <h4>模拟买入</h4>
                    </Col>
                </Row>
                <CheckOptionBox label="持有天数" holder="请输入持有天数（如果不输入则默认为7天）。样例：7"
                    defaultChecked={false}
                    onContentChange={this.handleHoldDateChange} />
                <h1 />
                <Button bsStyle="danger" onClick={this.handleMockBuyClick}>
                    <Glyphicon glyph="yen" />模拟买入
                </Button>

                <Modal show={this.state.showBuyResult} onHide={this.close}>
                    <Modal.Header closeButton>
                        <Modal.Title>模拟买入结果</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>您的战绩如下：</p>
                        <p>每股各买入100股，总买入金额为：{this.state.buyAmount}元</p>
                        <p>{this.state.holdDay}天后总卖出金额为：{this.state.saleAmount}元</p>
                        <p>结果为：{this.state.diff}元</p>
                    </Modal.Body>
                    <Modal.Footer>
                    <Button onClick={this.close}>关闭</Button>
                    </Modal.Footer>
                </Modal>
            </Grid>
        );
    }
});

// 股票列表
const {Table, Column, Cell} = FixedDataTable;

const DateCell = ({rowIndex, data, col, ...props}) => (
    <Cell {...props}>
    {data[rowIndex][col]}
    </Cell>
);

const TextCell = ({rowIndex, data, col, ...props}) => (
    <Cell {...props}>
    {data[rowIndex][col]}
    </Cell>
);

let StockTable = React.createClass({
    handleNextTransDayChange: function(data) {
        this.setState({nextTransDay: data});
    },
    getLastTransData: function() {
        if (this.state.selectedStockId) {
            let nextTransDate = new Date();

            if (this.state.nextTransDay) {
                nextTransDate = new Date((new Date(parseDate(this.state.selectedDealDate))).getTime() +
                    this.state.nextTransDay * 24 * 60 * 60 * 1000);
            }

            $.ajax({
                url: "/api/stock/transaction",
                dataType: 'json',
                data: {
                    dealDate: formatDate(nextTransDate),
                    stockId: this.state.selectedStockId
                },
                cache: false,
                success: function(data) {
                    data.forEach((d, i) => {
                        d.date = new Date(parseDate(d.date).getTime());
                        d.open = +d.open;
                        d.high = +d.high;
                        d.low = +d.low;
                        d.close = +d.close;
                        d.volume = (+d.volume) / 100;   // 需要将股转成手
                        // console.log(d);
                    });

                    console.log(data);

                    /* change the type from hybrid to svg to compare the performance between svg and canvas */
                    ReactDOM.render(
                    <CandleStickStockScaleChartWithVolumeHistogramV3 data={data} type="hybrid" />,
                        document.getElementById("chart"));

                }.bind(this),
                error: function(xhr, status, err) {
                    console.error("/api/stock/transaction", status, err.toString());
                }.bind(this)
            });
        }
    },
    getInitialState: function() {
        return { selectedStockId: null, selectedStockName: "", selectedDealDate: null };
    },
    render: function() {
        let self = this;

        return (
            <div>
                <Table
                    rowHeight={50}
                    rowsCount={this.props.data.length}
                    width={600}
                    height={400}
                    headerHeight={50}
                    rowClassNameGetter={function(rowIndex) { return ''; }}
                    onRowClick={
                        function(e, rowIndex) {
                            self.setState({
                                selectedStockId: self.props.data[rowIndex].stock_id,
                                selectedStockName: "K线图 - " + self.props.data[rowIndex].stock_name,
                                selectedDealDate: self.props.data[rowIndex].date
                            });

                            $.ajax({
                                url: "/api/stock/transaction",
                                dataType: 'json',
                                data: {
                                    dealDate: self.props.data[rowIndex].date,
                                    stockId: self.props.data[rowIndex].stock_id
                                },
                                cache: false,
                                success: function(data) {
                                    data.forEach((d, i) => {
                                        d.date = new Date(parseDate(d.date).getTime());
                                        d.open = +d.open;
                                        d.high = +d.high;
                                        d.low = +d.low;
                                        d.close = +d.close;
                                        d.volume = (+d.volume) / 100;   // 需要将股转成手
                                        // console.log(d);
                                    });

                                    console.log(data);

                                    /* change the type from hybrid to svg to compare the performance between svg and canvas */
                                    ReactDOM.render(
                                        <CandleStickStockScaleChartWithVolumeHistogramV3 data={data} type="hybrid" />,
                                        document.getElementById("chart"));

                                }.bind(this),
                                error: function(xhr, status, err) {
                                    console.error("/api/stock/transaction", status, err.toString());
                                }.bind(this)
                            });
                        }
                    }
                    {...this.props}>
                    <Column
                        header={<Cell>股票代码</Cell>}
                        cell={<TextCell data={this.props.data} col="stock_id" />}
                        width={100}
                    />
                    <Column
                        header={<Cell>股票名称</Cell>}
                        cell={<TextCell data={this.props.data} col="stock_name" />}
                        width={100}
                    />
                    <Column
                        header={<Cell>统计最后日期</Cell>}
                        cell={<DateCell data={this.props.data} col="date" />}
                        width={140}
                    />
                    <Column
                        header={<Cell>RSI1</Cell>}
                        cell={<TextCell data={this.props.data} col="rsi1" />}
                        width={100}
                    />
                    <Column
                        header={<Cell>RSI2</Cell>}
                        cell={<TextCell data={this.props.data} col="rsi2" />}
                        width={100}
                    />
                    <Column
                        header={<Cell>RSI3</Cell>}
                        cell={<TextCell data={this.props.data} col="rsi3" />}
                        width={100}
                    />
                </Table>
                <small>* 点击股票可以查看该股票的K线图</small>
                <hr />
                <h3>{this.state.selectedStockName}</h3>
                <div id="chart" ></div>
                <h1 />
                <CheckOptionBox label="查看随后X天走势" holder="请输入想要看的随后走势天数（如果不输入则默认为到当前日期）。样例：7"
                    defaultChecked={false}
                    onContentChange={this.handleNextTransDayChange} />
                <Button onClick={this.getLastTransData}>查看随后走势</Button>
            </div>
        );
    }
});

let FilterStockBox = React.createClass({
    handleFilterClick: function(data) {
        this.setState({data: data});
    },
    getInitialState: function() {
        return {data: []};
    },
    render: function() {
        return (
            <div className="filterStockBox">
                <FilterOptionsBox
                    filterUrl="/api/stock/filter"
                    mockBuyUrl="/api/stock/mockBuy"
                    onFilterClick={this.handleFilterClick} />
                <hr />
                <Row>
                    <Col lg={12}>
                        <StockTable data={this.state.data} />
                    </Col>
                </Row>
            </div>
        );
    }
});

ReactDOM.render(
    <FilterStockBox />,
    document.getElementById('content')
);