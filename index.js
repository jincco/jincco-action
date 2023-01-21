const core = require('@actions/core');
const github = require('@actions/github');

try {
  const sourceDirectories = core.getInput('sourceDirectories');
  console.log(`Source Directories: ${sourceDirectories}`);
  const classDirectories = core.getInput('classDirectories');
  console.log(`Class Directories: ${classDirectories}`);
  const execFiles = core.getInput('execFiles');
  console.log(`Exec files: ${execFiles}`);
  const pullRequest = core.getInput('pullRequest');
  console.log(`Pull Request: ${pullRequest}`);

  const pullRequestCoverage = Math.random()*100;
  core.setOutput("pullRequestCoverage", pullRequestCoverage);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}