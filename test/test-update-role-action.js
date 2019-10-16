import assert from 'assert';
import DB from '../src/db/db';
import { getId } from '../src/utils/jsonld';
import { createRandomOrcid } from '../src/utils/orcid';

describe('UpdateRoleAction', function() {
  this.timeout(40000);

  let user;
  const db = new DB();

  before(async () => {
    const action = await db.post({
      '@type': 'RegisterAction',
      actionStatus: 'CompletedActionStatus',
      agent: {
        '@type': 'Person',
        orcid: createRandomOrcid(),
        name: 'Peter Jon Smith'
      }
    });

    user = action.result;
  });

  it('should update a role', async () => {
    const action = await db.post(
      {
        '@type': 'UpdateRoleAction',
        agent: getId(user),
        actionStatus: 'CompletedActionStatus',
        object: getId(user.hasRole[0]),
        payload: {
          name: 'updated name'
        }
      },
      { user }
    );

    // console.log(require('util').inspect(action, { depth: null }));

    assert.equal(action.result.hasRole[0].name, 'updated name');
  });
});
