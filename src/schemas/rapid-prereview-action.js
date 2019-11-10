const schema = {
  $id: 'https://rapid.prereview.org/schemas/rapid-prereview-action.json',
  definitions: {
    text: {
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          properties: {
            '@type': {
              type: 'string',
              const: 'rdf:HTML'
            },
            '@value': {
              type: 'string'
            }
          },
          required: ['@type', '@value']
        }
      ]
    }
  },

  type: 'object',
  properties: {
    '@id': {
      type: 'string',
      pattern: '^review:'
    },
    '@type': {
      type: 'string',
      const: 'RapidPREreviewAction'
    },
    actionStatus: {
      type: 'string',
      enum: [
        'PotentialActionStatus',
        'ActiveActionStatus',
        'CompletedActionStatus',
        'ModeratedActionStatus',
        'FailedActionStatus'
      ]
    },
    agent: {
      type: 'string',
      pattern: '^role:'
    },
    startTime: {
      type: 'string',
      format: 'date-time'
    },
    endTime: {
      type: 'string',
      format: 'date-time'
    },
    object: {
      oneOf: [
        {
          type: 'string',
          pattern: '^doi:|^arXiv:'
        },
        {
          type: 'object',
          properties: {
            '@id': {
              type: 'string',
              pattern: '^doi:|^arXiv:'
            },
            '@type': { type: 'string', const: 'ScholarlyPreprint' },
            doi: {
              type: 'string'
            },
            arXivId: {
              type: 'string'
            },
            name: { $ref: '#/definitions/text' },
            datePosted: {
              type: 'string',
              format: 'date-time'
            },
            preprintServer: {
              type: 'object',
              properties: {
                '@type': { type: 'string', const: 'PreprintServer' },
                name: { type: 'string' }
              }
            }
          }
        }
      ]
    },
    resultReview: {
      type: 'object',
      properties: {
        '@id': {
          type: 'string',
          pattern: '^node:|^_:'
        },
        '@type': {
          type: 'string',
          const: 'RapidPREreview'
        },
        dateCreated: {
          type: 'string',
          format: 'date-time'
        },
        about: {
          type: 'array',
          description: 'subjects from list of infectious diseases',
          items: {
            type: 'object',
            properties: {
              '@type': {
                type: 'string',
                const: 'OutbreakScienceEntity'
              },
              name: {
                type: 'string'
              }
            }
          }
        },
        reviewAnswer: {
          type: 'array',
          items: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  '@type': { type: 'string', const: 'Answer' },
                  parentItem: {
                    oneOf: [
                      {
                        type: 'string',
                        pattern: '^question:'
                      },
                      {
                        type: 'object',
                        properties: {
                          '@id': {
                            type: 'string',
                            pattern: '^question:'
                          },
                          '@type': {
                            type: 'string',
                            const: 'Question'
                          },
                          text: { $ref: '#/definitions/text' }
                        },
                        required: ['@type', 'text']
                      }
                    ]
                  },
                  text: { $ref: '#/definitions/text' }
                }
              },

              {
                type: 'object',
                properties: {
                  '@type': { type: 'string', const: 'YesNoAnswer' },
                  parentItem: {
                    oneOf: [
                      {
                        type: 'string',
                        pattern: '^question:'
                      },
                      {
                        type: 'object',
                        properties: {
                          '@id': {
                            type: 'string',
                            pattern: '^question:'
                          },
                          '@type': {
                            type: 'string',
                            const: 'YesNoQuestion'
                          },
                          text: { $ref: '#/definitions/text' },
                          suggestedAnswer: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                '@type': {
                                  type: 'string',
                                  const: 'Answer'
                                },
                                text: {
                                  type: 'string'
                                }
                              },
                              required: ['@type', 'text']
                            }
                          }
                        },
                        required: ['@type', 'text']
                      }
                    ]
                  },
                  text: { $ref: '#/definitions/text' }
                }
              }
            ]
          }
        }
      },
      additionalProperties: false,
      required: ['@type', 'reviewAnswer']
    }
  },
  additionalProperties: false,
  required: ['@type', 'actionStatus', 'agent', 'object', 'resultReview']
};

export default schema;
