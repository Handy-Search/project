import React from 'react';
import Header from './Header'
import ResultBox from './ResultBox'
import "../styles/SearchPage.css"
import {
  Container,
  Col
} from 'react-bootstrap'

class SearchPage extends React.Component {
  constructor() {
    super()
    this.state = { results: [], resultBoxes: [] }

  }

  componentDidMount() {
  }

  search = q => {

    console.log("SEARCH", API_URL + "/search?q=" + q)
    fetch(API_URL + "/search?q=" + q)
      .then(res => res.json())
      .then(results => {
        console.log(results)
        let resultBoxes = []
        resultBoxes = results.map((res, i) => {
          if (res.doc.url && res.pagecontent) {
          let url = `${res.doc.url.protocol}://${res.doc.url.host}:${res.doc.url.port}${res.doc.url.path}`
          return <ResultBox key={"res" + i}
            url={url}
            title={res.pagecontent.title}
            preview={res.pagecontent.title}>
          </ResultBox>
          }
          return <div key={"res" + i}></div>
        })

        this.setState({ results, resultBoxes })
      }).catch(console.log)
  }

  render() {
    return (
      <div>
        <Header search={this.search}></Header>
        <Container fluid>
          <Col></Col>
          <Col className="mt-5 pt-2 pb-2" md={8} style={{
            position: 'absolute', left: '50%',
            transform: 'translate(-50%, 0%)'
          }}>{this.state.resultBoxes}</Col>
          <Col></Col>
        </Container>
      </div>
    )
  }
}

export default SearchPage;
