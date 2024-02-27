import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as aws_ecr from "aws-cdk-lib/aws-ecr";
import { aws_wafv2 as wafv2, CfnOutput } from "aws-cdk-lib";
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as rds from 'aws-cdk-lib/aws-rds'
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as imagedeploy from 'cdk-docker-image-deployment';

interface AppRunnerStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  containerRepository: aws_ecr.Repository;
  rdsV2: rds.DatabaseCluster;
}

export class AppRunnerStack extends cdk.Stack {

  public readonly vpc: Vpc;
  public readonly containerRepository: aws_ecr.Repository;
  public readonly rdsV2: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: AppRunnerStackProps) {
    super(scope, id, props);

    // Create VPC Connector for App Runner
    const vpcConnector = new apprunner.VpcConnector(this, 'VpcConnector', {
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }),
      vpcConnectorName: 'VpcConnector',
    });

    // Add Inbound rule from App Runner
    vpcConnector.connections.allowTo(props.rdsV2.connections, ec2.Port.tcp(3306));

    const appEnv = new ssm.StringParameter(this, 'appEnv', {
      parameterName: 'appEnv',
      stringValue: 'testing',
    });

    //Define env in Secrets Manager 
    let appKeyArn = this.node.tryGetContext('appKeyArn')
    if (appKeyArn == undefined)
      appKeyArn = "arn:aws:secretsmanager:ap-northeast-1:************:secret:AppKey"

    const appKey = sm.Secret.fromSecretAttributes(this, "appKey", {
      secretPartialArn:
        appKeyArn,
    });

    // Define env in SSM Parameter Store
    const appDebug = new ssm.StringParameter(this, 'appDebug', {
      parameterName: 'appDebug',
      stringValue: 'true',
    });

    const logChannel = new ssm.StringParameter(this, 'logChannel', {
      parameterName: 'logChannel',
      stringValue: 'stdout',
    });

    const repo = aws_ecr.Repository.fromRepositoryName(this,
      'App-Runner-Repo',
      props.containerRepository.repositoryName
    )

    // Create Docker Image
    new imagedeploy.DockerImageDeployment(
      this,
      "AppRunnerImage",
      {
        source: imagedeploy.Source.directory(
          path.join(__dirname, '../../app/docker/web'),
        ),
        destination: imagedeploy.Destination.ecr(repo, {
          tag: "latest",
        }),
      }
    );

    // Create App Runner Service
    const appRunner = new apprunner.Service(this, 'Service', {
      serviceName: `NoteApp`,
      autoDeploymentsEnabled: true,
      source: apprunner.Source.fromEcr({
        imageConfiguration: {
          port: 80,
          environmentSecrets: {
            DB_CONNECTION: apprunner.Secret.fromSecretsManager(props.rdsV2.secret!, "engine"),
            DB_HOST: apprunner.Secret.fromSecretsManager(props.rdsV2.secret!, "host"),
            DB_PORT: apprunner.Secret.fromSecretsManager(props.rdsV2.secret!, "port"),
            DB_DATABASE: apprunner.Secret.fromSecretsManager(props.rdsV2.secret!, "dbname"),
            DB_USERNAME: apprunner.Secret.fromSecretsManager(props.rdsV2.secret!, "username"),
            DB_PASSWORD: apprunner.Secret.fromSecretsManager(props.rdsV2.secret!, "password"),
            APP_KEY: apprunner.Secret.fromSecretsManager(appKey),
          },
          environmentVariables: {
            APP_ENV: appEnv.stringValue,
            APP_DEBUG: appDebug.stringValue,
            LOG_CHANNEL: logChannel.stringValue,
          },
        },
        repository: repo,
        tagOrDigest: 'latest',
      }),
      vpcConnector,
    });

    // Add WAF Web ACL
    const appWaf = new wafv2.CfnWebACL(this, "App-Runner-Waf", {
      defaultAction: { allow: {} },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "App-Runner-Waf",
      },
      rules: [
        // AWSManagedRulesCommonRuleSet
        {
          priority: 1,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "AWS-AWSManagedRulesCommonRuleSet",
          },
          name: "AWSManagedRulesCommonRuleSet",
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
        },
        // AWSManagedRulesKnownBadInputsRuleSet
        {
          name: "AWSManagedRulesKnownBadInputsRuleSet",
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: "AWSManagedRulesKnownBadInputsRuleSet",
          },
        },
      ],
    });

    // Attach Web ACL to App Runner
    new wafv2.CfnWebACLAssociation(this, "Waf-App-Runner", {
      webAclArn: appWaf.attrArn,
      resourceArn: appRunner.serviceArn,
    });

    // Output URI for App Runner Service
    new CfnOutput(this, "App-Runner-URI", { value: appRunner.serviceUrl });
  }
}
