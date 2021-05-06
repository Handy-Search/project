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

    console.log("SEARCH", q)
    fetch("http://localhost:8080/search?q=" + q)
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



    /*
    {
  _id: -2082984149,
  rank: 2.1487756377319944,
  doc: {
    _id: 60923c3f71001509def0790e,
    doc_id: 1350421293,
    last_crawled: 1620196415317,
    url: [Object]
  },
  pagecontent: {
    _id: 60923c4171001509def0798b,
    doc_id: 1350421293,
    mime: 'text/html',
    preview: 'Skip to content Sign&nbsp;up Sign&nbsp;up Why GitHub? Features → Mobile → Actions → Codespaces → Packages → Security → Code review → Project management → Integrations → GitHub Sponsors → Customer stories→ Team Enterprise Explore Explore',
    title: 'Features • GitHub Actions · GitHub'
  }
}
    */

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
