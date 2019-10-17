import Ajv from 'ajv';
import schema from '../schemas/deanonymize-role-action';
import { getId, arrayify } from '../utils/jsonld';
import { createError } from '../utils/errors';

export default async function deanonymizeRoleAction(
  action,
  { strict = true, user = null, now = new Date().toISOString() } = {}
) {
  const ajv = new Ajv();
  const isValid = ajv.validate(schema, action);
  if (!isValid) {
    throw createError(400, ajv.errorsText());
  }

  const roleId = getId(action.object);

  // acl
  if (
    !user ||
    getId(user) !== getId(action.agent) ||
    !arrayify(user.hasRole).some(role => getId(role) === roleId)
  ) {
    throw createError(403, 'Forbidden');
  }

  const nextUser = await this.getUserByRoleId(roleId);
  // TODO handle conflicts on user on read

  const nextRole = nextUser.hasRole.find(role => getId(role) === roleId);
  if (!nextRole) {
    throw createError(400, 'Cannot find role ${roleId} in ${getId(nextUser)}');
  }
  nextRole['@type'] = 'PublicReviewerRole';

  const resp = await this.users.insert(nextUser, getId(nextUser));

  return Object.assign({}, action, {
    result: Object.assign({}, nextUser, {
      _id: resp.id,
      _rev: resp.rev
    })
  });
}
