/**
 * Created by zina on 2014-07-18.
 */

var mysql = require('mysql');
var async = require('async');
var db_connection = require('../config').db_connection;

var query_base = {
  /* row_process_callback(err, rows, fields) */
  query: function(sql, param, row_process_callback) {
    async.waterfall([
        /* 1. mysql(mariadb) connect with configuration */
        function(callback) {
          var connection = mysql.createConnection(db_connection);

          return connection.connect(function(e) {
            if (e) return callback(e);
            return callback(null, connection);
          });
        },
        /* 2. query to db */
        function(connection, callback) {
          connection.query(sql, param, callback);
          connection.end();
        },
        /* 3. return to callback */
        function(rows, fields, callback) {
          row_process_callback(null, rows, fields);
        }
      ],
      /* EXCEPT: return to callback */
      function(e, r) {
        if (e) {
          row_process_callback(e);
        }
      });
  }
};

module.exports = query_base;