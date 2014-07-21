/**
 * Created by zina on 2014-07-18.
 */

var db = require('./query_base');

var crawler_repo = {
  /* return_process_callback(err, result_cursor) */
  getCursor: function(return_process_callback) {
    db.query('SELECT * FROM crawler', [], function(e, rows, fields) {
      if (e) {
        return_process_callback(e);
        return;
      }

      if (rows.length == 1) {
        return_process_callback(null, rows[0].Cursor);
        return;
      }
      else if (rows.length == 0) {
        return_process_callback(null, '');
        return;
      }
      else {
        return_process_callback(new Error('too many cursor'));
        return;
      }
    });
  },
  /* result_callback(err) */
  setCursor: function(cursor, result_callback) {
    db.query('IF EXISTS (SELECT * FROM crawler) UPDATE crawler SET `Cursor` = ? ELSE INSERT INTO crawler (`Cursor`) VALUES(?)',
      [cursor, cursor], function(e) {
      if (e) {
        result_callback(e);
        return;
      }

      result_callback(null);
    });
  }
}

module.exports = crawler_repo;