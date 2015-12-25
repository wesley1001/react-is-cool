var { ChartCanvas, Chart, DataSeries, OverlaySeries, EventCapture } = ReStock;
var { CandlestickSeries, HistogramSeries, LineSeries, AreaSeries } = ReStock.series;
var { MouseCoordinates, CurrentCoordinate } = ReStock.coordinates;

var { TooltipContainer, OHLCTooltip, MovingAverageTooltip } = ReStock.tooltip;
var { StockscaleTransformer } = ReStock.transforms;
var { EMA, SMA } = ReStock.indicator;
var { XAxis, YAxis } = ReStock.axes;

var { fitWidth, TypeChooser } = ReStock.helper;

class CandleStickStockScaleChartWithVolumeHistogramV3 extends React.Component {
    render() {
        var { data, type, width } = this.props;

        return (
            <ChartCanvas width={width} height={600}
                margin={{left: 70, right: 70, top:20, bottom: 30}} initialDisplay={100}
                dataTransform={[ { transform: StockscaleTransformer } ]}
                data={data} type={type}>

                <Chart id={1} yMousePointerDisplayLocation="right" yMousePointerDisplayFormat={(y) => y.toFixed(2)}
                    height={400} padding={{ top: 10, right: 0, bottom: 50, left: 0 }} >
                    <YAxis axisAt="right" orient="right" ticks={5} />
                    <XAxis axisAt="bottom" orient="bottom" showTicks={false}/>
                    <DataSeries id={0} yAccessor={CandlestickSeries.yAccessor} >
                        <CandlestickSeries fill= {{ up: "#FF0000", down: "#6BA583" }}/>
                    </DataSeries>
                    <DataSeries id={1} indicator={SMA} options={{ period: 20, pluck: "close" }}>
                        <LineSeries/>
                    </DataSeries>
                    <DataSeries id={2} indicator={EMA} options={{ period: 20 }} >
                        <LineSeries/>
                    </DataSeries>
                    <DataSeries id={3} indicator={EMA} options={{ period: 50 }} >
                        <LineSeries/>
                    </DataSeries>
                </Chart>
                <CurrentCoordinate forChart={1} forDataSeries={1} />
                <CurrentCoordinate forChart={1} forDataSeries={2} />
                <CurrentCoordinate forChart={1} forDataSeries={3} />
                <Chart id={2} yMousePointerDisplayLocation="left" yMousePointerDisplayFormat={d3.format(".4s")}
                    height={150} origin={(w, h) => [0, h - 150]} >
                    <XAxis axisAt="bottom" orient="bottom"/>
                    <YAxis axisAt="left" orient="left" ticks={5} tickFormat={d3.format("s")}/>
                    <DataSeries id={0} yAccessor={(d) => d.volume} >
                        <HistogramSeries fill={(d) => d.close > d.open ? "red" : "#6BA583"} />
                    </DataSeries>
                    <DataSeries id={1} indicator={SMA} options={{ period: 10, pluck:"volume" }} >
                        <AreaSeries />
                    </DataSeries>
                </Chart>
                <CurrentCoordinate forChart={2} forDataSeries={0} />
                <CurrentCoordinate forChart={2} forDataSeries={1} />
                <MouseCoordinates xDisplayFormat={d3.time.format("%Y-%m-%d")} type="crosshair" />
                <EventCapture mouseMove={true} zoom={true} pan={true} mainChart={1} defaultFocus={false} />
                <TooltipContainer>
                    <OHLCTooltip forChart={1} origin={[-40, 0]}/>
                    <MovingAverageTooltip forChart={1} onClick={(e) => console.log(e)} origin={[-38, 15]} />
                </TooltipContainer>
            </ChartCanvas>
        );
    }
}
CandleStickStockScaleChartWithVolumeHistogramV3.propTypes = {
    data: React.PropTypes.array.isRequired,
    width: React.PropTypes.number.isRequired,
    type: React.PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickStockScaleChartWithVolumeHistogramV3.defaultProps = {
    type: "svg"
};
CandleStickStockScaleChartWithVolumeHistogramV3 = fitWidth(CandleStickStockScaleChartWithVolumeHistogramV3);