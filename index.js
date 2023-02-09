import core from '@actions/core';
import github from '@actions/github';

import App from './App.js';

function parseArray(str) {
    return str.split(",");
}

try {
  let app = new App()
  app.sourceDirectories = parseArray(core.getInput('sourceDirectories'));
  app.classDirectories = parseArray(core.getInput('classDirectories'));
  app.execFiles = parseArray(core.getInput('execFiles'));
  app.pullRequest = core.getInput('pullRequest');
  app.serverUrl = core.getInput('serverUrl');
  app.token = core.getInput('token');
  app.repository = core.getInput('repository');
  app.repositoryOwner = core.getInput('repositoryOwner');
  
  await app.execute()
  

  const pullRequestCoverage = Math.random()*100;
  core.setOutput("pullRequestCoverage", pullRequestCoverage);
  // Get the JSON webhook payload for the event that triggered the workflow
//   const payload = JSON.stringify(github.context.payload, undefined, 2)
//   console.log(`The event payload: ${payload}`);

} catch (error) {
  core.setFailed(error.message);
}