import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "serverless-generate-certificate",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild", "serverless-dynamodb", "serverless-offline"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "us-east-1", // Default
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["dynamodb:*"],
        Resource: ["*"],
      },
      {
        Effect: "Allow",
        Action: ["s3:*"],
        Resource: ["*"],
      },
    ],
  },
  // import the function via paths
  functions: {
    generateCertificate: {
      handler: "src/functions/generateCertificate.handler",
      events: [
        {
          http: {
            path: "generateCertificate",
            method: "post",
            cors: true,
          },
        },
      ],
    },
    verifyCertificate: {
      handler: "src/functions/verifyCertificate.handler",
      events: [
        {
          http: {
            path: "verifyCertificate/{id}",
            method: "get",
            cors: true,
          },
        },
      ],
    },
  },
  package: { individually: false, include: ["./src/templates/**"] },
  custom: {
    esbuild: {
      external: ["chrome-aws-lambda"],
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
    dynamodb: {
      stages: ["dev", "local"],
      start: {
        port: 8000,
        inMemory: true,
        migrate: true,
      },
    },
  },
  resources: {
    Resources: {
      dbCertificateUsers: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "users_certificate",
          ProvisionedThroughput: {
            ReadCapacityUnits: 5, // Requisições por segundo
            WriteCapacityUnits: 5, // Inserções por segundo
          },
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
