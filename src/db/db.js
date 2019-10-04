import Cloudant from '@cloudant/cloudant';
import uniqBy from 'lodash/uniqBy';
import handleRegisterAction from './handle-register-action';
import handleRapidPrereviewAction from './handle-rapid-prereview-action';
import handleDeanonimyzeRoleAction from './handle-deanonymize-role-action';
import handleRequestForRapidPrereviewAction from './handle-request-for-rapid-prereview-action';
import ddocDocs from '../ddocs/ddoc-docs';
import ddocUsers from '../ddocs/ddoc-users';
import ddocIndex from '../ddocs/ddoc-index';
import { getId, cleanup, arrayify } from '../utils/jsonld';
import { createError } from '../utils/errors';
import { INDEXED_PREPRINT_PROPS } from '../constants';

export default class DB {
  constructor(config = {}) {
    this.config = config;

    const username =
      this.config.couchUsername || process.env.COUCH_USERNAME || 'admin';
    const password =
      this.config.couchPassword || process.env.COUCH_PASSWORD || 'pass';
    const protocol =
      this.config.couchProtocol || process.env.COUCH_PROTOCOL || 'http:';
    const host = this.config.couchHost || process.env.COUCH_HOST || '127.0.0.1';
    const port = this.config.couchPort || process.env.COUCH_PORT || '5984';

    this.docsDbName =
      this.config.couchDocsDbName ||
      process.env.COUCH_DOCS_DB_NAME ||
      'rapid-prereview-docs';
    this.indexDbName =
      this.config.couchIndexDbName ||
      process.env.COUCH_INDEX_DB_NAME ||
      'rapid-prereview-index';
    this.usersDbName =
      this.config.couchUsersDbName ||
      process.env.COUCH_USERS_DB_NAME ||
      'rapid-prereview-users';

    const cloudant = new Cloudant({
      username,
      password,
      url: `${protocol}//${host}:${port}`
    });

    this.cloudant = cloudant;
    this.docs = cloudant.use(this.docsDbName);
    this.index = cloudant.use(this.indexDbName);
    this.users = cloudant.use(this.usersDbName);
  }

  async init({ reset = false } = {}) {
    async function setup(dbName) {
      if (reset) {
        try {
          await this.cloudant.db.destroy(dbName);
        } catch (err) {
          if (err.error !== 'not_found') {
            throw err;
          }
        }
      }

      let resp;
      try {
        resp = await this.cloudant.db.create(dbName);
      } catch (err) {
        if (err.error !== 'file_exists') {
          throw err;
        }
      }

      return Object.assign({ dbName }, resp);
    }

    return Promise.all([
      setup.call(this, this.docsDbName),
      setup.call(this, this.indexDbName),
      setup.call(this, this.usersDbName)
    ]);
  }

  async ddoc() {
    function toUnnamedString(f) {
      const str = f.toString();
      // we remove the function name as it creates issue
      return 'function ' + str.slice(str.indexOf('('));
    }

    function stringify(ddoc) {
      return Object.keys(ddoc).reduce((sddoc, key) => {
        const value = ddoc[key];
        if (key === 'indexes') {
          sddoc[key] = Object.keys(value).reduce((sindexes, name) => {
            sindexes[name] = Object.assign({}, value[name], {
              index: toUnnamedString(value[name].index)
            });
            return sindexes;
          }, {});
        } else if (key === 'views') {
          sddoc[key] = Object.keys(value).reduce((sviews, name) => {
            sviews[name] = Object.assign({}, value[name], {
              map: toUnnamedString(value[name].map)
            });
            return sviews;
          }, {});
        } else {
          sddoc[key] = value;
        }
        return sddoc;
      }, {});
    }

    const resps = await Promise.all([
      this.docs.insert(stringify(ddocDocs)),
      this.users.insert(stringify(ddocUsers)),
      this.index.insert(stringify(ddocIndex))
    ]);
    return resps;
  }

