import React from 'react';
import {
  Card,
  Button
} from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';

class ResultBox extends React.Component {

  constructor() {
    super()
  }

  render() {
    return (
      <Card className="mt-2">
        <Card.Body>
          <Card.Title><a href={this.props.url}>{this.props.title}</a></Card.Title>
          <Card.Subtitle>
            {this.props.title}
          </Card.Subtitle>
        </Card.Body>
      </Card>
    );
  }
}

export default ResultBox;
