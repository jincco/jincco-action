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
    classDirectories = null;
    execFiles = null;
    pullRequest = null;
    serverUrl = null;
    repoRootDirectory = ".";

    constructor() {
    }

    /**
     * perform the tick
     */
    async execute() {
        for (let i =0; i< this.sourceDirectories.length; i++) {
            this.sourceDirectories[i]=path.resolve(this.repoRootDirectory, this.sourceDirectories[i])
        }
        console.log(`Source Directories: ${this.sourceDirectories}`);
        this.validateDirectories(this.sourceDirectories);
        
        for (let i =0; i< this.classDirectories.length; i++) {
            this.classDirectories[i]=path.resolve(this.repoRootDirectory, this.classDirectories[i])
        }
        console.log(`Class Directories: ${this.classDirectories}`);
        this.validateDirectories(this.classDirectories);
        
        for (let i =0; i< this.execFiles.length; i++) {
            this.execFiles[i]=path.resolve(this.repoRootDirectory, this.execFiles[i])
        }
        console.log(`Exec files: ${this.execFiles}`);
        this.validateFiles(this.execFiles);
        
        console.log(`Pull Request: ${this.pullRequest}`);
        if (!this.pullRequest) {
            console.log("Ignore event because it isn't a pul request");
            return
        }

        let zipFile = "target.zip";
        let mapping = await this.compressDirectories(zipFile)

        let requestPayload = {
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
            zip.addFolder(this.sourceDirectories[i], folder);
            mapping[folder] = await this.resolveToRelativeRepoPath(repoRootDirectoryReal, this.sourceDirectories[i])
        }

        for (let i =0; i< this.classDirectories.length; i++) {
            let folder = "classes/classes"+i
            zip.addFolder(this.classDirectories[i], folder);
            mapping[folder] = await this.resolveToRelativeRepoPath(repoRootDirectoryReal, this.classDirectories[i])
        }

        for (let i =0; i< this.execFiles.length; i++) {
            let folder = "execFiles/execFile"+i
            zip.addFile(this.execFiles[i], folder);
            mapping[folder] = await this.resolveToRelativeRepoPath(repoRootDirectoryReal, this.execFiles[i])
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
        const response = await fetch(this.serverUrl+"/analyze", {method: 'POST', body: form });


        // const formData = new FormData()
        // const zipFileUpload = new File( zipFile, { type: 'application/octet-stream' })

        // formData.set('requestPayload', JSON.stringify(requestPayload))
        // formData.set('file', zipFileUpload, 'target.zip')

        // const response = await fetch(this.serverUrl+"/uploaddata", { method: 'POST', body: formData })
        const data = await response.json()

        console.log(data)
        
    }
}

export default App;