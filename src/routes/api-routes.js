import { Router } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';
import { createError } from '../utils/errors';
import parseQuery from '../middlewares/parse-query';
import resolve from '../utils/resolve';

const jsonParser = bodyParser.json({ limit: '2mb' });

const router = new Router({ caseSensitive: true });

/**
 * Search for preprints with reviews or requests for reviews
 */
router.get('/preprint', cors(), parseQuery, (req, res, next) => {
  res.setHeader('content-type', 'application/json');

  let hasErrored = false;

  const s = req.db.streamPreprints(req.query);
  s.on('error', err => {
    if (!hasErrored) {
      hasErrored = true;
      next(err);
    }

    try {
      s.destroy();
    } catch (err) {
      // noop
    }
  });

  s.pipe(res);
});

/**
 * Get a preprint
 */
router.get('/preprint/:preprintId', cors(), async (req, res, next) => {
  try {
    const body = await req.db.get(`preprint:${req.params.preprintId}`);
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * Search for reviews
 */
router.get('/review', parseQuery, (req, res, next) => {
  next(createError(500, 'Not implemented yet'));
});

/**
 * Get a review
 */
router.get('/review/:reviewId', async (req, res, next) => {
  try {
    const body = await req.db.get(`review:${req.params.reviewId}`);
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * Search for requests
 */
router.get('/request', parseQuery, (req, res, next) => {
  next(createError(500, 'Not implemented yet'));
});

/**
 * Get a request
 */
router.get('/request/:requestId', async (req, res, next) => {
  try {
    const body = await req.db.get(`request:${req.params.requestId}`);
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * Search for users
 */
router.get('/user', parseQuery, (req, res, next) => {
  next(createError(500, 'Not implemented yet'));
});

/**
 * Get a user
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const body = await req.db.get(`user:${req.params.userId}`);
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * Search for roles
 */
router.get('/role', cors(), parseQuery, (req, res, next) => {
  next(createError(500, 'Not implemented yet'));
});

/**
 * Get a role
 */
router.get('/role/:roleId', cors(), async (req, res, next) => {
  try {
    const body = await req.db.get(`role:${req.params.roleId}`);
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// TODO /avatar/:roleId
// Get the avatar associated with the `roleId`

/**
 * Post an action (side effects)
 */
router.post('/action', cors(), jsonParser, async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next(createError(401, 'Login required'));
  }

  try {
    const body = await req.db.post(req.body, { user: req.user });
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * Search for actions
 */
router.get('/action', cors(), parseQuery, (req, res, next) => {
  res.setHeader('content-type', 'application/json');

  let hasErrored = false;

  const s = req.db.streamActions(req.query);
  s.on('error', err => {
    if (!hasErrored) {
      hasErrored = true;
      next(err);
    }

    try {
      s.destroy();
    } catch (err) {
      // noop
    }
  });

  s.pipe(res);
});

/**
 * Resolve (get metadata) for an identifier passed as query string paramenter
 * `identifier` (wrapped in `encodeURIComponent)
 */
router.get('/resolve', cors(), async (req, res, next) => {
  const { identifier } = req.query;
  if (!identifier) {
    return next(createError(400, 'missing identifier query string parameter'));
  }

  const { config } = req.app.locals;

  try {
    const data = await resolve(identifier, config);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * On mobile <object /> doesn't work so we use react-pdf to render the PDF =>
 * due to cross origin restriction we need to proxy the PDF
 */
router.get('/pdf', async (req, res, next) => {
  const pdfUrl = req.query.url;

  let r;
  try {
    r = await fetch(pdfUrl, {
      method: 'GET'
    });
  } catch (err) {
    return next(err);
  }

  if (r.ok) {
    r.body.pipe(res);
  } else {
    next(createError(r.status));
  }
});

export default router;
