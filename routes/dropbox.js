/**
 * Created by zina on 2014-07-17.
 */

var express = require('express');
var fs = require('fs');
var router = express.Router();
var Dropbox = require("dropbox");
var dropbox_config = require('../config').dropbox_config;
var path = require('path');
var async = require('async');
var crawler_repo = require('../repositories/crawler');
var posting_repo = require('../repositories/posting');
var posting_model = require('../models/posting');

/* extend path */
path.onlyname = path.onlyname || function(_p) {
  return path.basename(_p, path.extname(_p));
};

router.route('/notification')

  /* echo notification challenge */
  .get(function(req, res, next) {
    res.send(req.param('challenge'));
  })


  /* process notification */
  .post(function(req, res, next) {

    var current_cursor = '';
    var dbx_client = null;

    async.waterfall([
        /* 1. get the cursor from db */
        function(callback) {
          crawler_repo.getCursor(callback);
        },
        /* 2. connect and authentication to dropbox */
        function(cursor, callback) {
          current_cursor = cursor;
          console.log(current_cursor);

          var client = new Dropbox.Client({
            key: dropbox_config.api_key,
            secret: dropbox_config.api_secret,
            token: dropbox_config.access_token
          });

          client.authenticate({interactive: false}, callback);
        },
        /* 3. get delta from dropbox with cursor */
        function(dbx, callback) {
          dbx_client = dbx;
          dbx.delta(current_cursor, callback);
        },
        /* 4. crwal from dropbox to local system */
        function(dt, callback) {
          runCrawl(current_cursor, dt, dbx_client, callback);
        }
      ],
      /* last callback for DONE or EXCEPT */
      function(e, result) {
        res.send();
      });
  });



/* crawl_callback(err) */
var runCrawl = function(cursor, dt, dbx, crawl_callback) {
  for (var i = 0; i < dt.changes.length; i++) {
    var dtl = dt.changes[i];

    /* if stat is null, that was removed */
    if (dtl.stat === null) {
      /* if that was removed one, can retrive information for stat function */
      dbx.stat(dtl.path, {removed: true}, function(e, stat) {
        /* if it's not a file, nothing to need */
        if (!stat.isFile) {
          return;
        }

        /* is the file in md_folder? and md extension file? */
        if (path.relative(path.dirname(stat.path), dropbox_config.md_path) == '' && path.extname(stat.path) == '.md') {
          console.log('deleted markdown : ' + stat.path);
          syncRemovedMarkdown(stat, dbx);
        }
        /* is the file in md_folder? and json extension file? */
        else if (path.relative(path.dirname(dtl.path), dropbox_config.md_path) == '' && path.extname(dtl.path) == '.json') {
          syncRemovedJson(stat, dbx);
        }
        /* nothing to do for resource file removed, never delete */
      });

      continue;
    }

    /* if it's not a file, nothing to need */
    if (!dtl.stat.isFile) {
      continue;
    }

    /* is the file in md_folder? and md extension file? */
    if (path.relative(path.dirname(dtl.path), dropbox_config.md_path) == '' && path.extname(dtl.path) == '.md') {
      console.log('updated or created markdown : ' + dtl.path);
      syncChangedMarkdown(dtl.stat, dbx);
    }
    /* is the file in md_folder? and json extension file? */
    else if (path.relative(path.dirname(dtl.path), dropbox_config.md_path) == '' && path.extname(dtl.path) == '.json') {
      console.log('updated or created json : ' + dtl.path);
      syncChangedJson(dtl.stat, dbx);
    }
    /* is the file in resource_folder? */
    else if (path.relative(path.dirname(dtl.path), dropbox_config.resource_path) == '') {
      console.log('updated or created json : ' + dtl.path);
      syncChangedResource(dtl.stat, dbx);
    }
  }

  crawl_callback(null);
};


var makePathToPermalink = function(pathstring) {
  var name = path.onlyname(pathstring);
  return name.replace(/ /g, '-');
};


