import App from './App.js';

try {
    let app = new App()
    app.sourceDirectories = ['src/main/java'];
    app.ignoreDirectories = ['src/test/java'];
    app.xmlReportFiles = ['build/reports/jacoco/test/jacocoTestReport.xml'];
    app.repoRootDirectory = "../demo-project"
    app.pullRequest = '1';
    app.serverUrl = 'http://localhost:8080';
    app.repository = 'jincco/demo-project';
    app.tokenType = process.env.GITHUB_TOKEN_TYPE || 'PAT';
    app.token = process.env.GITHUB_TOKEN;
    await app.execute()
} catch (e) {
    console.log(e);
    process.exit(1)
}