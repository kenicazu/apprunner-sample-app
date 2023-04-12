import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as aws_ecr from "aws-cdk-lib/aws-ecr";
import { CfnOutput } from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds'
import { Aspects } from 'aws-cdk-lib';
import { InstanceType, Vpc } from 'aws-cdk-lib/aws-ec2';


export class BaseStack extends cdk.Stack {
  public readonly vpc: Vpc;
  public readonly containerRepository: aws_ecr.Repository;
  public readonly rdsV2: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create ECR Private Repository
    this.containerRepository = new aws_ecr.Repository(this, "app-runner", {
      repositoryName: "app-runner",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Aurora Serverless V2 MySQL
    this.rdsV2 = new rds.DatabaseCluster(this, `RDS-V2-Cluster`, {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_02_0
      }),
      defaultDatabaseName: 'apprunnerdb',
      clusterIdentifier: 'cdk-apprunner-db',
      credentials: rds.Credentials.fromGeneratedSecret('laravel'),
      instances: 2,
      instanceProps: {
        instanceType: new InstanceType('serverless'),
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        publiclyAccessible: false,
      },
    })
    Aspects.of(this.rdsV2).add({
      visit(node) {
        if (node instanceof rds.CfnDBCluster) {
          node.serverlessV2ScalingConfiguration = {
            minCapacity: 0.5,
            maxCapacity: 1
          }
        }
      }
    })

    new CfnOutput(this, "RepositoryUri", { value: this.containerRepository.repositoryUri });

  }
}
