/**
 * Created by zina on 2014-07-18.
 */

var express = require('express');
var router = express.Router();
var async = require('async');
var posting_repo = require('../repositories/posting');
var main_paging_config = require('../config').main_paging;

/* GET home page. */
router.get('/', function(req, res) {
  async.waterfall([
      function(callback) {
        posting_repo.getPostingPageList(main_paging_config.thread_count, callback);
      },
      function(postings, callback) {
        res.render('index', {page_posting_list: postings});
        callback(null);
      }
    ],
    function(e) {
      if (e) {
        console.error(e);
        return next(e);
      }
    });
});

module.exports = router;