'use strict'

let parseDate = d3.time.format("%Y-%m-%d").parse;
let formatDate = d3.time.format("%Y-%m-%d");

let { Button, Input, Modal, Grid, Row, Col, Glyphicon } = ReactBootstrap;

let ProgressBar = window.ReactProgressBarPlus;

// 筛选选项区域
let FilterOptionsBox = React.createClass({
    // 过滤股票按钮点击事件
    handleFilterClick: function(event) {
        this.setState({
            percent: 0,
            autoIncrement: true,
            intervalTime: 100
        });

        $.ajax({
            url: this.props.filterUrl,
            dataType: 'json',
            data: {
                dealDate: this.state.dealDate,
                rsi: this.state.rsi,
                top: this.state.top
            },
            cache: false,
            success: function(data) {
                this.setState({'filteredData': data});
                this.props.onFilterClick(data);

                this.setState({
                    percent: -1
                });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());

                this.setState({
                    percent: -1
                });
            }.bind(this)
        });
    },
    // 模拟买入按钮点击事件
    handleMockBuyClick: function(event) {
        this.setState({
            percent: 0,
            autoIncrement: true,
            intervalTime: 100
        });

        $.ajax({
            url: this.props.mockBuyUrl,
            dataType: 'json',
            type: 'POST',
            data: {jsonData: JSON.stringify(this.state)},
            cache: false,
            success: function(data) {
                console.log(data);

                let diffPercent = (Math.round(data.diff / data.buyAmount * 10000) / 100);

                this.setState({
                    showBuyResult: true,
                    buyAmount: data.buyAmount,
                    holdDay: data.holdDay,
                    saleAmount: data.saleAmount,
                    diff: data.diff,
                    diffPercent: diffPercent,

                    percent: -1
                });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());

                this.setState({
                    percent: -1
                });
            }.bind(this)
        });
    },
    handleDealDateChange: function(data) {
        this.setState({dealDate: data});
    },
    handleTopChange: function(data) {
        this.setState({top: data});
    },
    handleRSIChange: function(data) {
        this.setState({rsi: data});
    },
    handleHoldDateChange: function(data) {
        this.setState({holdDay: data});
    },
    getInitialState: function() {
        return {
            showBuyResult: false,
            buyAmount: 0,
            holdDay: 0,
            saleAmount: 0,
            diff: 0,
            percent: -1,
            autoIncrement: false,
            intervalTime: 200
        };
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
                <ProgressBar percent={this.state.percent}
                    autoIncrement={this.state.autoIncrement}
                    intervalTime={this.state.intervalTime} />

                <Row className="show-grid">
                    <Col lg={12}>
                        <h4>股票筛选</h4>
                    </Col>
                </Row>
                <CheckOptionBox label="指定交易日期" holder="请输入交易日期（如果不输入则默认为当前日期）。样例：2015-01-01"
                    defaultChecked={false}
                    onContentChange={this.handleDealDateChange} />
                <CheckOptionBox label="龙头股"
                    holder="请输入涨幅和取板块头X个股票。样例：7,3"
                    defaultChecked={false}
                    onContentChange={this.handleTopChange} />
                <CheckOptionBox label="涨停规律"
                    holder="请输入涨停规律。样例：7,7,-7（解释：第一天涨幅超过7%，第二天涨幅超过7%，第三天[跌]幅超过7%）"
                    defaultChecked={false}
                    onContentChange={this.handleTopChange} />
                <CheckOptionBox label="RSI1" holder="请输入范围。样例：>80 or <=20"
                    defaultChecked={false}
                    onContentChange={this.handleRSIChange} />
                <Button bsStyle="default" onClick={this.handleFilterClick}>
                    <Glyphicon glyph="search" />过滤股票
                </Button>

                <Row className="show-grid">
                    <Col lg={12}>
                        <hr />
                        <h4>模拟买入筛选股票</h4>
                    </Col>
                </Row>
                <CheckOptionBox label="持有天数" holder="请输入持有天数（如果不输入则默认为7天）。样例：7"
                    defaultChecked={false}
                    onContentChange={this.handleHoldDateChange} />
                <Button bsStyle="danger" onClick={this.handleMockBuyClick}>
                    <Glyphicon glyph="yen" />模拟买入
                </Button>

                <hr />

                <Modal show={this.state.showBuyResult} onHide={this.close}>
                    <Modal.Header closeButton>
                        <Modal.Title>模拟买入结果</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>您的成绩如下：</p>
                        <p>每股各买入100股，总买入金额为：{this.state.buyAmount}元</p>
                        <p>持有{this.state.holdDay}天后卖出，总卖出金额为：{this.state.saleAmount}元</p>
                        <p>结果为：{this.state.diff}元 / {this.state.diffPercent}%</p>
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
    getLastTransData: function(needShowMockBuyResult) {
        if (this.state.selectedStockId) {
            let nextTransDate = new Date();

            // 检查是否指定随后天数，没有就默认为当天
            if (this.state.nextTransDay) {
                nextTransDate = new Date((new Date(parseDate(this.state.selectedDealDate))).getTime() +
                    this.state.nextTransDay * 24 * 60 * 60 * 1000);
            }

            this.setState({
                percent: 0,
                autoIncrement: true,
                intervalTime: 100
            });

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

                    /* change the type from hybrid to svg to compare the performance between svg and canvas */
                    ReactDOM.render(
                    <CandleStickStockScaleChartWithVolumeHistogramV3 data={data} type="hybrid" />,
                        document.getElementById("chart"));

                    if (needShowMockBuyResult) {
                        console.log(data[data.length - 1]);
                        console.log(this.state.selectedClose);

                        let buyAmount = Math.round(this.state.selectedClose * 100);
                        let saleAmount = data[data.length - 1].close * 100;
                        let diff = saleAmount - buyAmount;
                        let diffPercent = (Math.round(diff / buyAmount * 10000) / 100);
                        let holdDay = Math.ceil((nextTransDate - parseDate(this.state.selectedDealDate)) /
                            (1000 * 3600 * 24));

                        this.setState({
                            showBuyResult: true,
                            buyAmount: buyAmount,
                            holdDay: holdDay,
                            saleAmount: saleAmount,
                            diff: diff,
                            diffPercent: diffPercent,

                            percent: -1
                        });
                    }

                }.bind(this),
                error: function(xhr, status, err) {
                    console.error("/api/stock/transaction", status, err.toString());

                    this.setState({
                        percent: -1
                    });
                }.bind(this)
            });
        }
    },
    handleMockBuyClick: function() {
        this.getLastTransData(true);
    },
    handleGetLastTransDataClick: function() {
        this.getLastTransData(false);
    },
    getInitialState: function() {
        return {
            selectedStockId: null, selectedStockName: "", selectedDealDate: null,
            showBuyResult: false, buyAmount: 0, holdDay: 0, saleAmount: 0, diff: 0
        };
    },
    close() {
        this.setState({ showBuyResult: false });
    },
    open() {
        this.setState({ showBuyResult: true });
    },
    render: function() {
        let self = this;

        return (
            <Grid>
            <ProgressBar percent={this.state.percent}
                autoIncrement={this.state.autoIncrement}
                intervalTime={this.state.intervalTime} />

                <Row>
                    <Col lg={12}>
                        <Table
                            rowHeight={50}
                            rowsCount={this.props.data.length}
                            width={1000}
                            height={400}
                            headerHeight={50}
                            rowClassNameGetter={function(rowIndex) { return ''; }}
                            onRowClick={
                                function(e, rowIndex) {
                                    self.setState({
                                        selectedStockId: self.props.data[rowIndex].stock_id,
                                        selectedStockName: self.props.data[rowIndex].stock_name,
                                        selectedDealDate: self.props.data[rowIndex].date,
                                        selectedClose: self.props.data[rowIndex].close,

                                        percent: 0,
                                        autoIncrement: true,
                                        intervalTime: 100
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

                                            self.setState({
                                                percent: -1
                                            });
                                        }.bind(this),
                                        error: function(xhr, status, err) {
                                            console.error("/api/stock/transaction", status, err.toString());

                                            self.setState({
                                                percent: -1
                                            });
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
                                header={<Cell>所属行业</Cell>}
                                cell={<TextCell data={this.props.data} col="industry" />}
                                width={100}
                            />
                            <Column
                                header={<Cell>统计最后日期</Cell>}
                                cell={<DateCell data={this.props.data} col="date" />}
                                width={140}
                            />
                            <Column
                                header={<Cell>收盘价</Cell>}
                                cell={<TextCell data={this.props.data} col="close" />}
                                width={100}
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
                    </Col>
                </Row>
                <Row>
                     <Col lg={12}>
                        <h3>{this.state.selectedStockName}</h3>
                        <div id="chart" ></div>

                        <hr />

                        <CheckOptionBox label="查看随后X天走势"
                            holder="请输入想要看的随后走势天数（如果不输入则默认为到当前日期）。样例：7"
                            defaultChecked={false}
                            onContentChange={this.handleNextTransDayChange} />
                        <Button onClick={this.handleGetLastTransDataClick}>
                            <Glyphicon glyph="search" />查看随后走势
                        </Button>
                        <Button bsStyle="danger" onClick={this.handleMockBuyClick} style={{marginLeft: 10}}>
                            <Glyphicon glyph="yen" />查看随后走势并模拟买入
                        </Button>
                    </Col>
                </Row>

                <Modal show={this.state.showBuyResult} onHide={this.close}>
                    <Modal.Header closeButton>
                        <Modal.Title>模拟买入结果</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>您的成绩如下：</p>
                        <p>买入【{this.state.selectedStockName}】100股，买入金额为：{this.state.buyAmount}元</p>
                        <p>持有{this.state.holdDay}天后卖出，卖出金额为：{this.state.saleAmount}元</p>
                        <p>结果为：{this.state.diff}元 / {this.state.diffPercent}%</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.close}>关闭</Button>
                    </Modal.Footer>
                </Modal>
            </Grid>
        );
    }
});

let FilterStockBox = React.createClass({
    handleFilterClick: function(data) {
        this.setState({data: data});
    },
    getInitialState: function() {
        return {
            data: []
        };
    },
    render: function() {
        return (
            <div className="filterStockBox">
                <FilterOptionsBox
                    filterUrl="/api/stock/filter"
                    mockBuyUrl="/api/stock/mockBuy"
                    onFilterClick={this.handleFilterClick} />
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