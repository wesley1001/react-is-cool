'use strict'

let { Button, Input, Modal, Grid, Row, Col, Glyphicon } = ReactBootstrap;

// 复选选项框
let CheckOptionBox = React.createClass({
    // 复选内容变化
    handleContentChange: function(e) {
        let content = e.target.value;
        this.setState({content: content});
        if (this.state.checked) {
            this.props.onContentChange(content);
        }
    },
    // 复选框变化
    handleCheckChange: function(e) {
        let currentChecked = !this.state.checked;

        this.setState({checked: currentChecked});
        if (currentChecked) {
            this.props.onContentChange(this.state.content);
        } else {
            this.props.onContentChange(null);
        }
    },
    getInitialState: function() {
        return {checked: this.props.defaultChecked, content: ""};
    },
    render: function() {
        return (
            <Row className="show-grid">
                <Col lg={12}>
                    <label>{this.props.label}</label>
                    <Input type="text"
                        addonBefore={
                            <input type="checkbox"
                                checked={this.state.checked}
                                onChange={this.handleCheckChange}/>}
                        placeholder={this.props.holder}
                        value={this.state.content}
                        onChange={this.handleContentChange} />
                </Col>
            </Row>
        );
    }
});