#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppRunnerStack } from '../lib/cdk-app-runner-stack';
import { BaseStack } from "../lib/cdk-base-stack";

const app = new cdk.App();
const baseStack = new BaseStack(app, "BaseStack");

const apprunnerStack = new AppRunnerStack(app, 'AppRunnerStack', {
  vpc: baseStack.vpc,
  containerRepository: baseStack.containerRepository,
  rdsV2: baseStack.rdsV2,
});

apprunnerStack.addDependency(baseStack);