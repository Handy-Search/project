import React from 'react';
import {
  Navbar,
  Form,
  FormControl,
  Button
} from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';
import "../styles/SearchPage.css"

class Header extends React.Component {

  constructor() {
    super()
    this.state = {q: ""}
  }

  onSubmit = () => {
    this.props.search(this.state.q)
  }

  render() {
    return (
      <Navbar fixed="top" bg="light" expand="lg">
        <Navbar.Brand>Handy-Search</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">

          <Form inline>
            <FormControl value={this.state.q}
                         onChange={e => this.setState({ q: e.target.value })}
                         type="text" placeholder="Search" className="mr-sm-2 input-large search-query" />
            <Button variant="outline-success" onClick={this.onSubmit}>Search</Button>
          </Form>
        </Navbar.Collapse>
      </Navbar>
    )
  }
}

export default Header;