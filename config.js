/**
 * Created by zina on 2014-07-17.
 */

var config = {
  /* set db connection information */
  db_connection: {
    host: 'localhost',
    user: 'root',
    password: 'dnjem!1',
    database: 'zbeejs'
  },

  /* main page paging attributes */
  main_paging: {
    thread_count: 6
  },

  /* remote dropbox path configuration */
  dropbox_config: {
    /* authentication configuration */
    api_key: 'p521r5bjf5zb1le',
    api_secret: 'qjohsl8mh405vah',
    access_token: 'No5rhkmJmoYAAAAAAAAASA-WgHc-3HLDbtiLn9USVgjc8GMYzOT-H0xhynm8EDkj',

    /* remote dropbox path information */
    md_path: '/md',
    resource_path: '/resource'
  }
};

module.exports = config;