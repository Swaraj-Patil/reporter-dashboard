const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Reporter Dashboard API',
      version: '1.0.0',
      description: 'API documentation for the Reporter Dashboard application',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            external_id: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            status: { type: 'string' },
            source: { type: 'string' },
            reporter: { type: 'string' },
            privacy_enabled: { type: 'boolean' },
            comment_count: { type: 'integer' },
            impact_count: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        TicketDetail: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            external_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            summary: { type: 'string' },
            status: { type: 'string' },
            source: { type: 'string' },
            reporter: { type: 'string' },
            privacy_enabled: { type: 'boolean' },
            comments: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Comment'
              }
            },
            impacts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ImpactEvent'
              }
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            author_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        ImpactEvent: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            description: { type: 'string' },
            admin_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'] // Path to the API route files
};

module.exports = swaggerJsdoc(options);