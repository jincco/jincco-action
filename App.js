import path from 'path';

import fs from 'fs';
import zl from 'zip-lib';
// import fetch, { FormData, File, fileFrom } from 'node-fetch'
// const FormData = require('form-data');
// const http = require('http');
// const zl = require("zip-lib");
import fetch from 'node-fetch'
import FormData from 'form-data'


class App {
    sourceDirectories = null;
    xmlReportFiles = null;
    pullRequest = null;
    serverUrl = null;
    repoRootDirectory = ".";
    token = null;
    tokenType = null;
    repository = null;
	repositoryOwner = null;

    constructor() {
    }

    /**
     * perform the tick
     */
    async execute() {
        console.log(`Repository name: ${this.repository}`);
        console.log(`Repository owner: ${this.repositoryOwner}`);

        if (this.repository && this.repository.includes('/') && this.repositoryOwner){
            throw {
                message: `Owner can be specified in an only input: 'repository' or 'repositoryOwner'`
            }
        }

        if (this.repository && this.repository.includes('/')) {
            let parts = this.repository.split('/', 2);
            this.repositoryOwner = parts[0];
            this.repository = parts[1];
        }
        if (!this.repository) {
            throw {
                message: `Please specify 'repository' in the action configuration, either as <repo_name> or <owner>/<repo_name>`
            }
        }
        if (!this.repositoryOwner) {
            throw {
                message: `Please specify 'repositoryOwner' in the action configuration`
            }
        }

        for (let i =0; i< this.sourceDirectories.length; i++) {
            this.sourceDirectories[i]=path.resolve(this.repoRootDirectory, this.sourceDirectories[i])
        }
        console.log(`Source Directories: ${this.sourceDirectories}`);
        this.validateDirectories(this.sourceDirectories);
        
        for (let i =0; i< this.xmlReportFiles.length; i++) {
            this.xmlReportFiles[i]=path.resolve(this.repoRootDirectory, this.xmlReportFiles[i])
        }
        console.log(`Jacoco XML reports: ${this.xmlReportFiles}`);
        this.validateFiles(this.xmlReportFiles);
        
        console.log(`Pull Request: ${this.pullRequest}`);
        if (!this.pullRequest) {
            console.log("Ignore event because it isn't a pul request");
            return
        }

        let zipFile = "report.zip";
        let mapping = await this.compressDirectories(zipFile)

        let requestPayload = {
            repository: this.repository,
	        repositoryOwner: this.repositoryOwner,
            pullRequest: Number(this.pullRequest),
            mapping: mapping
        }
        
        
        return await this.uploadJinccoFiles(zipFile, requestPayload);

        
    }

    async compressDirectories(zipFile) {
        const zip = new zl.Zip();

        let repoRootDirectoryReal = await fs.promises.realpath(this.repoRootDirectory);
        console.log("Repo root directory:", repoRootDirectoryReal);
        // Adds a file from the file system
        // FIXME this code will create an issue when absolute paths are used
        // The way to fix it is to pass mapping to Server, so it could process patch file properly
        let mapping = {}
        for (let i =0; i< this.sourceDirectories.length; i++) {
            let folder = "src/src"+i
            mapping[folder] = await this.resolveToRelativeRepoPath(repoRootDirectoryReal, this.sourceDirectories[i])
        }

        for (let i =0; i< this.xmlReportFiles.length; i++) {
            let folder = "xmlReportFiles/report"+i+".xml"
            zip.addFile(this.xmlReportFiles[i], folder);
            mapping[folder] = await this.resolveToRelativeRepoPath(repoRootDirectoryReal, this.xmlReportFiles[i])
        }
        
        // Generate zip file.
        await zip.archive(zipFile);

        return mapping;
    }

    async resolveToRelativeRepoPath(root, dir){
        const realDirPath = await fs.promises.realpath(dir);
        if (!realDirPath.startsWith(root)) {
            throw {
                message: `Specified directory ${realDirPath} is outside of project root ${root}`
            }
        }
        let relativePath = realDirPath.substring(root.length+1);
        return path.sep != "/"? relativePath.split(path.sep).join("/"): relativePath;
    }


    validateDirectory(dir) {
        let stats = fs.lstatSync(dir);
        
        // Is it a directory?
        if (stats.isDirectory()) {
            // Yes it is
            return;
        }
        throw {
            message: `Path ${dir} isn't existing directory`
        }
    }

    validateDirectories(dirs) {
        for (let i = 0; i < dirs.length; i++) {
            this.validateDirectory(dirs[i])
        }
    }

    validateFile(file) {
        let stats = fs.lstatSync(file);

        // Is it a directory?
        if (stats.isFile()) {
            // Yes it is
            return;
        }
        throw {
            message: `Path ${file} isn't existing file`
        }
    }

    validateFiles(files) {
        for (let i = 0; i < files.length; i++) {
            this.validateFile(files[i])
        }
    }

    async uploadJinccoFiles(zipFile, requestPayload) {
        const form = new FormData();

        let requestPayloadStr = JSON.stringify(requestPayload);
        console.log(requestPayloadStr);
        
        form.append('requestPayload', requestPayloadStr);
        form.append('file', fs.createReadStream(zipFile)); 
        const headers = {
            authToken: this.token,
            authTokenType: this.tokenType
        }
        let url = this.serverUrl+"/analyze"
        console.time("analyze");
        const response = await fetch(url, {method: 'POST', body: form, headers: headers});
        console.timeEnd("analyze");
        let dataTxt = await response.text();
        console.log(`Executed request: POST ${url}, reponseStatus: ${response.status}, responseBody: ${dataTxt}`)
        let data = null;
        try {
            data = JSON.parse(dataTxt)
        } catch (e) {
            // do nothing
        }
        if (!data) {
            console.log(`Response isn't JSON, status ${response.status}, response: ${dataTxt}`)
            throw new Error(`Unexpected response format: status ${response.status}, response: ${dataTxt}`);
        } else if (!response.ok) {
            const message = `An error has occured: ${response.status} ${data.error}`;
            throw new Error(message);
        }
    }
}

export default App;