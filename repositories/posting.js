/**
 * Created by zina on 2014-07-21.
 */

var db = require('./query_base');

var posting_repo = {
  /* save_callback(e) */
  savePostingByFilename: function(posting, save_callback) {
    db.query('INSERT INTO postings(Permalink, Subject, Content, IsPublished, OriginFilename)'
        + ' VALUES(?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Permalink = ?, Subject = ?, Content = ?, IsPublished = ?, OriginFilename = ?',
      [posting.Permalink, posting.Subject, posting.Content, posting.IsPublished, posting.OriginFilename,
        posting.Permalink, posting.Subject, posting.Content, posting.IsPublished, posting.OriginFilename],
      function(e) {
        if (e) {
          save_callback(e);
          return;
        }

        save_callback(null);
        return;
      });
  },
  /* get_callback(e, posting) */
  getPostingByPermalink: function(permalink, get_callback) {
    db.query('SELECT * FROM postings WHERE Permalink = ?', [permalink], function(e, rows) {
      if (e) {
        get_callback(e);
        return;
      }

      if (rows.length == 1) {
        get_callback(null, rows[0]);
        return;
      }
      else if (rows.length == 0) {
        get_callback(null, null);
        return;
      }
      else {
        /* it's imposible! */
        get_callback(new Error('get unexpected row count returned : ' + rows.length));
        return;
      }
    });
  },
  /* get_callback(e, posting) */
  getPostingByFilename: function(filename, get_callback) {
    db.query('SELECT * FROM postings WHERE OriginFilename = ?', [filename], function(e, rows) {
      if (e) {
        get_callback(e);
        return;
      }

      if (rows.length == 1) {
        get_callback(null, rows[0]);
        return;
      }
      else if (rows.length == 0) {
        get_callback(null, null);
        return;
      }
      else {
        /* it's imposible! */
        get_callback(new Error('get unexpected row count returned : ' + rows.length));
        return;
      }
    });
  },
  /* update_callback(e) */
  updatePostingPropertyByFilename: function(posting, update_callback) {
    db.query('UPDATE postings SET Permalink =?, Subject = ?, IsPublished = ?, WHERE OriginFilename = ?',
      [posting.Permalink, posting.Subject, posting.IsPublished, posting.OriginFilename], function(e) {
        if (e) {
          update_callback(e);
          return;
        }

        update_callback(null);
        return;
      });
  },
  /* delete_callback(e) */
  deletePostingByFilename: function(filename, delete_callback) {
    db.query('DELTE FROM postings WHERE LOWER(OriginFilename) = ?' [filename], function(e) {
      if (e) {
        delete_callback(e);
        return;
      }

      delete_callback(null);
      return;
    });
  },
  /* get_callback(e, posts) */
  getPostingPageList: function(count, get_callback) {
    db.query('SELECT Permalink, Subject, ChangedTimestamp, PublishedTimestamp FROM postings'
      + ' WHERE IsPublished = 1 ORDER BY ChangedTimestamp DESC LIMIT ?', [count], function(e, rows, fields) {
      if (e) {
        get_callback(e);
        return;
      }

      get_callback(null, rows);
      return;
    });
  }
};

module.exports = posting_repo;