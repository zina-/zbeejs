/**
 * Created by zina on 2014-07-17.
 */

var express = require('express');
var router = express.Router();
var async = require('async');
var marked = require('marked');
var posting_repo = require('../repositories/posting');

/* request param procedure */
router.param('permalink', function(req, res, next, permalink) {
  req.permalink = permalink;
  next();
});

/* GET users listing. */
router.route('/:permalink')
  .get(function(req, res, next) {

    async.waterfall([
        /* 1. get posting by permalink */
        function(callback) {
          posting_repo.getPostingByPermalink(req.permalink, callback);
        },
        /* 2. parse posting */
        function(posting, callback) {
          if (posting === null) {
            var e = new Error('page not found');
            e.status = 404;
            callback(e);
            return;
          }

          marked.setOptions({
            renderer: new marked.Renderer(),
            gfm: true,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: false
          });

          /* update md to html */
          var content_md = posting.Content;
          var content_html = marked(content_md);
          posting.Content = content_html;

          /* render html and end request process */
          res.render('posting', {
            posting: posting
          });

          callback(null);
        }
      ],
      /* last callback for DONE or EXCEPT */
      function(e) {
        /* if raise exception while process, lead to err page */
        if (e) {
          console.error(e);
          return next(e);
        }
      });

  });

module.exports = router;
