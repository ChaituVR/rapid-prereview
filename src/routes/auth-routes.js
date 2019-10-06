import { Router } from 'express';
import passport from 'passport';

const router = new Router({ caseSensitive: true });

// start authenticating with ORCID
router.get('/orcid/login', passport.authenticate('orcid'));

// finish authenticating with ORCID
router.get(
  '/orcid/callback',
  passport.authenticate('orcid', {
    successRedirect: '/',
    failureRedirect: '/error'
  })
);

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

export default router;
