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
    thread_count: 20
  },

  /* remote dropbox path configuration */
  dropbox_config: {
    /* authentication configuration */
    api_key: 'api key here',
    api_secret: 'api secret here',
    access_token: 'access token here',

    /* remote dropbox path information */
    md_path: '/md',
    resource_path: '/md/resource'
  }
};

module.exports = config;