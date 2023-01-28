import App from './App.js';

try {
    let app = new App()
    app.sourceDirectories = ['src/main/java'];
    app.classDirectories = ['build/classes/java/main'];
    app.execFiles = ['build/jacoco/test.exec'];
    app.repoRootDirectory = "../demo-project"
    app.pullRequest = '1';
    app.serverUrl = 'http://localhost:8080';
    await app.execute()
} catch (e) {
    console.log(e);
    process.exit(1)
}