var syncChangedMarkdown = function(stat, dbx) {
  async.waterfall([
      /* 1. read markdown file */
      function(callback) {
        dbx.readFile(stat.path, callback);
      },
      /* 2. make posting and check json property file */
      function(content, stat, range, callback) {
        var posting = new posting_model();
        posting.Permalink = makePathToPermalink(stat.path);
        posting.Subject = path.onlyname(stat.path);
        posting.OriginFilename = stat.name;
        posting.Content = content;

        /* find json file */
        dbx.search(path.dirname(stat.path), path.onlyname(stat.path) + '.json', function(e, json_stats) {
          if (e) { callback(null, null, posting); return; }
          callback(null, json_stats, posting);
        });
      },
      /* 3. if find json property file, overwrite posting property */
      function(maybe_json_stats, posting, callback) {
        if (maybe_json_stats === null) {
          /* check arguments, find json or not */
          callback(null, posting);
          return;
        }

        if (maybe_json_stats.length == 1) {
          var json_stat = maybe_json_stats[0];

          /* read exists json file, and overwrite to posting */
          dbx.readFile(json_stat.path, function(e, content, stat, range) {
            if (e) { callback(e); return; }

            var json_obj = JSON.parse(content);

            if (typeof(json_obj.permalink) != 'undefined') {
              posting.Permalink = json_obj.permalink;
            }
            if (typeof(json_obj.subject) != 'undefined') {
              posting.Subject = json_obj.subject;
            }
            if (typeof(json_obj.is_published) != 'undefined') {
              posting.IsPublished = json_obj.is_published;
            }

            callback(null, posting);
          });
        }
        /* THIS ELSE STATEMENT IS VERY IMPORTANT! (ASYNC) */
        else {
          callback(null, posting);
        }
      },
      /* 4. save or update posting to db */
      function(posting, callback) {
        posting_repo.savePostingByFilename(posting, callback);
      },
      /* 5. update cursor */
      function(callback) {
        crawler_repo.setCursor(stat.cursor(), callback);
      }
    ],
    function(e) {
      if (e) {
        console.error(e);
      }
    });
};

var syncChangedJson = function(stat, dbx) {
  var maybe_markdown = path.onlyname(stat.path) + '.md';
  posting_repo.getPostingByFilename(maybe_markdown, function(e, posting) {
    if (e) {
      console.error(e);
      return;
    }
    /* update posting property when only exist markdown */
    if (posting === null) {
      return;
    }

    async.waterfall([
        /* 1. read json file */
        function(callback) {
          dbx.readFile(stat.path, callback);
        },
        /* update posting property */
        function(json_content, callback) {
          var json_obj = JSON.parse(json_content);

          if (typeof(json_obj.permalink) != 'undefined') {
            posting.Permalink = json_obj.permalink;
          }
          if (typeof(json_obj.subject) != 'undefined') {
            posting.Subject = json_obj.subject;
          }
          if (typeof(json_obj.is_published) != 'undefined') {
            posting.IsPublished = json_obj.is_published;
          }

          posting_repo.updatePostingPropertyByFilename(posting, callback);
        }
      ],
      function(e) {
        console.error(e);
      });
  });
};

var syncChangedResource = function(stat, dbx) {
  /* resource file is only created or updated, never deleted */
  var resource_path = process.cwd();
  ///TODO: hard coded resource path
  resource_path = path.join(resource_path, 'public/resource', stat.name);

  async.waterfall([
      /* 1. read(download) file as buffer */
      function(callback) {
        dbx.readFile(stat.path, {buffer: true}, callback);
      },
      /* 2. save to disk */
      function(content, stat, range, callback) {
        //console.log(content);
        fs.writeFile(resource_path, content, {encoding: 'binary'}, callback);
      }
    ],
    function(e) {
      if (e) {
        console.error(e);
      }
    });
};

var syncRemovedMarkdown = function(stat, dbx) {
  posting_repo.deletePostingByFilename(stat.name, function(e) {
    if (e) {
      console.error(e);
    }
  });
};

var syncRemovedJson = function(stat, dbx) {
  /* return to default property */
  var maybe_markdown = path.onlyname(stat.path) + '.md';

  async.waterfall([
      /* 1. get posting by markdown filename */
      function(callback) {
        posting_repo.getPostingByFilename(maybe_markdown, callback);
      },
      /* 2. if exists, set property to default */
      function(posting, callback) {
        if (posting === null) {
          callback(null);
          return;
        }

        console.log('updated json : ' + stat.path);

        posting.Permalink = makePathToPermalink(posting.OriginFilename);
        posting.Subject = path.onlyname(posting.OriginFilename);
        posting.IsPublished = true;

        posting_repo.updatePostingPropertyByFilename(posting, callback);
      }
    ],
    function(e) {
      if (e) {
        console.error(e);
      }
    });
};


module.exports = router;