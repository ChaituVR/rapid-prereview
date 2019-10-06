import assert from 'assert';
import fetch from 'node-fetch';
import {
  createPreprintServer,
  createConfig
} from './utils/create-preprint-server';

describe('auth', function() {
  this.timeout(40000);

  let server;
  const port = 3333;
  const config = createConfig(port);
  const baseUrl = `http://127.0.0.1:${port}`;

  before(done => {
    server = createPreprintServer(config);
    server.listen(port, done);
  });

  it('should login with orcid', async () => {
    const res = await fetch(`${baseUrl}/auth/orcid/callback`, {
      redirect: 'manual',
      follow: 0
    });

    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), `${baseUrl}/`);
    const cookie = res.headers.raw()['set-cookie'][0];
    assert(cookie);
  });

  after(done => {
    server.close(done);
  });
});
