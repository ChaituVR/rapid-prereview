/* global index, emit */

const ddoc = {
  _id: '_design/ddoc-docs',
  views: {
    actionsByPreprintId: {
      map: function(doc) {
        if (
          doc.object &&
          (doc['@type'] === 'RapidPREreviewAction' ||
            doc['@type'] === 'RequestForRapidPREreviewAction')
        ) {
          var preprintId = doc.object['@id'] || doc.object;
          if (typeof preprintId === 'string') {
            emit(preprintId, null);
          }
        }
      },
      reduce: '_count'
    },

    byType: {
      map: function(doc) {
        if (
          doc['@type'] === 'AnonymousReviewerRole' ||
          doc['@type'] === 'PublicReviewerRole' ||
          doc['@type'] === 'RapidPREreviewAction' ||
          doc['@type'] === 'RequestForRapidPREreviewAction'
        ) {
          emit(doc['@type'], null);
        }
      },
      reduce: '_count'
    }
  },
  indexes: {
    actions: {
      analyzer: {
        name: 'perfield',
        default: 'english',
        fields: {
          '@id': 'keyword',
          '@type': 'keyword',
          agentId: 'keyword',
          isReported: 'keyword',
          isModerated: 'keyword'
        }
      },
      index: function(doc) {
        if (
          doc['@type'] === 'RapidPREreviewAction' ||
          doc['@type'] === 'RequestForRapidPREreviewAction'
        ) {
          index('@id', doc['@id']);
          index('@type', doc['@type'], { facet: true });
          index('actionStatus', doc.actionStatus, { facet: true });

          var agentId = doc.agent['@id'] || doc.agent;
          if (typeof agentId === 'string') {
            index('agentId', agentId);
          }

          var objectId = doc.object['@id'] || doc.object;
          if (typeof objectId === 'string') {
            index('objectId', agentId);
          }

          var startTime = doc.startTime
            ? new Date(doc.startTime).getTime()
            : new Date('0000').getTime();
          index('startTime', startTime, { facet: true });

          // moderation
          var isReported = false;
          var isModerated = false;
          if (doc.moderationAction) {
            // moderationAction are sorted so last of type wins
            for (var i = doc.moderationAction.length - 1; i >= 0; i--) {
              var moderationAction = doc.moderationAction[i];
              if (
                moderationAction['@type'] === 'IgnoreReportRapidPREreviewAction'
              ) {
                isReported = false;
                break;
              } else if (
                moderationAction['@type'] === 'ModerateRapidPREreviewAction'
              ) {
                isReported = false;
                isModerated = true;
                break;
              } else if (
                moderationAction['@type'] === 'ReportRapidPREreviewAction'
              ) {
                isReported = true;
                break;
              }
            }
          }

          index('isReported', isReported.toString(), {
            facet: true
          });
          index('isModerated', isModerated.toString(), {
            facet: true
          });
        }
      }
    },

    roles: {
      analyzer: {
        name: 'perfield',
        default: 'english',
        fields: {
          '@type': 'keyword',
          '@id': 'keyword',
          isRoleOf: 'keyword'
        }
      },
      index: function(doc) {
        if (
          doc['@type'] === 'PublicReviewerRole' ||
          doc['@type'] === 'AnonymousReviewerRole'
        ) {
          index('@id', doc['@id']);
          index('@type', doc['@type'], { facet: true });

          if (doc.name) {
            index('name', doc.name);
          }

          if (doc.isRoleOf) {
            index('isRoleOfId', doc.isRoleOf);
          }

          var startDate = doc.startDate
            ? new Date(doc.startDate).getTime()
            : new Date('0000').getTime();
          index('startDate', startDate, { facet: true });
        }
      }
    }
  }
};

export default ddoc;
