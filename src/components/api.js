import React, { Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { CONTACT_EMAIL_HREF } from '../constants';
import APISection from './api-section';

export default function API() {
  return (
    <article className="api">
      <Helmet>
        <title>Rapid PREreview • API documentation</title>
      </Helmet>

      <h1>Public API documentation</h1>

      <APISection
        id="get-review"
        title={
          <Fragment>
            GET <code>/api/review/:id</code>
          </Fragment>
        }
      >
        <p>
          Get a review by <code>id</code>.
        </p>
      </APISection>

      <APISection
        id="get-request"
        title={
          <Fragment>
            GET <code>/api/request/:id</code>
          </Fragment>
        }
      >
        <p>
          Get a request for review by <code>id</code>.
        </p>
      </APISection>

      <APISection
        id="get-user"
        title={
          <Fragment>
            GET <code>/api/user/:id</code>
          </Fragment>
        }
      >
        <p>
          Get a (public) user by <code>id</code>. Note that anonymous roles are
          never returned in order to preserve their anonymity.
        </p>
      </APISection>

      <APISection
        id="get-role"
        title={
          <Fragment>
            GET <code>/api/role/:id</code>
          </Fragment>
        }
      >
        <p>
          Get a role (persona) by <code>id</code>.
        </p>
      </APISection>

      <APISection
        id="get-question"
        title={
          <Fragment>
            GET <code>/api/question/:id</code>
          </Fragment>
        }
      >
        <p>
          Get a question by <code>id</code>.
        </p>
      </APISection>

      <APISection
        id="search-action"
        title={
          <Fragment>
            GET <code>/api/action</code>
          </Fragment>
        }
      >
        <p>
          Search actions (<code>RequestForRapidPREreviewAction</code>,{' '}
          <code>RapidPREreviewAction</code>).
        </p>

        <p>
          Queries can be issued using the{' '}
          <a href="http://lucene.apache.org/core/4_3_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#Overview">
            Lucene Query Parser Syntax
          </a>{' '}
          using the <code>q</code> query string parameter. Results are returned
          by batch controled by the <code>limit</code> querystring parameter.
          Pagination is handled through a <code>bookmark</code> value that needs
          to be passed as a query string parameter (<code>bookmark</code>) to
          get to the next batch.
        </p>

        <table>
          <caption>Indexed fields:</caption>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>@id</code>
              </td>
              <td>The action identifier</td>
              <td>
                <CURIE />
              </td>
            </tr>

            <tr>
              <td>
                <code>@type</code>
              </td>
              <td>The action type</td>
              <td>
                One of <code>RequestForRapidPREreviewAction</code>,{' '}
                <code>RapidPREreviewAction</code>
              </td>
            </tr>

            <tr>
              <td>
                <code>agentId</code>
              </td>
              <td>The identifier of the agent</td>
              <td>
                <CURIE /> (role id)
              </td>
            </tr>

            <tr>
              <td>
                <code>objectId</code>
              </td>
              <td>The identifier of the object of the action</td>
              <td>
                <CURIE /> made of the prefix <code>preprint:</code> followed by
                the string <code>arxiv</code> or <code>doi</code> followed by a
                dash (<code>-</code>) followed by a modified version of the DOI
                or arXivID where <code>/</code> are replaced by <code>-</code>
              </td>
            </tr>

            <tr>
              <td>
                <code>startTime</code>
              </td>
              <td>The date and time when the action was posted</td>
              <td>
                Number of milliseconds since the{' '}
                <a href="https://en.wikipedia.org/wiki/Unix_time">Unix Epoch</a>
              </td>
            </tr>
          </tbody>
        </table>
      </APISection>

      <section>
        <h2 id="replication">Replication</h2>

        <p>
          One time or continuous (live) replication of the full dataset is
          possible through the{' '}
          <a href="http://docs.couchdb.org/en/master/replication/protocol.html">
            CouchDB replication protocol
          </a>
          .
        </p>

        <p>
          <a href={CONTACT_EMAIL_HREF}>Contact us</a> with your use case if you
          are interested.
        </p>
      </section>
    </article>
  );
}

function CURIE() {
  return <a href="https://www.w3.org/TR/2010/NOTE-curie-20101216/">CURIE</a>;
}
