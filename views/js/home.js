'use strict'

let TryButton = React.createClass({
    handleClick: function(event) {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                console.log(data);
                this.props.onTryClick(data);
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    render: function() {
        return (
            <button className="btn btn-default" type="button" onClick={this.handleClick}>
                试试手气
            </button>
        );
    }
});

const {Table, Column, Cell} = FixedDataTable;

const DateCell = ({rowIndex, data, col, ...props}) => (
    <Cell {...props}>
    {data[rowIndex][col].split("T")[0]}
    </Cell>
);

const TextCell = ({rowIndex, data, col, ...props}) => (
    <Cell {...props}>
    {data[rowIndex][col]}
    </Cell>
);

let StockTable = React.createClass({
        render: function() {
            return (
                <Table
                    rowHeight={50}
                    rowsCount={this.props.data.length}
                    width={600}
                    height={400}
                    headerHeight={50}
                    {...this.props}>
                    <Column
                        header={<Cell>股票代码</Cell>}
                        cell={<TextCell data={this.props.data} col="stock_id" />}
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
            );
        }
});

let FilterStockBox = React.createClass({
    handleTryClick: function(data) {
        this.setState({data: data});
    },
    getInitialState: function() {
        return {data: []};
    },
    render: function() {
        return (
            <div className="filterStockBox">
                <TryButton url="/api/filterStockMagic" onTryClick={this.handleTryClick} />
                <h1 />
                <StockTable data={this.state.data} />
            </div>
        );
    }
});

ReactDOM.render(
    <FilterStockBox />,
    document.getElementById('content')
);

//let Comment = React.createClass({
//        render: function() {
//            return (
//                <div className="comment">
//                    <h2 className="commentAuthor">
//                        {this.props.author}
//                    </h2>
//                    {this.props.children}
//                </div>
//            );
//        }
//});
//
//let CommentList = React.createClass({
//        render: function() {
//            var commentNodes = this.props.data.map(function(comment) {
//                return (
//                    <Comment author={comment.author} key={comment.id}>
//                        {comment.text}
//                    </Comment>
//                );
//            });
//            return (
//                <div className="commentList">
//                    {commentNodes}
//                </div>
//            );
//        }
//});
//
//let CommentForm = React.createClass({
//    getInitialState: function() {
//        return {author: '', text: ''};
//    },
//    handleAuthorChange: function(e) {
//        this.setState({author: e.target.value});
//    },
//    handleTextChange: function(e) {
//        this.setState({text: e.target.value});
//    },
//    handleSubmit: function(e) {
//        e.preventDefault();
//        var author = this.state.author.trim();
//        var text = this.state.text.trim();
//        if (!text || !author) {
//            return;
//        }
//        this.props.onCommentSubmit({author: author, text: text});
//        // TODO: send request to the server
//        this.setState({author: '', text: ''});
//    },
//    render: function() {
//        return (
//            <form className="commentForm" onSubmit={this.handleSubmit}>
//                <input
//                    type="text"
//                    placeholder="Your name"
//                    value={this.state.author}
//                    onChange={this.handleAuthorChange}
//                />
//                <input
//                    type="text"
//                    placeholder="Say something..."
//                    value={this.state.text}
//                    onChange={this.handleTextChange}
//                />
//                <input type="submit" value="Post" />
//            </form>
//        );
//    }
//});
//
//let CommentBox = React.createClass({
//        handleCommentSubmit: function(comment) {
//            var comments = this.state.data;
//            // Optimistically set an id on the new comment. It will be replaced by an
//            // id generated by the server. In a production application you would likely
//            // not use Date.now() for this and would have a more robust system in place.
//            comment.id = Date.now();
//            var newComments = comments.concat([comment]);
//            this.setState({data: newComments});
//
//            $.ajax({
//                url: this.props.url,
//                dataType: 'json',
//                type: 'POST',
//                data: comment,
//                success: function(data) {
//                    this.setState({data: data});
//                }.bind(this),
//                error: function(xhr, status, err) {
//                    this.setState({data: comments});
//                    console.error(this.props.url, status, err.toString());
//                }.bind(this)
//            });
//        },
//        getInitialState: function() {
//            return {data: []};
//        },
//        componentDidMount: function() {
//            $.ajax({
//                url: this.props.url,
//                dataType: 'json',
//                cache: false,
//                success: function(data) {
//                    this.setState({data: data});
//                }.bind(this),
//                error: function(xhr, status, err) {
//                    console.error(this.props.url, status, err.toString());
//                }.bind(this)
//            });
//        },
//        render: function() {
//            return (
//                <div className="commentBox">
//                    <h1>Comments</h1>
//                    <CommentList data={this.state.data} />
//                    <CommentForm onCommentSubmit={this.handleCommentSubmit} />
//                </div>
//            );
//        }
//});
//
//ReactDOM.render(
//    <CommentBox url="/api/comments" />,
//    document.getElementById('content')
//);
