import App from './App.js';

try {
    let app = new App()
    app.sourceDirectories = ['src/main/java'];
    app.classDirectories = ['build/classes/java/main'];
    app.execFiles = ['build/jacoco/test.exec'];
    app.repoRootDirectory = "../demo-project"
    app.pullRequest = '1';
    app.serverUrl = 'https://jinccov.com';
    app.repository = 'jincco/demo-project';
    app.tokenType = process.env.GITHUB_TOKEN_TYPE || 'PAT';
    app.token = process.env.GITHUB_TOKEN;
    await app.execute()
} catch (e) {
    console.log(e);
    process.exit(1)
}