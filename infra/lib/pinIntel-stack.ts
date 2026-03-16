import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class PinIntelStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── VPC — public subnets only (no NAT gateway = ~$32/mo saved) ──────────
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
      ],
    });

    // ── ECS Cluster ──────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // ── Backend Docker image ─────────────────────────────────────────────────
    const backendImage = new ecr_assets.DockerImageAsset(this, 'BackendImage', {
      directory: path.join(__dirname, '../../backend'),
    });

    // ── Fargate Task — IAM role grants Bedrock access (no static keys) ───────
    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    taskDef.addToTaskRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0`,
        `arn:aws:bedrock:*::foundation-model/amazon.nova-pro-v1:0`,
        `arn:aws:bedrock:*::foundation-model/amazon.nova-micro-v1:0`,
      ],
    }));

    const logGroup = new logs.LogGroup(this, 'BackendLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── S3 + CloudFront (frontend) — created first so we can pass the URL ────
    const siteBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ── ALB ──────────────────────────────────────────────────────────────────
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(alb.loadBalancerDnsName, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    const frontendUrl = `https://${distribution.distributionDomainName}`;

    // ── Fargate container ────────────────────────────────────────────────────
    taskDef.addContainer('backend', {
      image: ecs.ContainerImage.fromDockerImageAsset(backendImage),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'pinIntel', logGroup }),
      environment: {
        NODE_ENV: 'production',
        PORT: '5000',
        AWS_REGION: this.region,
        AWS_NOVA_LITE_ID: 'us.amazon.nova-lite-v1:0',
        AWS_NOVA_PRO_ID: 'us.amazon.nova-pro-v1:0',
        FRONTEND_URL: frontendUrl,
        // No AWS_ACCESS_KEY_ID — ECS task role provides credentials automatically
      },
      portMappings: [{ containerPort: 5000 }],
    });

    // ── Fargate Service ──────────────────────────────────────────────────────
    const sg = new ec2.SecurityGroup(this, 'BackendSg', { vpc });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5000));

    const service = new ecs.FargateService(this, 'BackendService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: true,
      securityGroups: [sg],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const listener = alb.addListener('Listener', { port: 80 });
    listener.addTargets('BackendTarget', {
      port: 5000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: { path: '/health' },
    });

    // ── Deploy built frontend ────────────────────────────────────────────────
    new s3deploy.BucketDeployment(this, 'FrontendDeploy', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'FrontendUrl', { value: frontendUrl });
    new cdk.CfnOutput(this, 'BackendAlbUrl', { value: `http://${alb.loadBalancerDnsName}` });
  }
}
