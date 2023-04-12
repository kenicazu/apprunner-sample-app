#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppRunnerStack } from '../lib/cdk-app-runner-stack';
import { BaseStack } from "../lib/cdk-base-stack";

const app = new cdk.App();
const base = new BaseStack(app, "BaseStack");
new AppRunnerStack(app, 'AppRunnerStack', {
  vpc: base.vpc,
  containerRepository: base.containerRepository,
  rdsV2: base.rdsV2,
});