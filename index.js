import core from '@actions/core';
import github from '@actions/github';

import App from './App.js';

function parseArray(str) {
    return str.split(",");
}

try {
  let app = new App()
  app.sourceDirectories = parseArray(core.getInput('sourceDirectories'));
  app.ignoreDirectories = parseArray(core.getInput('ignoreDirectories'));
  app.xmlReportFiles = parseArray(core.getInput('xmlReportFiles'));
  app.pullRequest = core.getInput('pullRequest');
  app.serverUrl = core.getInput('serverUrl');
  app.token = core.getInput('token');
  app.tokenType = core.getInput('tokenType');
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