  async secure() {
    // TODO see https://cloud.ibm.com/docs/services/Cloudant?topic=cloudant-authorization
    // and set_security method
    // we make the docs DB public for read
  }

  async get(id, { user = null } = {}) {
    const [prefix] = id.split(':');

    switch (prefix) {
      case 'user': {
        const doc = await this.users.get(id);
        if (getId(user) === getId(doc)) {
          return doc;
        } else {
          // we need to remove the anonymous roles
          return cleanup(
            Object.assign({}, doc, {
              hasRole: arrayify(doc.hasRole).filter(
                role => role['@type'] !== 'AnonymousReviewerRole'
              )
            }),
            { removeEmptyArray: true }
          );
        }
      }

      case 'role': {
        const user = await this.getUserByRoleId(id);
        return arrayify(user.hasRole).find(role => getId(role) === id);
      }

      case 'review':
      case 'request':
        return this.docs.get(id);

      case 'preprint':
        return this.index.get(id);
    }
  }

  // views
  async getUserByRoleId(roleId) {
    roleId = getId(roleId);
    const body = await this.users.view('ddoc-users', 'usersByRoleId', {
      key: roleId,
      include_docs: true,
      reduce: false
    });

    const row = body.rows[0];
    if (!row) {
      throw createError(404, `Not found (${roleId})`);
    }

    return row.doc;
  }

  // search
  async searchPreprints(query, { user = null } = {}) {}
  async searchReviews(query, { user = null } = {}) {}
  async searchRequests(query, { user = null } = {}) {}

  async syncIndex(action, { now = new Date().toISOString() } = {}) {
    // we compact the action to reduce the space used by the index
    action = Object.keys(action).reduce((compacted, key) => {
      switch (key) {
        case 'agent':
        case 'object':
          compacted[key] = getId(action[key]);
          break;

        case 'resultReview':
          compacted[key] = cleanup(
            Object.assign({}, action[key], {
              reviewAnswer: arrayify(action[key].reviewAnswer).map(answer =>
                Object.assign({}, answer, {
                  parentItem: getId(answer.parentItem)
                })
              )
            }),
            { removeEmptyArray: true }
          );
          break;

        default:
          compacted[key] = action[key];
          break;
      }

      return compacted;
    }, {});

    const docId = getId(action.object);
    const body = await this.index.get(docId, { open_revs: 'all' });
    const docs = body.filter(entry => entry.ok && !entry.ok._deleted);

    // merge all leaf docs (conflicting)
    const merged = docs.reduce((merged, doc) => {
      // score: latest wins

      // indexed preprint props, latest wins

      // potential action, we merge all distincts
      merged.potentialAction = uniqBy(
        arrayify(merged.potentialAction).concat(arrayify(doc.potentialAction)),
        getId
      );
    }, {});

    // add action to the merged document

    // bulk update
  }

  async updateScores({ now = new Date().toISOString() } = {}) {}

  async post(
    action,
    { user = null, strict = true, now = new Date().toISOString() } = {}
  ) {
    if (!action['@type']) {
      throw createError(400, 'action must have a @type');
    }

    switch (action['@type']) {
      case 'RegisterAction':
        return handleRegisterAction.call(this, action, { strict, now });

      case 'CreateRoleAction':
        // TODO
        break;

      case 'UpdateRoleAction':
        // TODO
        break;

      case 'DeanonymizeRoleAction':
        return handleDeanonimyzeRoleAction.call(this, action, {
          strict,
          user,
          now
        });

      case 'RapidPREreviewAction':
        return handleRapidPrereviewAction.call(this, action, {
          strict,
          user,
          now
        });

      case 'RequestForRapidPREreviewAction':
        return handleRequestForRapidPrereviewAction.call(this, action, {
          strict,
          user,
          now
        });

      default:
        throw createError(400, `invalid action @type ${action['@type']}`);
    }
  }
}
