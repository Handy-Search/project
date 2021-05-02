const db = require('../models/database.js');


const errorMessageForError = err => {
  if (err instanceof Error) {
    if (!!err.code) {
      const codes = {
      }
      return codes[`${err.code}`] || err
    } else return err.message
  } else return err
}


const missing_params = params => singletonify(params).reduce((acc, cur) => acc + cur + ", ", "missing params: ").slice(0,-2)
const singletonify = item => Array.isArray(item) ? item : [item]
const checkMissingParams = arr => !singletonify(arr).reduce((acc, cur) => acc && (cur !== undefined && cur !== null), true)


const search = (req, res) => {
  if (checkMissingParams(req.query.q))
    return res.status(400).send(missing_params('q'));

  db.search(req.query.q)
    .then(result => res.status(200).send(result))
    .catch(err => res.status(500).send(errorMessageForError(err)))
}


module.exports = {
  search
}